import React, { useEffect, useState, useMemo } from 'react';
import styles from '../../styles/Problems.module.css'; // Adjust path if needed
import { useProblemStore } from '../../stores/problemStore'; // Adjust path as needed
import { MdPlayArrow as PlayIcon, MdAdd as AddIcon, MdOutlineFilterList as FilterIcon, MdOutlineKeyboardArrowLeft as BackIcon } from 'react-icons/md';
// Import all necessary icons
import { FiAward, FiBox, FiCpu, FiDatabase, FiGitBranch, FiGrid, FiHash, FiLayers, FiLink, FiList, FiPercent, FiRepeat, FiSearch, FiShuffle, FiTerminal, FiZap } from 'react-icons/fi';
import { MdTimeline, MdViewQuilt } from 'react-icons/md';
import { Button } from '../../components'; // Assuming Button is exported from components/index.js
import { useNavigate } from 'react-router-dom';
import Loader from '../../components/Loader/Loader'; // ** Import Loader **

// --- Category Styles Mapping ---
const categoryStyles = {
  // Roadmap Categories
  'Arrays & Hashing': { icon: <FiHash />, colorClass: styles.topicColorPink },
  'Two Pointers': { icon: <FiShuffle />, colorClass: styles.topicColorBlue },
  'Sliding Window': { icon: <FiRepeat />, colorClass: styles.topicColorOrange },
  'Stack': { icon: <FiLayers />, colorClass: styles.topicColorGreen },
  'Binary Search': { icon: <FiSearch />, colorClass: styles.topicColorYellow },
  'Linked List': { icon: <FiLink />, colorClass: styles.topicColorPurple },
  'Trees': { icon: <FiGitBranch />, colorClass: styles.topicColorGreen }, // Reusing green
  'Trie': { icon: <FiCpu />, colorClass: styles.topicColorBlue },      // Reusing blue
  'Heap / Priority Queue': { icon: <FiDatabase />, colorClass: styles.topicColorOrange }, // Corrected name format
  'Backtracking': { icon: <FiGrid />, colorClass: styles.topicColorPink },
  'Graphs': { icon: <FiGitBranch />, colorClass: styles.topicColorPurple }, // Reusing purple
  'Advanced Graphs': { icon: <FiZap />, colorClass: styles.topicColorBlue }, // New category - FiZap example
  '1-D Dynamic Programming': { icon: <MdTimeline />, colorClass: styles.topicColorYellow }, // New category - MdTimeline example
  '2-D Dynamic Programming': { icon: <MdViewQuilt />, colorClass: styles.topicColorOrange }, // New category - MdViewQuilt example
  'Greedy': { icon: <FiAward />, colorClass: styles.topicColorGreen },
  'Intervals': { icon: <FiGrid />, colorClass: styles.topicColorYellow }, // Reusing FiGrid
  'Math & Geometry': { icon: <FiPercent />, colorClass: styles.topicColorOrange }, // Renamed from 'Math'
  'Bit Manipulation': { icon: <FiTerminal />, colorClass: styles.topicColorPurple },

  // Fallback for any unexpected category not in the roadmap
  'Default': { icon: <FiBox />, colorClass: styles.topicColorGray }
};


const filters = ['All', 'Hot 50', 'Blind 75', 'NeetCode 150'];

