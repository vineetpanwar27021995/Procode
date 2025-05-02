import React, { useState, useEffect } from 'react';
import styles from '../../styles/Profile.module.css'; // Shared CSS module
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { useProblemStore } from '../../stores/problemStore'; // Import Problem Store
import { MdOutlineKeyboardArrowLeft as BackIcon, MdSettings } from 'react-icons/md';
import { FiUser } from 'react-icons/fi';
import Loader from '../../components/Loader/Loader'; // Import Loader

// Import Tab Components
import ActivityTab from '../../components/Profile/ActivityTab'; // Adjust path
import StatsTab from '../../components/Profile/StatsTab';       // Adjust path
import AchievementsTab from '../../components/Profile/AchievementsTab'; // Adjust path

const Profile = () => {
  const navigate = useNavigate();
  // Get state and fetch actions from stores
  const { userProfile, loading: userLoading, error: userError, fetchUserProfile } = useUserStore();
  const { categories, roadmap, loading: problemsLoading, error: problemsError, fetchCategories, fetchRoadmap } = useProblemStore();
  const [activeTab, setActiveTab] = useState('Stats'); // Default to 'Stats'

  // Fetch profile and problem data if not already loaded
  useEffect(() => {
    // Use getState to check synchronously if data exists before fetching
    if (!useUserStore.getState().userProfile && !useUserStore.getState().loading) {
      console.log("ProfileScreen: Fetching user profile...");
      fetchUserProfile();
    }
    if ((!useProblemStore.getState().categories || Object.keys(useProblemStore.getState().categories).length === 0) && !useProblemStore.getState().loading) {
        console.log("ProfileScreen: Fetching categories...");
        fetchCategories();
    }
     if ((!useProblemStore.getState().roadmap || useProblemStore.getState().roadmap.length === 0) && !useProblemStore.getState().loading) {
        console.log("ProfileScreen: Fetching roadmap...");
        fetchRoadmap();
    }
  }, [fetchUserProfile, fetchCategories, fetchRoadmap]); // Dependencies are stable fetch functions

  const userName = userProfile?.name || 'User';
  const userImage = userProfile?.photoURL;

  const renderTabContent = () => {
    // Child components will access stores directly for data
    // They will only render when the parent determines loading is complete
    switch (activeTab) {
      case 'Activity':
        return <ActivityTab />;
      case 'Achievements':
        return <AchievementsTab />;
      case 'Stats':
      default:
        return <StatsTab />;
    }
  };

  // --- MODIFIED: Determine overall loading/readiness state ---
  // Data is considered ready only when *all* loading flags are false
  // AND all necessary data objects/arrays actually exist and are populated.
  const isDataReady =
        !userLoading &&
        !problemsLoading &&
        userProfile !== null && // Check if profile object exists
        categories !== null && Object.keys(categories).length > 0 && // Check if categories object is populated
        roadmap !== null && roadmap.length > 0; // Check if roadmap array is populated

  const goToSettings = () => {
      navigate('/me/edit'); // Corrected path based on previous App.jsx update
  };

  // --- MODIFIED: Render Loader or Content ---
  // Show loader if data is NOT ready yet
  if (!isDataReady) {
      // You can add more specific messages based on which store is loading
      let loadingMessage = "Loading Profile...";
      if (userLoading) loadingMessage = "Loading User Data...";
      else if (problemsLoading) loadingMessage = "Loading Problem Data...";
      else if (!userProfile) loadingMessage = "Waiting for User Profile...";
      else if (!categories || Object.keys(categories).length === 0) loadingMessage = "Waiting for Categories...";
      else if (!roadmap || roadmap.length === 0) loadingMessage = "Waiting for Roadmap...";

      return <Loader message={loadingMessage} />;
  }

  // Render content only when loading is complete and data is available
  return (
    <div className={styles.profileContainer}>
      {/* Header */}
      <div className={styles.profileHeader}>
        <button onClick={() => navigate(-1)} className={styles.backButton}>
          <BackIcon size={28} /> Back
        </button>
        <button onClick={goToSettings} className={styles.settingsButton}>
            <MdSettings size={24} />
        </button>
      </div>

      {/* User Info - Render even if there was an error fetching, show fallback */}
      <div className={styles.userInfoSection}>
        <div className={styles.profilePicture}>
          {userImage ? <img src={userImage} alt={userName} /> : <FiUser size={30} />}
        </div>
        <h2 className={styles.userName}>{userName}</h2>
        {/* Display specific errors if needed */}
        {userError && <p className={styles.errorText}>Failed to load profile details.</p>}
        {problemsError && <p className={styles.errorText}>Failed to load problem data.</p>}
      </div>

      {/* Tabs */}
      <div className={styles.tabContainer}>
        <button
          className={`${styles.tabButton} ${activeTab === 'Stats' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('Stats')}
        >
          STATS
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'Achievements' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('Achievements')}
        >
          ACHIEVEMENTS
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'Activity' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('Activity')}
        >
          ACTIVITY
        </button>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContentContainer}>
        {/* Render tab content - child components handle their own errors if needed */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Profile;
