import React, { useEffect, useState, useMemo } from 'react';
import styles from '../../styles/Home.module.css'; // Adjust path if needed
import { MdOutlineSort as SortIcon, MdOutlineCode as CodeIcon, MdOutlineHtml as HtmlIcon, MdOutlineTaskAlt as TaskIcon, MdArrowForward } from 'react-icons/md';
import { FiUser } from 'react-icons/fi';
import { useUserStore } from '../../stores/userStore'; // Adjust path as needed
import { useProblemStore } from '../../stores/problemStore'; // Adjust path as needed
import moment from 'moment';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Loader from '../../components/Loader/Loader'; // ** Import Loader **
// Import necessary icons if using them directly in this file
import { FaCode, FaBug, FaBrain } from "react-icons/fa";
import { SiLeetcode, SiCodemirror } from "react-icons/si";
import { VscSymbolMethod } from "react-icons/vsc";
// Removed BottomNavBar import as it's likely rendered in App.js/Layout

// --- Helper function to shuffle an array (Fisher-Yates) ---
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

// Example icon pool - move this or the logic to where icons are assigned if needed elsewhere
const iconPool = [FaCode, FaBug, FaBrain, SiLeetcode, SiCodemirror, VscSymbolMethod, CodeIcon, SortIcon, HtmlIcon, TaskIcon];
// Shuffle icons once on component load (or manage differently if icons need to be stable)
const shuffledIcons = shuffleArray([...iconPool]); // Use spread to avoid mutating original pool

