import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import styles from '../../styles/CategoryProblems.module.css'; // Adjust path if needed
import { useProblemStore } from '../../stores/problemStore'; // Adjust path
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { MdOutlineKeyboardArrowLeft as BackIcon, MdCheckCircle as SolvedIcon, MdSearch } from 'react-icons/md'; // Added Search, Solved icons

// Filter options matching the Problems screen
const filterOptions = ['All', 'Hot 50', 'Blind 75', 'NeetCode 150'];

const CategoryProblemsScreen = () => {
  // --- Hooks ---
  const navigate = useNavigate();
  const { categoryId } = useParams(); // Get category ID or "submissions" from route param
  const [searchParams] = useSearchParams(); // Get query parameters
  const activeListFilter = searchParams.get('filter') || 'All'; // Get filter like 'blind 75', default to 'All'

  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedProblems, setGroupedProblems] = useState({ Easy: [], Medium: [], Hard: [], Unknown: [] });
  const [isSubmissionsView, setIsSubmissionsView] = useState(false); // State to track if showing submissions

  // --- Store Data ---
  const { categories, loading: problemsLoading, error: problemsError, fetchCategories } = useProblemStore();
  const { userProfile, loading: userLoading } = useUserStore();
  const submissions = useMemo(() => userProfile?.submissions || {}, [userProfile]); // Memoize submissions
  const submittedProblemIds = useMemo(() => new Set(Object.keys(submissions)), [submissions]); // Memoize set of submitted IDs

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
    // Determine if this is the special submissions view
    const isSubmissionsRoute = categoryId === 'submissions';
    setIsSubmissionsView(isSubmissionsRoute);

    // Wait for necessary data
    if (!categories || problemsLoading || userLoading || (isSubmissionsRoute && !userProfile)) {
        setGroupedProblems({ Easy: [], Medium: [], Hard: [], Unknown: [] });
        return;
    }

    let initialProblemList = [];

    // --- MODIFIED: Select initial list based on route ---
    if (isSubmissionsRoute) {
        // If it's the submissions route, get all problems the user has submitted
        console.log("Filtering for submitted problems only.",submittedProblemIds);
        initialProblemList = [];
        // Iterate through all categories to find submitted problems
        for (const catKey in categories) {
            for (const probId in categories[catKey]) {
                if (submittedProblemIds.has(probId)) {
                    initialProblemList.push({ ...categories[catKey][probId], id: probId }); // Add problem data if submitted
                }
            }
        }
    } else if (categoryId && categories[categoryId]) {
        // If it's a regular category route, get problems for that category
        console.log(`Filtering for category: ${categoryId}`);
        initialProblemList = Object.values(categories[categoryId] || {});
    } else {
        console.log("No valid category ID or 'submissions' found in route.");
        initialProblemList = []; // No category match or submissions view
    }
    // --- End Modification ---


    // 1. Filter by List (Hot 50, Blind 75, etc.) - Apply AFTER selecting initial list
    let listFilteredProblems = initialProblemList;
    if (activeListFilter && activeListFilter !== 'All') {
        const filterKey = activeListFilter.toLowerCase();
        listFilteredProblems = initialProblemList.filter(problem =>
            problem.curated_lists && Array.isArray(problem.curated_lists) && problem.curated_lists.includes(filterKey)
        );
    }

    // 2. Filter by Search Term
    const searchFilteredProblems = listFilteredProblems.filter(problem =>
      (problem?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) // Add safety check for name
    );

    // 3. Group by Difficulty
    const grouped = searchFilteredProblems.reduce((acc, problem) => {
      const difficulty = problem.difficulty || 'Unknown';
      if (!acc[difficulty]) {
        acc[difficulty] = [];
      }
      // Add problem (sequence number added later during render)
      acc[difficulty].push(problem);
      return acc;
    }, { Easy: [], Medium: [], Hard: [], Unknown: [] }); // Initialize with expected keys

    // Sort problems within each difficulty group
    Object.keys(grouped).forEach(difficulty => {
        grouped[difficulty].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });

    setGroupedProblems(grouped);

  // Rerun when relevant data or filters change
  }, [categories, categoryId, activeListFilter, searchTerm, problemsLoading, userLoading, userProfile, submittedProblemIds]);


  // --- Event Handlers ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCodeSession = (problemKey,categoryKey) => {
    console.log(problemKey, categoryKey)
    navigate(`/${categoryKey}/solve/${problemKey}`)
  }

  // --- Render Logic ---
  // Determine the display title
  const displayTitle = isSubmissionsView
    ? "My Submissions"
    : (categories?.[categoryId]?.[Object.keys(categories[categoryId])[0]]['category'] || categoryId.replace(/-/g, ' ')); // Fallback formatting
  // Variable to track continuous sequence number
  let sequenceCounter = 0;

  return (
    <div className={styles.screenContainer}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={handleGoBack} className={styles.backButton}>
          <BackIcon size={28} />
        </button>
        <h1 className={styles.categoryTitle}>{displayTitle}</h1>
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

      {/* Loading / Error State */}
      {problemsLoading || userLoading && <p>Loading problems...</p>}
      {problemsError && <p className={styles.errorText}>Error loading problems: {problemsError}</p>}

      {/* Problems List */}
      {!problemsLoading && !userLoading && !problemsError && (
        <div className={styles.problemsList}>
          {/* Iterate through difficulties to render sections */}
          {['Easy', 'Medium', 'Hard', 'Unknown'].map((difficulty) => {
            const problemsInGroup = groupedProblems[difficulty];
            if (!problemsInGroup || problemsInGroup.length === 0) {
                return null; // Don't render section if no problems
            }

            return (
              <section key={difficulty} className={styles.difficultySection}>
                <div className={styles.difficultyHeader}>
                  <h2 className={styles.difficultyTitle}>{difficulty}</h2>
                  <span className={styles.problemCount}>{problemsInGroup.length}</span>
                </div>
                <ul className={styles.questionList}>
                  {/* Map through problems, incrementing continuous counter */}
                  {problemsInGroup.map((problem) => {
                    sequenceCounter++; // Increment counter for each problem rendered
                    // Check if solved (always true in submissions view, check normally otherwise)
                    const isSolved = isSubmissionsView || submissions.hasOwnProperty(problem.id);
                    // Format sequence number with leading zero using the continuous counter
                    const sequence = String(sequenceCounter).padStart(2, '0');
                    return (
                      <li key={problem.id} className={`${styles.questionItem} ${styles[`${difficulty.toLowerCase()}-border`]}`} onClick={_=>handleCodeSession(problem.id,problem.category.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-'))}> {/* Added difficulty border class */}
                        <div className={`${styles.questionNumber} ${styles[difficulty.toLowerCase()]}`}>{sequence}</div> {/* Added difficulty class */}
                        <div className={styles.questionDetails}>
                          <span className={`${styles.questionName} ${styles[difficulty.toLowerCase()]}`}>{problem.name}</span> {/* Added difficulty class */}
                          <span className={styles.questionTime}>Est. {difficulty==='Easy'?'15':difficulty==='Medium'?'20':'30'} Mins</span> {/* Placeholder */}
                        </div>
                        <div className={styles.questionStatus}>
                          {isSolved ? (
                            <SolvedIcon size={24} className={styles.solvedIcon} />
                          ) : (
                            <span className={`${styles.difficultyText} ${styles[difficulty.toLowerCase()]}`}>
                              {/* No icon */}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                   })}
                </ul>
              </section>
            );
          })}
           {/* Display message if no problems match filters */}
           {Object.values(groupedProblems).every(arr => arr.length === 0) && !problemsLoading && !userLoading && (
               <p className={styles.noResults}>No problems match the current filters.</p>
           )}
        </div>
      )}
    </div>
  );
};

export default CategoryProblemsScreen;
