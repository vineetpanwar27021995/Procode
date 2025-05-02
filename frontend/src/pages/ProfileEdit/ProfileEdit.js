import React, { useState, useEffect, useRef } from 'react';
import styles from '../../styles/ProfileEdit.module.css'; // Create this CSS module
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { useAuthStore } from '../../stores/authStore'; // Adjust path
import { useThemeStore } from '../../stores/themeStore'; // Adjust path
import { useSnackbarStore } from '../../stores/snackbarStore'; // Adjust path
import { MdOutlineKeyboardArrowLeft as BackIcon, MdEdit as EditIcon, MdOutlineSave as SaveIcon, MdLogout as LogoutIcon, MdLockReset as PasswordIcon, MdOutlineWbSunny as SunIcon, MdOutlineDarkMode as MoonIcon } from 'react-icons/md';
import { FiUser, FiLoader } from 'react-icons/fi'; // Loader icon

// Options for selects
const pronounOptions = ["Not Specified", "He/Him", "She/Her", "They/Them", "Other"];
const languageOptions = ["Not Specified", "Javascript", "Java", "Python", "C++"];

const ProfileEdit = () => {
    const navigate = useNavigate();

    // Stores
    const { userProfile, loading: profileLoading, error: profileError, fetchUserProfile, updateProfile, uploadAndUpdateProfilePicture, loadingImage, requestPasswordResetEmail } = useUserStore();
    const { logout } = useAuthStore();
    const { darkMode, toggleDarkMode } = useThemeStore();
    const { showSnackbar } = useSnackbarStore();

    // Local State for form fields
    const [name, setName] = useState('');
    const [pronouns, setPronouns] = useState('');
    const [preferredLanguage, setPreferredLanguage] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false); // Loading state for save button

    const fileInputRef = useRef(null); // Ref for hidden file input

    // Populate form when userProfile loads or changes
    useEffect(() => {
        if (userProfile) {
            setName(userProfile.name || '');
            setPronouns(userProfile.pronouns || 'Not Specified');
            setPreferredLanguage(userProfile.preferredLanguage || 'Not Specified');
            setImagePreview(userProfile.photoURL || null); // Set initial image preview
        } else if (!profileLoading) { // Fetch only if not loaded and not currently loading
             fetchUserProfile();
        }
    }, [userProfile, fetchUserProfile, profileLoading]); // Rerun when userProfile changes or loading finishes

    // Handle image selection
    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            console.log('image',file)
            setSelectedFile(file);
            // Create a preview URL
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setImagePreview(userProfile?.photoURL || null); // Revert preview if invalid file
            showSnackbar("Please select a valid image file.", "error");
        }
    };

    // Trigger hidden file input click
    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    // Handle saving profile changes
    const handleSaveChanges = async () => {
        setIsSaving(true); // Show saving indicator
        let changesMade = false;

        // 1. Upload Image if selected
        if (selectedFile) {
            console.log(selectedFile,'file')
            const uploadResult = await uploadAndUpdateProfilePicture(selectedFile);
            if (!uploadResult.success) {
                showSnackbar(uploadResult.error || 'Failed to upload image.', 'error');
                setIsSaving(false);
                return; // Stop saving if image upload fails
            }
            changesMade = true; // Image change counts as a change
            // User profile state is updated within the store action after backend response
        }

        // 2. Prepare other data for Firestore update (only changed fields)
        const updateData = {};
        if (name !== (userProfile?.name || '')) updateData.name = name;
        if (pronouns !== (userProfile?.pronouns || 'Not Specified')) updateData.pronouns = pronouns;
        if (preferredLanguage !== (userProfile?.preferredLanguage || 'Not Specified')) updateData.preferredLanguage = preferredLanguage;

        // 3. Update other profile fields if changed
        if (Object.keys(updateData).length > 0) {
            const updateResult = await updateProfile(updateData);
            if (!updateResult.success) {
                showSnackbar(updateResult.error || 'Failed to save profile changes.', 'error');
                // Don't necessarily stop if only text fields failed but image succeeded
            } else {
                changesMade = true; // Text change counts as a change
            }
        }

        setIsSaving(false); // Hide saving indicator

        if (changesMade) {
            showSnackbar('Profile updated successfully!', 'success');
            setSelectedFile(null); // Clear selected file after successful save
        } else {
            showSnackbar('No changes detected.', 'info');
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
        logout(); // Call logout action from auth store
        navigate('/login', { replace: true }); // Redirect to login
    };

    // Determine if any changes have been made for enabling save button
    const hasChanges = selectedFile ||
                       name !== (userProfile?.name || '') ||
                       pronouns !== (userProfile?.pronouns || 'Not Specified') ||
                       preferredLanguage !== (userProfile?.preferredLanguage || 'Not Specified');

    const currentPhoto = imagePreview; // Use the preview if available

    return (
        <div className={styles.editContainer}>
            {/* Header */}
            <div className={styles.editHeader}>
                <button onClick={() => navigate(-1)} className={styles.backButton}>
                    <BackIcon size={28} /> Back
                </button>
                <h1 className={styles.editTitle}>Edit Profile</h1>
            </div>

            {/* Profile Picture Section */}
            <div className={styles.pictureSection}>
                <div className={styles.pictureWrapper} onClick={handleImageClick} title="Change profile picture">
                    {currentPhoto ? (
                        <img src={currentPhoto} alt="Profile" className={styles.profileImage} />
                    ) : (
                        <FiUser size={40} className={styles.profileIconPlaceholder} />
                    )}
                    <div className={styles.editIconOverlay}>
                        <EditIcon size={18} />
                    </div>
                    {/* Loader Overlay */}
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
                    accept="image/png, image/jpeg, image/webp" // Specify accepted types
                    style={{ display: 'none' }} // Hide the actual input
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
                        disabled={profileLoading || isSaving || loadingImage} // Disable while loading/saving
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="pronouns" className={styles.label}>Pronouns</label>
                    <select
                        id="pronouns"
                        value={pronouns}
                        onChange={(e) => setPronouns(e.target.value)}
                        className={styles.select}
                        disabled={profileLoading || isSaving || loadingImage}
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
                         disabled={profileLoading || isSaving || loadingImage}
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
                    <button onClick={toggleDarkMode} className={styles.themeToggleButton}>
                        {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
                        <span className={styles.themeToggleText}>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                 </div>
                 <div className={styles.settingItem}>
                    <span className={styles.settingLabel}>Password</span>
                     <button onClick={handleChangePassword} className={styles.settingButton}>
                        <PasswordIcon size={20}/> Change Password
                     </button>
                 </div>
                 <div className={styles.settingItem}>
                     <span className={styles.settingLabel}>Account</span>
                     <button onClick={handleLogout} className={`${styles.settingButton} ${styles.logoutButton}`}>
                        <LogoutIcon size={20}/> Logout
                     </button>
                 </div>
            </div>


            {/* Save Button */}
            <div className={styles.saveButtonContainer}>
                <button
                    onClick={handleSaveChanges}
                    className={styles.saveButton}
                    disabled={!hasChanges || isSaving || loadingImage || profileLoading}
                >
                    {isSaving || loadingImage ? (
                        <FiLoader size={20} className={styles.loaderAnimation} />
                    ) : (
                        <SaveIcon size={20} />
                    )}
                    Save Changes
                </button>
            </div>

             {/* Display Profile Loading/Error
             {profileLoading && !userProfile && <p className={styles.infoText}>Loading profile data...</p>}
             {profileError && <p className={styles.errorText}>Error: {profileError}</p>} */}

        </div>
    );
};

export default ProfileEdit;

