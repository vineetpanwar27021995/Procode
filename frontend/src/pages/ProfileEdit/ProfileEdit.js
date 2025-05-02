import React, { useState, useEffect, useRef } from 'react';
// Adjust path based on your actual file structure
import styles from '../../styles/ProfileEdit.module.css';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { useAuthStore } from '../../stores/authStore'; // Adjust path
import { useThemeStore } from '../../stores/themeStore'; // Adjust path
import { useSnackbarStore } from '../../stores/snackbarStore'; // Adjust path
import { MdOutlineKeyboardArrowLeft as BackIcon, MdEdit as EditIcon, MdOutlineSave as SaveIcon, MdLogout as LogoutIcon, MdLockReset as PasswordIcon, MdOutlineWbSunny as SunIcon, MdOutlineDarkMode as MoonIcon } from 'react-icons/md';
import { FiUser, FiLoader } from 'react-icons/fi'; // Loader icon for buttons
import Loader from '../../components/Loader/Loader'; // ** Import Loader **

// Options for selects
const pronounOptions = ["Not Specified", "He/Him", "She/Her", "They/Them", "Other"];
const languageOptions = ["Not Specified", "Javascript", "Java", "Python", "C++"];

const ProfileEditScreen = () => {
    const navigate = useNavigate();

    // Stores
    // Use profileDataLoading specifically for the initial fetch
    const { userProfile, loading: profileDataLoading, error: profileError, fetchUserProfile, updateProfile, uploadAndUpdateProfilePicture, loadingImage, requestPasswordResetEmail } = useUserStore();
    const { logout } = useAuthStore();
    const { darkMode, toggleDarkMode } = useThemeStore();
    const { showSnackbar } = useSnackbarStore();

    // Local State for form fields
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    // Local saving state, distinct from store's loading states
    const [isSaving, setIsSaving] = useState(false);

    const fileInputRef = useRef(null);

    // Populate form when userProfile loads or changes
    useEffect(() => {
        // Check if profile exists in store synchronously first
        const currentProfile = useUserStore.getState().userProfile;
        const isLoading = useUserStore.getState().loading;

        if (currentProfile) {
            setName(currentProfile.name || '');
            setPronouns(currentProfile.pronouns || 'Not Specified');
            setPreferredLanguage(currentProfile.preferredLanguage || 'Not Specified');
            setImagePreview(currentProfile.photoURL || null);
            console.log("ProfileEdit: Form populated from store.");
        } else if (!isLoading) { // Fetch only if not loaded and not currently loading
             console.log("ProfileEdit: Fetching user profile...");
             fetchUserProfile();
        }
    }, [userProfile, fetchUserProfile]); // Rerun when userProfile changes

    // Handle image selection
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => { setImagePreview(reader.result); };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setImagePreview(userProfile?.photoURL || null);
            showSnackbar("Please select a valid image file.", "error");
        }
    };

    // Trigger hidden file input click
    const handleImageClick = () => {
        if (loadingImage) return; // Prevent changing while upload is in progress
        fileInputRef.current?.click();
    };

    const changeTheme = () => {
        toggleDarkMode();
    }

    // Handle saving profile changes
    const handleSaveChanges = async () => {
        // Prevent saving if already saving or uploading image
        if (isSaving || loadingImage) return;

        setIsSaving(true); // Start local saving indicator
        let changesMade = false;
        let overallSuccess = true;

        // --- Image Upload (uses loadingImage from store) ---
        if (selectedFile) {
            console.log('Uploading selected file:', selectedFile.name);
            // uploadAndUpdateProfilePicture already sets loadingImage in the store
            const uploadResult = await uploadAndUpdateProfilePicture(selectedFile);
            if (!uploadResult.success) {
                showSnackbar(uploadResult.error || 'Failed to upload image.', 'error');
                overallSuccess = false;
                setIsSaving(false); // Stop local saving indicator on failure
                return;
            }
            changesMade = true;
            setSelectedFile(null);
        }

        // --- Text Field Update ---
        const updateData = {};
        if (name !== (userProfile?.name || '')) updateData.name = name;
        if (pronouns !== (userProfile?.pronouns || 'Not Specified')) updateData.pronouns = pronouns;
        if (preferredLanguage !== (userProfile?.preferredLanguage || 'Not Specified')) updateData.preferredLanguage = preferredLanguage;

        if (Object.keys(updateData).length > 0) {
            console.log('Updating profile fields:', updateData);
            // updateProfile sets profileDataLoading in the store, but we use local isSaving
            const updateResult = await updateProfile(updateData);
            if (!updateResult.success) {
                showSnackbar(updateResult.error || 'Failed to save profile changes.', 'error');
                overallSuccess = false;
            } else {
                changesMade = true;
            }
        }

        setIsSaving(false); // Finished attempting saves

        // Show feedback based on outcome
        if (changesMade && overallSuccess) {
            showSnackbar('Profile updated successfully!', 'success');
        } else if (changesMade && !overallSuccess) {
            showSnackbar('Some profile updates failed.', 'warning');
        } else if (!changesMade) { // Only show if no image was selected either
             showSnackbar('No changes detected to save.', 'info');
        }
    };

    // Handle password reset request
    const handleChangePassword = async () => {
        showSnackbar('Sending password reset email...', 'info');
        const result = await requestPasswordResetEmail();
        if (result.success) {
            showSnackbar('Password reset email sent! Check your inbox.', 'success');
        } else {
            showSnackbar(result.error || 'Failed to send password reset email.', 'error');
        }
    };

    // Handle logout
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    // Determine if any changes have been made for enabling save button
    const hasChanges = selectedFile ||
                       name !== (userProfile?.name || '') ||
                       pronouns !== (userProfile?.pronouns || 'Not Specified') ||
                       preferredLanguage !== (userProfile?.preferredLanguage || 'Not Specified');

    const currentPhoto = imagePreview;

    // --- MODIFIED: Show full loader ONLY during initial profile fetch ---
    if (profileDataLoading && !userProfile) {
        return <Loader message="Loading Profile..." />;
    }

    return (
        <div className={styles.editContainer}>
            {/* --- REMOVED: Loader overlay for saving/uploading --- */}
            {/* {showLoader && userProfile && <Loader message={loadingImage ? "Uploading Image..." : "Saving..."} />} */}

            {/* Header */}
            <div className={styles.editHeader}>
                 {/* Disable back button while saving or uploading */}
                <button onClick={() => navigate(-1)} className={styles.backButton} disabled={isSaving || loadingImage}>
                    <BackIcon size={28} /> Back
                </button>
                <h1 className={styles.editTitle}>Edit Profile</h1>
            </div>

            {/* Display error if profile fetch failed and profile is still null */}
            {profileError && !userProfile && (
                <p className={styles.errorText}>Error loading profile: {profileError}</p>
            )}

            {/* Render form only if profile exists */}
            {/* We check userProfile directly now, as the main loader handles the initial fetch state */}
            {userProfile ? (
                <>
                    {/* Profile Picture Section */}
                    <div className={styles.pictureSection}>
                        <div className={styles.pictureWrapper} onClick={handleImageClick} title="Change profile picture">
                            {currentPhoto ? (
                                <img src={currentPhoto} alt="Profile" className={styles.profileImage} />
                            ) : (
                                <FiUser size={40} className={styles.profileIconPlaceholder} />
                            )}
                            {/* Only show edit icon when not uploading */}
                            {!loadingImage && (
                                <div className={styles.editIconOverlay}>
                                    <EditIcon size={18} />
                                </div>
                            )}
                            {/* Loader Overlay specifically for image upload */}
                            {loadingImage && (
                                <div className={styles.loaderOverlay}>
                                    <FiLoader size={24} className={styles.loaderAnimation} />
                                </div>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageChange}
                            accept="image/png, image/jpeg, image/webp"
                            style={{ display: 'none' }}
                            disabled={loadingImage || isSaving} // Disable while loading/saving
                        />
                    </div>

                    {/* Form Fields */}
                    <div className={styles.formSection}>
                        <div className={styles.formGroup}>
                            <label htmlFor="name" className={styles.label}>Name</label>
                            <input
                                type="text"
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className={styles.input}
                                placeholder="Enter your name"
                                disabled={isSaving || loadingImage} // Disable while saving/uploading
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="pronouns" className={styles.label}>Pronouns</label>
                            <select
                                id="pronouns"
                                value={pronouns}
                                onChange={(e) => setPronouns(e.target.value)}
                                className={styles.select}
                                disabled={isSaving || loadingImage}
                            >
                                {pronounOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="language" className={styles.label}>Preferred Language</label>
                            <select
                                id="language"
                                value={preferredLanguage}
                                onChange={(e) => setPreferredLanguage(e.target.value)}
                                className={styles.select}
                                disabled={isSaving || loadingImage}
                            >
                                {languageOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Settings Section */}
                    <div className={styles.settingsSection}>
                         <div className={styles.settingItem}>
                            <span className={styles.settingLabel}>Theme</span>
                            <button onClick={changeTheme} className={styles.themeToggleButton} disabled={isSaving || loadingImage}>
                                {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                                <span className={styles.themeToggleText}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                            </button>
                         </div>
                         <div className={styles.settingItem}>
                            <span className={styles.settingLabel}>Password</span>
                             <button onClick={handleChangePassword} className={styles.settingButton} disabled={isSaving || loadingImage}>
                                <PasswordIcon size={20}/> Change Password
                             </button>
                         </div>
                         <div className={styles.settingItem}>
                             <span className={styles.settingLabel}>Account</span>
                             <button onClick={handleLogout} className={`${styles.settingButton} ${styles.logoutButton}`} disabled={isSaving || loadingImage}>
                                <LogoutIcon size={20}/> Logout
                             </button>
                         </div>
                    </div>


                    {/* Save Button */}
                    <div className={styles.saveButtonContainer}>
                        <button
                            onClick={handleSaveChanges}
                            className={styles.saveButton}
                            // Disable if no changes OR locally saving OR image uploading
                            disabled={!hasChanges || isSaving || loadingImage}
                        >
                            {/* Show loader based on local saving OR image upload */}
                            {isSaving || loadingImage ? (
                                <FiLoader size={20} className={styles.loaderAnimation} />
                            ) : (
                                <SaveIcon size={20} />
                            )}
                            {/* Change button text based on action */}
                            {isSaving ? 'Saving...' : (loadingImage ? 'Uploading...' : 'Save Changes')}
                        </button>
                    </div>
                </>
            ) : (
                 // Optional: Show a message if profile exists but couldn't be loaded due to error
                 profileError && <p className={styles.errorText}>Could not load profile data.</p>
            )}

        </div>
    );
};

export default ProfileEditScreen;
