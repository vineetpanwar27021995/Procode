import React, { useMemo } from 'react';
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { useProblemStore } from '../../stores/problemStore'; // Adjust path
import { FiAward } from 'react-icons/fi'; // Example icons
import moment from 'moment'; // For date processing
import styles from '../../styles/Profile.module.css'; 

// --- Configuration for Leveling ---
// Example: XP needed to REACH the next level (Level 1 is 0-99, Level 2 is 100-299, etc.)
const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]; // Example thresholds

const getLevelFromXp = (xp) => {
  let level = 1;
  for (let i = 1; i < XP_THRESHOLDS.length; i++) {
    if (xp >= XP_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break; // Stop when XP is less than the threshold for the next level
    }
  }
  return level;
};

const getProgressToNextLevel = (xp) => {
    const currentLevel = getLevelFromXp(xp);
    const currentLevelXpStart = XP_THRESHOLDS[currentLevel - 1] ?? 0;
    const nextLevelXpThreshold = XP_THRESHOLDS[currentLevel] ?? Infinity; // XP needed to reach next level

    if (nextLevelXpThreshold === Infinity) {
        return { progressPercent: 100, xpForNext: Infinity, currentLevelXp: xp - currentLevelXpStart }; // Max level
    }

    const xpNeededForLevel = nextLevelXpThreshold - currentLevelXpStart;
    const xpEarnedInLevel = xp - currentLevelXpStart;
    const progressPercent = xpNeededForLevel > 0 ? Math.min(100, Math.floor((xpEarnedInLevel / xpNeededForLevel) * 100)) : 100;
    const xpForNext = nextLevelXpThreshold;

    return { progressPercent, xpForNext, currentLevelXp: xpEarnedInLevel };
};


