import styles from '../../styles/Profile.module.css'; // Shared CSS module
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { useProblemStore } from '../../stores/problemStore'; // ** NEW: Import Problem Store **
import { MdOutlineKeyboardArrowLeft as BackIcon, MdSettings } from 'react-icons/md';
import { FiUser } from 'react-icons/fi';

// Import Tab Components
import ActivityTab from '../../components/Profile/ActivityTab'; // Adjust path
import StatsTab from '../../components/Profile/StatsTab';       // Adjust path
import AchievementsTab from '../../components/Profile/AchievementsTab'; // Adjust path

const Profile = () => {
    const navigate = useNavigate();
    const { userProfile, loading: userLoading, error: userError, fetchUserProfile } = useUserStore();
    // ** NEW: Get problem data state and actions **
    const { categories, roadmap, loading: problemsLoading, fetchCategories, fetchRoadmap } = useProblemStore();
    const [activeTab, setActiveTab] = useState('Stats'); // Default to 'Stats'
  
    // Fetch profile and problem data if not already loaded
    useEffect(() => {
      if (!userProfile && !userLoading) {
        fetchUserProfile();
      }
      // Fetch categories and roadmap if needed by child tabs (StatsTab needs them)
      if ((!categories || Object.keys(categories).length === 0) && !problemsLoading) {
          fetchCategories();
      }
       if ((!roadmap || roadmap.length === 0) && !problemsLoading) {
          fetchRoadmap();
      }
    }, [userProfile, userLoading, fetchUserProfile, categories, roadmap, problemsLoading, fetchCategories, fetchRoadmap]);
  
    const userName = userProfile?.name || 'User';
    const userImage = userProfile?.photoURL; // Assuming photoURL exists
  
    const renderTabContent = () => {
      // Pass necessary data down to tabs if they need it directly
      // Or they can access the stores themselves
      switch (activeTab) {
        case 'Activity':
          return <ActivityTab />; // ActivityTab now shows achievements list
        case 'Achievements':
          return <AchievementsTab />; // AchievementsTab shows Level, Submissions, Badges
        case 'Stats':
        default:
          return <StatsTab />; // StatsTab shows Activity Grid, Heatmap, Radar Charts
      }
    };
  
    // Determine if data is still loading
    const isLoading = userLoading || problemsLoading;
  
    const goToSettings = () => {
        navigate('/me/edit'); // Navigate to edit screen
    };
  
    return (
      <div className={styles.profileContainer}>
        {/* Header */}
        <div className={styles.profileHeader}>
          <button onClick={() => navigate(-1)} className={styles.backButton}>
            <BackIcon size={28} /> Back
          </button>
          {/* --- Settings Button --- */}
          <button onClick={goToSettings} className={styles.settingsButton}>
              <MdSettings size={24} />
          </button>
        </div>
  
        {/* User Info */}
        <div className={styles.userInfoSection}>
          <div className={styles.profilePicture}>
            {userImage ? <img src={userImage} alt={userName} /> : <FiUser size={30} />}
          </div>
          <h2 className={styles.userName}>{userLoading ? 'Loading...' : userName}</h2>
          {userError && <p className={styles.errorText}>Failed to load profile</p>}
        </div>
  
        {/* Tabs */}
        <div className={styles.tabContainer}>
          {/* ** UPDATED: Changed tab order to match screenshot ** */}
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
          {/* Show loading indicator until all required data is fetched */}
          {isLoading ? <p>Loading data...</p> : renderTabContent()}
        </div>
      </div>
    );
  };

export default Profile;
