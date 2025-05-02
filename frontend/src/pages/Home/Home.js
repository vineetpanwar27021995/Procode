import React, { useEffect, useState, useMemo } from 'react';
import styles from '../../styles/Home.module.css'; // Adjust path if needed
import { MdOutlineSort as SortIcon, MdOutlineCode as CodeIcon, MdOutlineHtml as HtmlIcon, MdOutlineTaskAlt as TaskIcon, MdArrowForward } from 'react-icons/md'; // Added MdArrowForward
import { FiUser } from 'react-icons/fi';
import { useUserStore } from '../../stores/userStore'; // Adjust path as needed
import { useProblemStore } from '../../stores/problemStore'; // Adjust path as needed
import moment from 'moment';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { FaCode, FaBug, FaBrain } from "react-icons/fa";
import { SiLeetcode, SiCodemirror } from "react-icons/si";
import { VscSymbolMethod } from "react-icons/vsc";
import BottomNavBar from 'components/BottomNavBar/BottomNavBar';

// Helper function to shuffle an array (Fisher-Yates)
function shuffleArray(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

const iconPool = [FaCode, FaBug, FaBrain, SiLeetcode, SiCodemirror, VscSymbolMethod];


const shuffledIcons = shuffleArray(iconPool).slice(0, 5);

const Home = () => {
  const navigate = useNavigate(); // Hook for navigation

  // Get state and actions from stores
  const { userProfile, loading: userLoading, error: userError, fetchUserProfile } = useUserStore();
  const { categories, roadmap, loading: problemsLoading, error: problemsError, fetchCategories, fetchRoadmap } = useProblemStore();

  // Local state
  const [computedUpcomingTasks, setComputedUpcomingTasks] = useState([]);
  const [nextCategories, setNextCategories] = useState([]); // State for next categories
  const [computationLoading, setComputationLoading] = useState(true);
  const [lastCompletedCategoryIndex, setLastCompletedCategoryIndex] = useState(-1);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      const fetches = [];
      if (!userProfile && !userLoading) fetches.push(fetchUserProfile());
      if ((!roadmap || roadmap.length === 0) && !problemsLoading) fetches.push(fetchRoadmap());
      if ((!categories || Object.keys(categories).length === 0) && !problemsLoading) fetches.push(fetchCategories());

      if (fetches.length > 0) {
        console.log("Home Mount: Fetching initial data...");
        setComputationLoading(true);
        await Promise.all(fetches).catch(err => {
          console.error("Error fetching initial data:", err);
        });
      } else {
         setComputationLoading(userLoading || problemsLoading);
      }
    };
    loadData();
  }, [fetchUserProfile, fetchRoadmap, fetchCategories]); // Run once

  // --- UPDATED LOGIC: Function computes upcoming tasks (finish current category first) ---
  const computeSuggestions = () => {
    console.log("Computing suggestions (finish current category first)...");
    const upcomingProblems = [];
    let latestCompletedCategoryIndex = -1; // Index in roadmap of the category containing the latest submission

    if (!userProfile || !roadmap || !categories || roadmap.length === 0 || Object.keys(categories).length === 0) {
      console.log("Required data not ready for computation.");
      return { upcomingProblems, latestCompletedCategoryIndex }; // Return default values
    }

    const submissions = userProfile.submissions || {};
    const submittedProblemIds = new Set(Object.keys(submissions));
    let latestTimestamp = 0;
    let latestProblemId = null;

    // 1. Find latest submission
    for (const problemId in submissions) {
      const submission = submissions[problemId];
      let currentTimestampValue = 0;
      let timestampSource = submission.TIMESTAMP; // Ensure this matches the actual field name in Firestore

      if (Array.isArray(timestampSource)) {
        timestampSource = timestampSource[timestampSource.length - 1];
      }
      if (timestampSource) {
        if (timestampSource.toDate) { // Check for Firestore Timestamp
          currentTimestampValue = timestampSource.toDate().getTime();
        } else { // Try parsing with moment
          const parsedMoment = moment(timestampSource);
          if (parsedMoment.isValid()) {
            currentTimestampValue = parsedMoment.valueOf();
          }
        }
      }
      if (currentTimestampValue > latestTimestamp) {
        latestTimestamp = currentTimestampValue;
        latestProblemId = problemId;
      }
    }

    // 2. Find category and index of latest submission
    let latestCategory = null;
    let latestCategoryKey = null; // The potentially sanitized key used in the categories object
    if (latestProblemId) {
      for (const categoryKey in categories) {
        if (categories[categoryKey] && categories[categoryKey][latestProblemId]) {
          // Find the original roadmap name corresponding to the sanitized key
          const originalCategoryName = roadmap.find(r_cat =>
             r_cat.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-') === categoryKey
          ) || categoryKey; // Fallback to key if original not found
          latestCategory = originalCategoryName;
          latestCategoryKey = categoryKey;
          latestCompletedCategoryIndex = roadmap.findIndex(cat => cat === latestCategory);
          break;
        }
      }
    }
    console.log(`Latest category worked on: ${latestCategory || 'None'} (Index: ${latestCompletedCategoryIndex})`);

    // 3. Determine the category to start searching for unsolved problems
    let currentCategoryToSearchIndex = 0; // Default to first category in roadmap
    let currentCategoryToSearchKey = null;
    let currentCategoryToSearchName = null;

    if (latestCategoryKey && categories[latestCategoryKey]) {
        // Check if there are unsolved problems in the *latest* category
        const problemsInLatest = categories[latestCategoryKey];
        const problemIdsInLatest = Object.keys(problemsInLatest);
        const unsolvedInLatest = problemIdsInLatest.filter(id => !submittedProblemIds.has(id));

        if (unsolvedInLatest.length > 0) {
            // If unsolved problems exist in the latest category, start there
            currentCategoryToSearchIndex = latestCompletedCategoryIndex;
            currentCategoryToSearchKey = latestCategoryKey;
            currentCategoryToSearchName = latestCategory;
            console.log(`Found ${unsolvedInLatest.length} unsolved in latest category '${latestCategory}'. Starting search there.`);
        } else {
            // If latest category is finished, start searching from the *next* category in the roadmap
            currentCategoryToSearchIndex = (latestCompletedCategoryIndex + 1) % roadmap.length;
            currentCategoryToSearchName = roadmap[currentCategoryToSearchIndex];
            currentCategoryToSearchKey = currentCategoryToSearchName?.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
            console.log(`Latest category '${latestCategory}' is complete. Starting search from next category '${currentCategoryToSearchName}'.`);
        }
    } else {
        // No latest submission or category data missing, start from the beginning
        currentCategoryToSearchName = roadmap[0];
        currentCategoryToSearchKey = currentCategoryToSearchName?.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
        console.log("No latest category or data missing. Starting search from roadmap beginning.");
    }


    // 4. Find next 3 unsolved problems, starting from the determined category
    let foundCount = 0;
    for (let i = 0; i < roadmap.length && foundCount < 3; i++) { // Loop through the entire roadmap once if needed
        const indexToCheck = (currentCategoryToSearchIndex + i) % roadmap.length; // Wrap around roadmap
        const categoryNameOriginal = roadmap[indexToCheck];
        const categoryKey = categoryNameOriginal.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
        const problemsInCategory = categories[categoryKey];

        if (!problemsInCategory) {
            console.warn(`Category "${categoryNameOriginal}" (key: ${categoryKey}) from roadmap not found in fetched categories data.`);
            continue; // Skip this category if data is missing
        }

        console.log(`Searching for unsolved problems in category: ${categoryNameOriginal}`);
        const problemIdsInCategory = Object.keys(problemsInCategory).sort(); // Sort for consistent order

        for (const problemId of problemIdsInCategory) {
            if (!submittedProblemIds.has(problemId)) {
                 // Check if already added (only relevant if looping multiple times, which we aren't here for the primary search)
                 // if (!upcomingProblems.some(p => p.id === problemId)) { } // Not strictly needed in this loop structure
                 upcomingProblems.push({
                    ...problemsInCategory[problemId],
                    id: problemId,
                    category: categoryNameOriginal // Use original name
                });
                foundCount++;
                if (foundCount === 5) break; // Stop once we have 3
            }
        }
         if (foundCount === 5) break; // Exit outer loop if we found 3
    }

    // 5. Handle case where *all* problems in the entire roadmap are solved
    if (foundCount === 0 && submittedProblemIds.size > 0) { // Check if nothing was found but user has submissions
        console.log("All problems in the roadmap appear to be solved. Suggesting first 3 from roadmap start.");
        // Suggest first 3 problems from the first category as a fallback
        const firstCategoryName = roadmap[0];
        const firstCategoryKey = firstCategoryName.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
        const firstCategoryProblems = categories[firstCategoryKey];
        if (firstCategoryProblems) {
            const firstProblemIds = Object.keys(firstCategoryProblems).sort();
            for (let j = 0; j < firstProblemIds.length && foundCount < 3; j++) {
                 const problemId = firstProblemIds[j];
                 upcomingProblems.push({
                     ...firstCategoryProblems[problemId],
                     id: problemId,
                     category: firstCategoryName
                 });
                 foundCount++;
            }
        }
    }


    console.log(`Computed upcoming tasks (${upcomingProblems.length}):`, upcomingProblems.map(p=>p.name));
    console.log(`Index of last completed category: ${latestCompletedCategoryIndex}`);
    // Return object including the index of the last completed category
    return { upcomingProblems, latestCompletedCategoryIndex };
  };

  // Effect to compute suggestions when data is ready
  useEffect(() => {
    const dataReady = !userLoading && !problemsLoading && userProfile && roadmap && roadmap.length > 0 && categories && Object.keys(categories).length > 0;

    if (dataReady) {
        setComputationLoading(true);
        const { upcomingProblems, latestCompletedCategoryIndex: completedIndex } = computeSuggestions();
        setComputedUpcomingTasks(upcomingProblems);
        setLastCompletedCategoryIndex(completedIndex); // Store the index

        let nextCats = [];
        const roadmapLength = roadmap.length;

        // Determine the index for the *next* category suggestions
        const nextCategorySuggestIndex = (completedIndex === -1) ? 0 : (completedIndex + 1) % roadmapLength;

        // Check if the user might have completed the last category in the roadmap
        // A better check might be if upcomingProblems is empty AND user has submissions
        const allSeeminglySolved = upcomingProblems.length === 0 && userProfile?.submissions && Object.keys(userProfile.submissions).length > 0;

        if (allSeeminglySolved) {
             console.log("All categories seem complete or suggestions failed. Showing random categories.");
             nextCats = shuffleArray([...roadmap]).slice(0, 5);
        } else {
            console.log("Calculating next sequential categories starting after index:", completedIndex);
            const startIndex = nextCategorySuggestIndex; // Start from the category *after* the last completed one
            for (let i = 0; i < 5; i++) {
                const index = (startIndex + i) % roadmapLength;
                if (roadmap[index]) {
                    if (nextCats.length < roadmapLength && !nextCats.includes(roadmap[index])) {
                         nextCats.push(roadmap[index]);
                    } else if (nextCats.length >= roadmapLength) {
                        break;
                    }
                }
            }
        }
        setNextCategories(nextCats);

        setComputationLoading(false);
    } else {
        setComputationLoading(userLoading || problemsLoading);
    }
  }, [userProfile, categories, roadmap, userLoading, problemsLoading]); // Dependencies


  // Extract user name
  const userName = userProfile?.name || 'User';
  const userImage = userProfile?.photoURL;

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      return moment(timestamp).fromNow();
    } catch (e) {
      console.error("Error formatting date with moment:", e);
      return 'Invalid date';
    }
  };

  // Handler for View All button
  const handleViewAll = () => {
      navigate('/problems'); // Navigate to the Problems page
  };

  const handleCategory = (category) => {
    const categoryId = category.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
      navigate(`/category/${categoryId}`)
  }

  const handleCodeSession = (problemKey,categoryKey) => {
    console.log(problemKey, categoryKey)
    navigate(`/${categoryKey}/solve/${problemKey}`)
    // navigate('/questions')
  }

  return (
    <div className={styles.homeContainer}>
      {/* Greeting Section */}
      <div className={styles.greetingSection}>
        <div>
          {userLoading && <h1 className={styles.greetingTitle}>Loading profile...</h1>}
          {userError && <h1 className={`${styles.greetingTitle} ${styles.errorText}`}>Error loading profile!</h1>}
          {!userLoading && !userError && <h1 className={styles.greetingTitle}>Hello, {userName}!</h1>}
        </div>
        <div className={styles.profileIcon} onClick={_=>navigate('/me')}>
              {userImage ? <img src={userImage} alt={userName} /> : <FiUser size={25} />}
        </div>
      </div>

      {/* Subtitles */}
      {!userLoading && !userError && (
        <>
          <p className={styles.greetingSubtitle}>Next step for you</p>
          <p className={styles.pathsInfo}>We have more than 90+ paths</p>
        </>
      )}
      {userError && <p className={styles.errorText}>{userError}</p>}

      {/* Upcoming Tasks Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Upcoming Task</h3>
        {computationLoading ? (
          <p>Calculating next tasks...</p>
        ) : computedUpcomingTasks.length > 0 ? (
          <ul className={styles.taskList}>
            {computedUpcomingTasks.map((task,index) => {
              const IconComponent = shuffledIcons[index];

              return (
              <li key={task.id} className={styles.taskItem} onClick={_=>handleCodeSession(task.id,task.category.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-'))}>
                <div className={styles.taskIcon}><IconComponent /></div> {/* Placeholder */}
                <div className={styles.taskDetails}>
                  <span className={styles.taskTitle}>{task.name || 'Unknown Task'}</span>
                  <span className={`${styles.taskDetail} ${styles[task.difficulty?.toLowerCase()] || ''}`}>{task.difficulty || 'Unknown'}</span>
                </div>
              </li>
            )})}
          </ul>
        ) : (
          <p>No specific upcoming tasks found. Explore categories below!</p>
        )}
      </section>

      {/* Explore Categories Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle +' m-0'}>Explore Categories</h3>
            <button onClick={handleViewAll} className={styles.viewAllButton}>
                View All <MdArrowForward />
            </button>
        </div>
        {computationLoading ? (
            <p>Loading categories...</p>
        ) : nextCategories.length > 0 ? (
            <div className={styles.categoryGrid}>
                {nextCategories.map(categoryName => (
                    <div key={categoryName} className={styles.categoryCard} onClick={_=>handleCategory(categoryName)}>
                        <span className={styles.categoryName}>{categoryName}</span>
                    </div>
                ))}
            </div>
        ) : (
             roadmap && roadmap.length > 0 ?
             <p>Explore the roadmap!</p> :
             <p>No categories found in roadmap.</p>
        )}
      </section>

      {/* Recap Section using DaisyUI Carousel */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle +' m-0'}>Recap from last solved!!!</h3>
            <button onClick={_=>navigate('/category/submissions')} className={styles.viewAllButton}>
                View All <MdArrowForward />
            </button>
        </div>
        <div className={`carousel carousel-center w-full space-x-4 rounded-box ${styles.recapCarouselContainer}`}>
          {userProfile?.submissions && categories && Object.keys(categories).length > 0 && Object.keys(userProfile.submissions).length > 0 ? (
            Object.entries(userProfile.submissions).map(([key, value]) => {
               // --- Improved Category Key Finding ---
               let categoryKey = null;
               let originalCategoryName = null;
               // Find the category key and original name based on problem ID 'key'
               for (const cKey in categories) {
                   if (categories[cKey]?.[key]) { // Check if problem 'key' exists in this category's problems
                       categoryKey = cKey;
                       originalCategoryName = roadmap.find(r_cat =>
                           r_cat.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-') === categoryKey
                       ) || categoryKey; // Find original name
                       break; // Stop searching once found
                   }
               }
               // --- End Improved Finding ---

               const problemData = categoryKey ? categories[categoryKey]?.[key] : null;
               const problemName = problemData?.name || key; // Use problem name or ID as fallback
               const timestamp = value.TIMESTAMP; // Use correct timestamp field

               return (
                 <div key={key} id={`recap-${key}`} className={`carousel-item ${styles.recapCarouselItem}`}>
                   <div className={styles.recapCard} onClick={_=>handleCodeSession(problemData.id,categoryKey)}>
                     <div className={styles.recapCardHeader}>
                        <div className={styles.recapIcon}><TaskIcon /></div>{/* Placeholder */}
                        <div className={styles.recapDetails}>
                           <span className={styles.recapTitle}>{problemName}</span>
                           <span className={`${styles.recapDetail} ${styles.recapTimestamp}`}>
                             {formatRelativeTime(timestamp[timestamp.length-1])}
                           </span>
                        </div>
                     </div>
                   </div>
                 </div>
               );
            })
           ) : (
             <div className={styles.noRecap}>No recent activity.</div>
           )}
        </div>
      </section>

    </div>
  );
};

export default Home;
