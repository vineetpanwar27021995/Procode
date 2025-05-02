import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/CategoryProblems.module.css'; // Adjust path if needed
import { useProblemStore } from '../../stores/problemStore'; // Adjust path
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { MdOutlineKeyboardArrowLeft as BackIcon, MdCheckCircle as SolvedIcon, MdSearch } from 'react-icons/md'; // Added Search, Solved icons

const filterOptions = ['All', 'Hot 50', 'Blind 75', 'NeetCode 150'];

const CategoryProblems = () => {
  // --- Hooks ---
  const navigate = useNavigate();
  const { categoryId } = useParams(); // Get category ID from route param (e.g., "Arrays-&-Hashing")
  const [searchParams] = useSearchParams(); // Get query parameters
  const activeListFilter = searchParams.get('filter') || 'All'; // Get filter like 'blind 75', default to 'All'

  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedProblems, setGroupedProblems] = useState({ Easy: [], Medium: [], Hard: [] });

  // --- Store Data ---
  const { categories, loading: problemsLoading, error: problemsError, fetchCategories } = useProblemStore();
  const { userProfile, loading: userLoading } = useUserStore();
  const submissions = useMemo(() => userProfile?.submissions || {}, [userProfile]); // Memoize submissions

  // --- Fetch Data ---
  useEffect(() => {
    // Fetch categories if not already loaded
    if (!categories || Object.keys(categories).length === 0) {
      fetchCategories();
    }
    // User profile is likely loaded by App.js or another parent component
  }, [fetchCategories, categories]);

  // --- Filtering and Grouping Logic ---
  useEffect(() => {
    if (!categories || !categoryId || problemsLoading || userLoading) {
        // Clear or show loading if data isn't ready
        setGroupedProblems({ Easy: [], Medium: [], Hard: [] });
        return;
    }

    const problemsInCategory = categories[categoryId] || {}; // Get problems for the current category ID
    const problemList = Object.values(problemsInCategory); // Convert from {id: data} to [data]

    // 1. Filter by List (Hot 50, Blind 75, etc.)
    let listFilteredProblems = problemList;
    if (activeListFilter && activeListFilter !== 'All') {
        const filterKey = activeListFilter.toLowerCase();
        listFilteredProblems = problemList.filter(problem =>
            problem.curated_lists && Array.isArray(problem.curated_lists) && problem.curated_lists.includes(filterKey)
        );
    }

    // 2. Filter by Search Term
    const searchFilteredProblems = listFilteredProblems.filter(problem =>
      problem.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // 3. Group by Difficulty
    const grouped = searchFilteredProblems.reduce((acc, problem, index) => {
      const difficulty = problem.difficulty || 'Unknown'; // Default group
      if (!acc[difficulty]) {
        acc[difficulty] = [];
      }
      acc[difficulty].push({ ...problem, sequenceNumber: index + 1 });
      return acc;
    }, { Easy: [], Medium: [], Hard: [] });

    Object.keys(grouped).forEach(difficulty => {
        grouped[difficulty].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });


    setGroupedProblems(grouped);

  }, [categories, categoryId, activeListFilter, searchTerm, problemsLoading, userLoading]); // Re-run when data or filters change


  // --- Event Handlers ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleGoBack = () => {
    navigate(-1); // Go back to the previous page
  };

  // --- Render Logic ---
  // Get the original category name for display (find it in the categories object keys based on categoryId)
  const displayCategoryName = Object.keys(categories || {}).find(key => key === categoryId) || categoryId.replace(/-/g, ' '); // Fallback formatting

  return (
    <div className={styles.screenContainer}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={handleGoBack} className={styles.backButton}>
          <BackIcon size={28} />
        </button>
        <h1 className={styles.categoryTitle}>{displayCategoryName}</h1>
      </div>

      {/* Search Bar */}
      <div className={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search for Question"
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <button className={styles.searchButton}>
          <MdSearch size={24} />
        </button>
      </div>

      {problemsLoading || userLoading && <p>Loading problems...</p>}
      {problemsError && <p className={styles.errorText}>Error loading problems: {problemsError}</p>}

      {!problemsLoading && !userLoading && !problemsError && (
        <div className={styles.problemsList}>
          {['Easy', 'Medium', 'Hard', 'Unknown'].map(difficulty => (
            groupedProblems[difficulty]?.length > 0 && (
              <section key={difficulty} className={styles.difficultySection}>
                <div className={styles.difficultyHeader}>
                  <h2 className={styles.difficultyTitle}>{difficulty}</h2>
                  <span className={styles.problemCount}>{groupedProblems[difficulty].length}</span>
                </div>
                <ul className={styles.questionList}>
                  {groupedProblems[difficulty].map((problem, index) => {
                    const isSolved = submissions.hasOwnProperty(problem.id);
                    // Format sequence number with leading zero
                    const sequence = String(index + 1).padStart(2, '0');
                    return (
                      <li key={problem.id} className={styles.questionItem+` ${(difficulty.toLowerCase())}-border`}>
                        <div className={styles.questionNumber +` ${difficulty.toLowerCase()}`}>{sequence}</div>
                        <div className={styles.questionDetails}>
                          <span className={styles.questionName +` ${difficulty.toLowerCase()}`}>{problem.name}</span>
                          {/* Placeholder for time - use short_description or omit if not available */}
                          {/* <span className={styles.questionTime}>{problem.short_description ? problem.short_description.substring(0, 30)+'...' : 'Info unavailable'}</span> */}
                           <span className={styles.questionTime}>Est. {difficulty==='Easy'?'15':difficulty==='Medium'?'20':'30'} Mins</span> {/* Placeholder */}
                        </div>
                        <div className={styles.questionStatus}>
                          {isSolved ? (
                            <SolvedIcon size={24} className={styles.solvedIcon} />
                          ) : (
                            <span className={`${styles.difficultyText} ${styles[difficulty.toLowerCase()]}`}>
                              {/* No icon, just difficulty text */}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                   })}
                </ul>
              </section>
            )
          ))}
           {/* Display message if no problems match filters */}
           {Object.values(groupedProblems).every(arr => arr.length === 0) && !problemsLoading && !userLoading && (
               <p className={styles.noResults}>No problems match the current filters.</p>
           )}
        </div>
      )}
    </div>
  );
};

export default CategoryProblems;