const Problems = () => {
  // Get state and actions from Zustand store
  // Use selector to get multiple values efficiently
  const { categories, roadmap, loading, error, fetchCategories, fetchRoadmap } = useProblemStore();
  const navigate = useNavigate();

  // State for active filter
  const [activeFilter, setActiveFilter] = useState('All');
  // --- NEW: State to track if initial data check/fetch is needed ---
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Fetch categories and roadmap when component mounts ONLY if they aren't already loaded/loading
  useEffect(() => {
    let needsRoadmap = false;
    let needsCategories = false;

    // Check initial state synchronously
    const currentState = useProblemStore.getState();
    if (!currentState.roadmap || currentState.roadmap.length === 0) {
        needsRoadmap = true;
    }
    if (!currentState.categories || Object.keys(currentState.categories).length === 0) {
        needsCategories = true;
    }

    // Only fetch if needed and not already loading
    if (needsRoadmap && !currentState.loading) {
        console.log("Problems Mount: Fetching roadmap...");
        fetchRoadmap();
    }
    if (needsCategories && !currentState.loading) {
         console.log("Problems Mount: Fetching categories...");
        fetchCategories();
    }

    // Mark initial load check as complete after attempting fetches (or determining none needed)
    setIsInitialLoad(false);

  }, [fetchCategories, fetchRoadmap]); // Dependencies are stable functions

  // Memoized function to filter categories based on active filter
  const filteredCategories = useMemo(() => {
    // Don't filter until categories are available
    if (!categories || Object.keys(categories).length === 0) {
        return {};
    }
    console.log(`Filtering categories for: ${activeFilter}`);

    if (activeFilter === 'All') {
      return categories; // Return all categories if 'All' is selected
    }

    const filterKey = activeFilter.toLowerCase();
    const result = {};

    for (const categoryId in categories) {
      const problemsInCategory = categories[categoryId];
      const filteredProblems = {};
      let hasMatchingProblems = false;

      for (const problemId in problemsInCategory) {
        const problem = problemsInCategory[problemId];
        if (problem.curated_lists && Array.isArray(problem.curated_lists) && problem.curated_lists.includes(filterKey)) {
          filteredProblems[problemId] = problem;
          hasMatchingProblems = true;
        }
      }

      if (hasMatchingProblems) {
        result[categoryId] = filteredProblems;
      }
    }
    console.log("Filtered Result:", result);
    return result;
  }, [categories, activeFilter]); // Recompute when categories or filter change


  // Handler to update the active filter state
  const selectFilter = (filter) => {
    console.log("Selected filter:", filter);
    setActiveFilter(filter);
  };

  // Handler to navigate to a specific category's problem list
  const categoryProblem = (categoryId) => {
      navigate(`/category/${categoryId}?filter=${activeFilter}`);
  };

  // Get the roadmap for display order, default to empty array if not loaded
  const displayRoadmap = roadmap || [];

  // --- RENDER: Use Loader based on initial check and store loading state ---
  // Show loader if it's the initial load check OR if the store is actively loading data
  const showLoader = isInitialLoad || loading;
  if (showLoader) {
      return <Loader message="Loading Problems..." />;
  }

  // --- Render content only when not loading ---
  return (
    <div className={styles.problemsContainer}>

        {/* Back Button */}
        <div className={styles.backButton}>
         <Button
            variant="text"
            onClick={() => navigate('/home')}
            className="btn btn-ghost p-1 flex items-center"
          >
            <BackIcon size={28} />
          </Button>
        </div>

      {/* Header Section */}
      <div className={styles.header}>
        <h1 className={styles.screenTitle}>Problems</h1>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => selectFilter(filter)}
            className={`${styles.filterButton} ${activeFilter === filter ? styles.filterButtonActive : ''}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Topics Section */}
      <section className={styles.topicsSection}>
        <h2 className={styles.sectionTitle}>Topics</h2>
        {/* Handle Error State */}
        {error && <p className={styles.errorText}>Error loading topics: {error}</p>}
        {!error && ( // Render grid only if no error
          <div className={styles.topicsGrid}>
            {/* Map over roadmap for order, use filteredCategories for data */}
            {displayRoadmap.map(categoryName => {
              const categoryId = categoryName.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
              const styleInfo = categoryStyles[categoryName] || categoryStyles['Default'];
              const problems = filteredCategories[categoryId] || {};
              const problemCount = Object.keys(problems).length;

              if (activeFilter !== 'All' && problemCount === 0) {
                 return null;
              }

              return (
                <button
                  key={categoryName}
                  onClick={() => categoryProblem(categoryId)}
                  className={`${styles.topicCard} ${styleInfo.colorClass}`}
                  disabled={problemCount === 0}
                >
                  <div className={styles.topicIconWrapper}>
                     <div className={styles.topicIcon}>{styleInfo.icon}</div>
                  </div>
                  <span className={styles.topicName}>{categoryName}</span>
                  <span className={styles.topicProblemCount}>{problemCount} Problems</span>
                </button>
              );
            })}
             {displayRoadmap.length > 0 && Object.keys(filteredCategories).length === 0 && activeFilter !== 'All' && (
                 <p className={styles.noResults}>No topics match the selected filter.</p>
             )}
             {/* Add message if roadmap itself is empty */}
              {displayRoadmap.length === 0 && !loading && !error && (
                 <p className={styles.noResults}>No roadmap data available.</p>
              )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Problems;
