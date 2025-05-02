import React, { useEffect, useState, useMemo } from 'react'; // Import useState, useMemo
import styles from '../../styles/Problems.module.css'; // Assuming CSS module is in the same folder
import { useProblemStore } from '../../stores/problemStore'; // Adjust path as needed
import { MdPlayArrow as PlayIcon, MdAdd as AddIcon, MdOutlineFilterList as FilterIcon } from 'react-icons/md';
import { FiAward, FiBox, FiCpu, FiDatabase, FiGitBranch, FiGrid, FiHash, FiLayers, FiLink, FiList, FiPercent, FiRepeat, FiSearch, FiShuffle, FiTerminal, FiZap } from 'react-icons/fi';
import { MdTimeline, MdViewQuilt } from 'react-icons/md';
import { Button } from 'components/index';
import { MdOutlineKeyboardArrowLeft as BackIcon } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';

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
  'Default': { icon: <FiBox />, colorClass: styles.topicColorGray }
};


const filters = ['All', 'Hot 50', 'Blind 75', 'NeetCode 150'];

const Problems = () => {
  const { categories, roadmap, loading, error, fetchCategories, fetchRoadmap } = useProblemStore();
  const navigate = useNavigate();

  const [activeFilter, setActiveFilter] = useState('All'); 

  useEffect(() => {
    if (!roadmap || roadmap.length === 0) {
        fetchRoadmap();
    }
    if (!categories || Object.keys(categories).length === 0) {
        fetchCategories();
    }
  }, [fetchCategories, fetchRoadmap, categories, roadmap]); // Dependencies

  const filteredCategories = useMemo(() => {
    console.log(`Filtering categories for: ${activeFilter}`);
    if (!categories || Object.keys(categories).length === 0) {
        return {}; 
    }

    if (activeFilter === 'All') {
      return categories;
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
  }, [categories, activeFilter]); 


  const selectFilter = (filter) => {
    console.log("Selected filter:", filter);
    setActiveFilter(filter); 
  };

  const playAction = () => console.log("Play action");
  const addProblems = () => console.log("Add problems");
  const tidyUp = () => console.log("Tidy up");
  const selectTopic = (topicName) => console.log("Selected topic:", topicName);
  const categoryProblem = (categoryId) => navigate(`/category/${categoryId}?filter=${activeFilter}`);

  const displayRoadmap = roadmap || [];

  return (
    <div className={styles.problemsContainer}>

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
        <button onClick={playAction} className={styles.playButton}>
          <PlayIcon size={24} />
        </button>
      </div>

      {/* Filter Section */}
      <div className={styles.filterSection}>
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => selectFilter(filter)}
            // --- NEW: Apply active style conditionally ---
            className={`${styles.filterButton} ${activeFilter === filter ? styles.filterButtonActive : ''}`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Topics Section */}
      <section className={styles.topicsSection}>
        <h2 className={styles.sectionTitle}>Topics</h2>
        {/* Handle Loading and Error States */}
        {loading && <p>Loading topics...</p>}
        {error && <p className={styles.errorText}>Error loading topics: {error}</p>}
        {!loading && !error && (
          <div className={styles.topicsGrid}>
            {displayRoadmap.map(categoryName => {
              const categoryId = categoryName.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-');
              const styleInfo = categoryStyles[categoryName] || categoryStyles['Default'];
              const problems = filteredCategories[categoryId] || {};
              const problemCount = Object.keys(problems).length;
              return (
                <button
                  key={categoryName}
                  onClick={() => categoryProblem(categoryId)}
                  className={`${styles.topicCard} ${styleInfo.colorClass}`}
                >
                  <div className={styles.topicIconWrapper}>
                     <div className={styles.topicIcon}>{styleInfo.icon}</div>
                  </div>
                  <span className={styles.topicName}>{categoryName}</span>
                  <span className={styles.topicProblemCount}>{problemCount} Problems</span>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Problems;