const AchievementsTab = () => {
    // Get data from stores
    const { userProfile } = useUserStore();
    const { categories } = useProblemStore(); // Need categories to look up difficulty

    // --- Calculate Stats using useMemo ---
    const calculatedStats = useMemo(() => {
        console.log("Recalculating achievement stats...");
        const stats = {
            totalXp: 0,
            level: 1,
            levelProgressPercent: 0,
            xpForNextLevel: XP_THRESHOLDS[1] || 100, // XP needed for level 2
            submissionCounts: { Easy: 0, Medium: 0, Hard: 0, total: 0 },
            uniqueSubmissionDays: 0,
        };

        if (!userProfile?.submissions || !categories || Object.keys(categories).length === 0) {
            console.log("User submissions or categories data not available for stats calculation.");
            return stats; // Return default stats if data is missing
        }

        const submissions = userProfile.submissions;
        const submissionDates = new Set();
        let totalXp = 0;
        let easyCount = 0;
        let mediumCount = 0;
        let hardCount = 0;

        // Find problem difficulties and calculate XP/Counts/Dates
        for (const problemId in submissions) {
            let problemDifficulty = null;
            let categoryKeyFound = null;

            // Find the problem in the categories data to get difficulty
            for (const categoryKey in categories) {
                if (categories[categoryKey]?.[problemId]) {
                    problemDifficulty = categories[categoryKey][problemId]?.difficulty;
                    categoryKeyFound = categoryKey;
                    break;
                }
            }

            if (problemDifficulty) {
                if (problemDifficulty === 'Easy') {
                    totalXp += 10;
                    easyCount++;
                } else if (problemDifficulty === 'Medium') {
                    totalXp += 20;
                    mediumCount++;
                } else if (problemDifficulty === 'Hard') {
                    totalXp += 30;
                    hardCount++;
                }
            } else {
                console.warn(`Difficulty not found for submitted problem ID: ${problemId} (looked in category key: ${categoryKeyFound})`);
            }

            // Calculate unique submission days
            const submissionData = submissions[problemId];
            let timestampSource = submissionData.TIMESTAMP;
            if (Array.isArray(timestampSource)) {
                 timestampSource = timestampSource[timestampSource.length - 1];
            }
            if (timestampSource) {
                 let dateStr = null;
                 if (timestampSource.toDate) { // Firestore Timestamp
                     dateStr = moment(timestampSource.toDate()).format('YYYY-MM-DD');
                 } else { // Attempt to parse string/number
                     const parsedMoment = moment(timestampSource);
                     if (parsedMoment.isValid()) {
                         dateStr = parsedMoment.format('YYYY-MM-DD');
                     }
                 }
                 if (dateStr) {
                     submissionDates.add(dateStr);
                 }
            }
        }

        // Calculate level and progress
        stats.totalXp = totalXp;
        stats.level = getLevelFromXp(totalXp);
        const levelProgress = getProgressToNextLevel(totalXp);
        stats.levelProgressPercent = levelProgress.progressPercent;
        stats.xpForNextLevel = levelProgress.xpForNext; // Total XP needed to reach next level

        // Update submission counts
        stats.submissionCounts = {
            Easy: easyCount,
            Medium: mediumCount,
            Hard: hardCount,
            total: easyCount + mediumCount + hardCount
        };

        // Update unique days
        stats.uniqueSubmissionDays = submissionDates.size;

        console.log("Calculated Stats:", stats);
        return stats;

    }, [userProfile, categories]); // Recalculate when userProfile or categories change

    // --- Determine which day badges are earned ---
    const badges = useMemo(() => {
        const earnedBadges = [];
        const days = calculatedStats.uniqueSubmissionDays;
        if (days >= 1) earnedBadges.push({ id: 1, name: 'Starter Challenge', icon: <FiAward />, earned: true });
        if (days >= 50) earnedBadges.push({ id: 2, name: '50 Days Challenge', icon: <FiAward />, earned: true });
        if (days >= 100) earnedBadges.push({ id: 3, name: '100 Days Challenge', icon: <FiAward />, earned: true });
        if (days >= 200) earnedBadges.push({ id: 4, name: '200 Days Challenge', icon: <FiAward />, earned: true });
        // Add logic for other potential badges (e.g., Blind 75, NeetCode 150 completion)
        // These would likely need different logic based on specific problem submissions
        return earnedBadges;
    }, [calculatedStats.uniqueSubmissionDays]);


  return (
    <div className={`${styles.tabContent} ${styles.achievementsTab}`}>
        {/* --- Level/Progress Bar --- */}
        <div className={styles.levelCard}>
         <div className={styles.levelHeader}>
            <span className={styles.levelText}>Level {calculatedStats.level}</span>
            <span className={styles.levelPoints}>
                {calculatedStats.totalXp} XP
                {/* Show XP needed for next level if not max level */}
                {calculatedStats.xpForNextLevel !== Infinity && ` / ${calculatedStats.xpForNextLevel} XP`}
            </span>
         </div>
         <div className={styles.levelProgressBarContainer}>
            <div className={styles.levelProgressBar} style={{ width: `${calculatedStats.levelProgressPercent}%` }}></div>
         </div>
       </div>
       {/* --- End Level Bar --- */}


      {/* --- Submissions Section --- */}
      <div className={styles.statsSection}>
        <h4 className={styles.statsTitle}>SUBMISSIONS {calculatedStats.submissionCounts.total}</h4>
        <div className={styles.submissionGrid}>
          <div className={`${styles.submissionCard} ${styles.hard}`}>
            <span>Hard</span>
            <span>{calculatedStats.submissionCounts.Hard}</span>
          </div>
          <div className={`${styles.submissionCard} ${styles.medium}`}>
            <span>Medium</span>
            <span>{calculatedStats.submissionCounts.Medium}</span>
          </div>
          <div className={`${styles.submissionCard} ${styles.easy}`}>
            <span>Easy</span>
            <span>{calculatedStats.submissionCounts.Easy}</span>
          </div>
        </div>
      </div>
      {/* --- End Submissions Section --- */}


      {/* --- Badges Section --- */}
      <div className={styles.statsSection}>
        <h4 className={styles.statsTitle}>BADGES ({badges.length})</h4>
        {badges.length > 0 ? (
            <div className={styles.badgeGrid}>
            {badges.map(badge => (
                <div key={badge.id} className={`${styles.badgeCard} ${badge.earned ? styles.badgeEarned : ''}`}>
                <div className={styles.badgeIcon}>{badge.icon}</div>
                <span className={styles.badgeName}>{badge.name}</span>
                </div>
            ))}
            </div>
        ) : (
            <p className={styles.noBadgesText}>Keep solving to earn badges!</p>
        )}
      </div>
       {/* --- End Badges Section --- */}
    </div>
  );
};

export default AchievementsTab;