const Home = () => {
  const navigate = useNavigate(); // Hook for navigation

  // Get state and actions from stores
  const { userProfile, loading: userLoading, error: userError, fetchUserProfile } = useUserStore();
  const { categories, roadmap, loading: problemsLoading, error: problemsError, fetchCategories, fetchRoadmap } = useProblemStore();

  // Local state
  const [computedUpcomingTasks, setComputedUpcomingTasks] = useState([]);
  const [nextCategories, setNextCategories] = useState([]);
  // --- MODIFIED: Combined loading/processing state ---
  const [isProcessing, setIsProcessing] = useState(true); // Start as true until initial load/computation is done
  const [lastCompletedCategoryIndex, setLastCompletedCategoryIndex] = useState(-1);

  // Fetch initial data
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const fetches = [];
      // Use store state directly for checking if fetch is needed
      if (!useUserStore.getState().userProfile && !useUserStore.getState().loading) fetches.push(fetchUserProfile());
      if ((!useProblemStore.getState().roadmap || useProblemStore.getState().roadmap.length === 0) && !useProblemStore.getState().loading) fetches.push(fetchRoadmap());
      if ((!useProblemStore.getState().categories || Object.keys(useProblemStore.getState().categories).length === 0) && !useProblemStore.getState().loading) fetches.push(fetchCategories());

      if (fetches.length > 0) {
        console.log("Home Mount: Fetching initial data...");
        if (isMounted) setIsProcessing(true); // Ensure loading state is true
        await Promise.all(fetches).catch(err => {
          console.error("Error fetching initial data:", err);
          // Errors are handled in stores, but stop processing state here if needed
          // if (isMounted) setIsProcessing(false);
        });
        // Don't set isProcessing to false here, let the computation effect handle it
      } else {
         // If no fetches needed, set initial processing state based on current store loading
         if (isMounted) setIsProcessing(useUserStore.getState().loading || useProblemStore.getState().loading);
      }
    };
    loadData();
    return () => { isMounted = false }; // Cleanup flag
  // Only include fetch functions as dependencies, they are stable references
  }, [fetchUserProfile, fetchRoadmap, fetchCategories]);

  // Function computes upcoming tasks AND the index of the *last completed* category
  const computeSuggestions = () => {
    console.log("Computing suggestions (finish current category first)...");
    const upcomingProblems = [];
    let latestCompletedCategoryIndex = -1;

    // This function now assumes data (userProfile, roadmap, categories) exists
    // The calling useEffect handles the checks

    const submissions = userProfile.submissions || {};
    const submittedProblemIds = new Set(Object.keys(submissions));
    let latestTimestamp = 0;
    let latestProblemId = null;

    // 1. Find latest submission
    for (const problemId in submissions) {
      const submission = submissions[problemId];
      let currentTimestampValue = 0;
      let timestampSource = submission.TIMESTAMP;

      if (Array.isArray(timestampSource)) {
        timestampSource = timestampSource[timestampSource.length - 1];
      }
      if (timestampSource) {
        if (timestampSource.toDate) {
          currentTimestampValue = timestampSource.toDate().getTime();
        } else {
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
    let latestCategoryKey = null;
    if (latestProblemId) {
      for (const categoryKey in categories) {
        if (categories[categoryKey] && categories[categoryKey][latestProblemId]) {
          const originalCategoryName = roadmap.find(r_cat =>
             r_cat.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-') === categoryKey
          ) || categoryKey;
          latestCategory = originalCategoryName;
          latestCategoryKey = categoryKey;
          latestCompletedCategoryIndex = roadmap.findIndex(cat => cat === latestCategory);
          break;
        }
      }
    }
    console.log(`Latest category worked on: ${latestCategory || 'None'} (Index: ${latestCompletedCategoryIndex})`);

    // 3. Determine the category to start searching for unsolved problems
    let currentCategoryToSearchIndex = 0;
    if (latestCategoryKey && categories[latestCategoryKey]) {
        const problemsInLatest = categories[latestCategoryKey];
        const problemIdsInLatest = Object.keys(problemsInLatest);
        const unsolvedInLatest = problemIdsInLatest.filter(id => !submittedProblemIds.has(id));
        if (unsolvedInLatest.length > 0) {
            currentCategoryToSearchIndex = latestCompletedCategoryIndex;
            console.log(`Found ${unsolvedInLatest.length} unsolved in latest category '${latestCategory}'. Starting search there.`);
        } else {
            currentCategoryToSearchIndex = (latestCompletedCategoryIndex + 1) % roadmap.length;
            console.log(`Latest category '${latestCategory}' is complete. Starting search from next category '${roadmap[currentCategoryToSearchIndex]}'.`);
        }
    } else {
        console.log("No latest category or data missing. Starting search from roadmap beginning.");
    }

    // 4. Find next 3 unsolved problems
    let foundCount = 0;
    for (let i = 0; i < roadmap.length && foundCount < 5; i++) {
        const indexToCheck = (currentCategoryToSearchIndex + i) % roadmap.length;
        const categoryNameOriginal = roadmap[indexToCheck];
        const categoryKey = categoryNameOriginal.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
        const problemsInCategory = categories[categoryKey];
        if (!problemsInCategory) continue;
        const problemIdsInCategory = Object.keys(problemsInCategory).sort();
        for (const problemId of problemIdsInCategory) {
            if (!submittedProblemIds.has(problemId)) {
                 upcomingProblems.push({ ...problemsInCategory[problemId], id: problemId, category: categoryNameOriginal });
                 foundCount++;
                 if (foundCount === 5) break; // Stop once we have 3 (changed from 5)
            }
        }
         if (foundCount === 5) break;
    }

    // 5. Handle all solved case
    if (foundCount === 0 && submittedProblemIds.size > 0) {
        console.log("All problems appear solved. Suggesting first 3 from roadmap.");
        const firstCategoryName = roadmap[0];
        const firstCategoryKey = firstCategoryName.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
        const firstCategoryProblems = categories[firstCategoryKey];
        if (firstCategoryProblems) {
            const firstProblemIds = Object.keys(firstCategoryProblems).sort();
            for (let j = 0; j < firstProblemIds.length && foundCount < 5; j++) {
                 upcomingProblems.push({ ...firstCategoryProblems[firstProblemIds[j]], id: firstProblemIds[j], category: firstCategoryName });
                 foundCount++;
            }
        }
    }

    console.log(`Computed upcoming tasks (${upcomingProblems.length}):`, upcomingProblems.map(p=>p.name));
    console.log(`Index of last completed category: ${latestCompletedCategoryIndex}`);
    return { upcomingProblems, latestCompletedCategoryIndex };
  };

  // Effect to compute suggestions when data is ready
  useEffect(() => {
    // Check if all required data is loaded and available from stores
    const dataReady = !userLoading && !problemsLoading && userProfile && roadmap && roadmap.length > 0 && categories && Object.keys(categories).length > 0;

    if (dataReady) {
        console.log("Data ready, computing suggestions...");
        setIsProcessing(true); // Indicate computation is starting
        const { upcomingProblems, latestCompletedCategoryIndex: completedIndex } = computeSuggestions();
        setComputedUpcomingTasks(upcomingProblems);
        setLastCompletedCategoryIndex(completedIndex);

        // Calculate next 5 categories
        let nextCats = [];
        const roadmapLength = roadmap.length;
        const nextCategorySuggestIndex = (completedIndex === -1) ? 0 : (completedIndex + 1) % roadmapLength;
        const allSeeminglySolved = upcomingProblems.length === 0 && userProfile?.submissions && Object.keys(userProfile.submissions).length > 0;

        if (allSeeminglySolved && roadmapLength > 0) { // Ensure roadmap exists before shuffling
             console.log("All categories seem complete or suggestions failed. Showing random categories.");
             nextCats = shuffleArray([...roadmap]).slice(0, 5);
        } else if (roadmapLength > 0) { // Ensure roadmap exists before calculating sequential
            console.log("Calculating next sequential categories starting after index:", completedIndex);
            const startIndex = nextCategorySuggestIndex;
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
        console.log("Computation finished.");
        setIsProcessing(false); // Computation finished
    } else {
        // If data isn't ready, set processing state based on store loading states
        // This ensures loader shows if fetches are still in progress
        console.log("Data not ready, setting isProcessing based on store loading.");
        setIsProcessing(userLoading || problemsLoading);
    }
  // Dependencies should include all data used in the effect and computation
  }, [userProfile, categories, roadmap, userLoading, problemsLoading]); // Added computationLoading to dependencies


  // Extract user name
  const userName = userProfile?.name || 'User';
  const userImage = userProfile?.photoURL;

  // Format relative time
  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      // Ensure timestamp is parsed correctly before formatting
      const date = moment(timestamp.toDate ? timestamp.toDate() : timestamp);
      return date.isValid() ? date.fromNow() : 'Invalid date';
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

  const handleCodeSession = (problemId, categoryKey) => { // Accept sanitized key
    if (!problemId || !categoryKey) {
        console.error("Missing problemId or categoryKey for navigation");
        return;
    }
    console.log(`Navigating to problem: ${problemId} in category: ${categoryKey}`);
    // Use the sanitized category key in the URL
    navigate(`/${categoryKey}/solve/${problemId}`);
  }

  // --- RENDER: Use Loader if processing ---
  if (isProcessing) {
      return <Loader message="Loading Home..." />;
  }

  // --- Render actual content when not loading ---
  return (
    <div className={styles.homeContainer}>
      {/* Greeting Section */}
      <div className={styles.greetingSection+' mb-4'}>
        <div>
          {userError && <h1 className={`${styles.greetingTitle} ${styles.errorText}`}>Error loading profile!</h1>}
          {!userError && <h1 className={styles.greetingTitle}>Hello, {userName}!</h1>}
        </div>
        <div className={styles.profileIcon} onClick={_=>navigate('/me')}> {/* Navigate to /profile */}
              {userImage ? <img src={userImage} alt={userName} className={styles.profileImage} /> : <FiUser size={25} />}
        </div>
      </div>

      <div className='divider m-0'></div>

      {/* Subtitles */}
      {!userError && (
        <>
          <p className={styles.greetingSubtitle}>Next step for you</p>
          <p className={styles.pathsInfo}>We have more than 90+ paths</p>
        </>
      )}
      {userError && <p className={styles.errorText}>{userError}</p>}
      {problemsError && <p className={styles.errorText}>Error loading problem data: {problemsError}</p>}


      {/* Upcoming Tasks Section */}
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Upcoming Task</h3>
        {computedUpcomingTasks.length > 0 ? (
          <ul className={styles.taskList+' px-4'}>
            {computedUpcomingTasks.map((task,index) => {
              // Assign icon based on index in the shuffled list
              const IconComponent = shuffledIcons[index % shuffledIcons.length] || CodeIcon; // Fallback icon
              // Find the sanitized category key for navigation
              const categoryKey = task.category?.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');

              return (
              <li key={task.id} className={styles.taskItem} onClick={()=>handleCodeSession(task.id, categoryKey)}>
                <div className={styles.taskIcon}><IconComponent /></div>
                <div className={styles.taskDetails}>
                  <span className={styles.taskTitle}>{task.name || 'Unknown Task'}</span>
                  <span className={`${styles.taskDetail} ${task.difficulty?.toLowerCase() || ''} font-bold`}>{task.difficulty || 'Unknown'}</span>
                </div>
              </li>
            )})}
          </ul>
        ) : (
          <p className={styles.noTasksText}>No specific upcoming tasks found. Explore categories below!</p>
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
        {nextCategories.length > 0 ? (
            <div className={styles.categoryGrid+' px-4'}>
                {nextCategories.map(categoryName => (
                    <div key={categoryName} className={styles.categoryCard} onClick={()=>handleCategory(categoryName)}>
                        <span className={styles.categoryName}>{categoryName}</span>
                    </div>
                ))}
            </div>
        ) : (
             roadmap && roadmap.length > 0 ?
             <p className={styles.infoText}>Explore the roadmap!</p> : // Use infoText style
             <p className={styles.infoText}>No categories found in roadmap.</p> // Use infoText style
        )}
      </section>

      {/* Recap Section using DaisyUI Carousel */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle +' m-0'}>Recap from last solved!!!</h3>
            <button onClick={()=>navigate('/category/submissions')} className={styles.viewAllButton}>
                View All <MdArrowForward />
            </button>
        </div>
        <div className={`carousel carousel-center w-full space-x-4 rounded-box px-4 ${styles.recapCarouselContainer}`}>
          {userProfile?.submissions && categories && Object.keys(categories).length > 0 && Object.keys(userProfile.submissions).length > 0 ? (
            Object.entries(userProfile.submissions).map(([key, value]) => {
               let categoryKey = null;
               let originalCategoryName = null;
               for (const cKey in categories) {
                   if (categories[cKey]?.[key]) {
                       categoryKey = cKey;
                       originalCategoryName = roadmap.find(r_cat =>
                           r_cat.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-') === categoryKey
                       ) || categoryKey;
                       break;
                   }
               }
               const problemData = categoryKey ? categories[categoryKey]?.[key] : null;
               const problemName = problemData?.name || key;
               // Get the *last* timestamp if it's an array
               const timestampSource = Array.isArray(value.TIMESTAMP) ? value.TIMESTAMP[value.TIMESTAMP.length - 1] : value.TIMESTAMP;

               return (
                 <div key={key} id={`recap-${key}`} className={`carousel-item ${styles.recapCarouselItem}`}>
                   <div className={styles.recapCard} onClick={()=>handleCodeSession(problemData?.id || key, categoryKey)}>
                     <div className={styles.recapCardHeader}>
                        <div className={styles.recapIcon}><TaskIcon /></div>{/* Placeholder */}
                        <div className={styles.recapDetails}>
                           <span className={styles.recapTitle}>{problemName}</span>
                           <span className={`${styles.recapDetail} ${styles.recapTimestamp}`}>
                             {formatRelativeTime(timestampSource)}
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
      {/* Render BottomNavBar only if needed within this component */}
      {/* <BottomNavBar /> */}
    </div>
  );
};

export default Home;
