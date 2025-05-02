import styles from '../../styles/BottomNavBar.module.css';
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiUser } from 'react-icons/fi';
import { RiCodeSSlashFill } from 'react-icons/ri';
import { useProblemStore } from '../../stores/problemStore'; // Adjust path if needed
import { useSnackbarStore } from '../../stores/snackbarStore'; // Adjust path if needed

const BottomNavBar = () => {
  const navigate = useNavigate();
  const { categories } = useProblemStore();
  const { showSnackbar } = useSnackbarStore();

  // Helper function for Home and Profile NavLinks
  // This will now only apply the active *color*, not background
  const getNavLinkClass = ({ isActive }) => {
    return isActive ? `${styles.navItem} ${styles.active}` : styles.navItem;
  };

  const handleRandomClick = () => {
    console.log("Random button clicked. Categories:", categories);
    if (!categories || Object.keys(categories).length === 0) {
      showSnackbar("Problem data not loaded yet. Please wait.", "info");
      return;
    }
    const validCategoryKeys = Object.keys(categories).filter(
      key => categories[key] && Object.keys(categories[key]).length > 0
    );
    if (validCategoryKeys.length === 0) {
        showSnackbar("No problems available to select.", "warning");
        return;
    }
    const randomCategoryKey = validCategoryKeys[Math.floor(Math.random() * validCategoryKeys.length)];
    const problemsInCategory = categories[randomCategoryKey];
    const problemIds = Object.keys(problemsInCategory);
    if (problemIds.length === 0) {
         showSnackbar("Selected category has no problems.", "warning");
         return;
    }
    const randomProblemId = problemIds[Math.floor(Math.random() * problemIds.length)];
    const targetUrl = `/${randomCategoryKey}/solve/${randomProblemId}`;
    console.log("Navigating to:", targetUrl);
    navigate(targetUrl);
  };

  return (
    <nav className={styles.navContainer}>
      {/* Home Tab */}
      <NavLink to="/home" className={getNavLinkClass} aria-label="Home">
        <FiHome size={24} />
      </NavLink>

      {/* Random Tab */}
      {/* Apply base navItem, alwaysActiveRandom styles, and pulse animation */}
      <button
        onClick={handleRandomClick}
        className={`${styles.navItem} ${styles.alwaysActiveRandom} ${styles.pulseAnimation}`} // Apply specific classes
        aria-label="Random Problem"
      >
        <RiCodeSSlashFill size={24} />
      </button>

      {/* Profile Tab */}
      <NavLink to="/me" className={getNavLinkClass} aria-label="Profile">
        <FiUser size={24} />
      </NavLink>
    </nav>
  );
};

export default BottomNavBar;
