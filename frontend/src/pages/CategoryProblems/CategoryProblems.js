import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
// Adjust path based on your actual file structure
import styles from '../../styles/CategoryProblems.module.css';
import { useProblemStore } from '../../stores/problemStore'; // Adjust path
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { MdOutlineKeyboardArrowLeft as BackIcon, MdCheckCircle as SolvedIcon, MdSearch } from 'react-icons/md';
import Loader from '../../components/Loader/Loader'; // ** Import Loader **

// Filter options matching the Problems screen
const filterOptions = ['All', 'Hot 50', 'Blind 75', 'NeetCode 150'];

const CategoryProblemsScreen = () => {
  // --- Hooks ---
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const [searchParams] = useSearchParams();
  const activeListFilter = searchParams.get('filter') || 'All';

  // --- State ---
  const [searchTerm, setSearchTerm] = useState('');
  const [groupedProblems, setGroupedProblems] = useState({ Easy: [], Medium: [], Hard: [], Unknown: [] });
  const [isSubmissionsView, setIsSubmissionsView] = useState(false);
  // --- NEW: Combined loading state ---
  const [isLoading, setIsLoading] = useState(true);

  // --- Store Data ---
  const { categories, loading: problemsLoading, error: problemsError, fetchCategories } = useProblemStore();
  const { userProfile, loading: userLoading, fetchUserProfile } = useUserStore(); // Fetch profile needed for submissions
  const submissions = useMemo(() => userProfile?.submissions || {}, [userProfile]);
  const submittedProblemIds = useMemo(() => new Set(Object.keys(submissions)), [submissions]);

  // --- Fetch Data ---
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      const fetches = [];
      // Check if data *needs* fetching based on store state
      if (!useUserStore.getState().userProfile && !useUserStore.getState().loading) fetches.push(fetchUserProfile());
      if ((!useProblemStore.getState().categories || Object.keys(useProblemStore.getState().categories).length === 0) && !useProblemStore.getState().loading) fetches.push(fetchCategories());

      if (fetches.length > 0) {
        console.log("CategoryProblemsScreen: Fetching initial data...");
        if (isMounted) setIsLoading(true); // Set loading before fetches start
        await Promise.all(fetches).catch(err => {
          console.error("Error fetching initial data for CategoryProblemsScreen:", err);
        });
        // Loading state will be handled by the filtering effect
      } else {
         // If no fetches needed, set initial loading state based on current store loading
         if (isMounted) setIsLoading(useUserStore.getState().loading || useProblemStore.getState().loading);
      }
    };
    loadData();
    return () => { isMounted = false };
  }, [fetchCategories, fetchUserProfile]); // Fetch functions are stable

  // --- Filtering and Grouping Logic ---
  useEffect(() => {
    const isSubmissionsRoute = categoryId === 'submissions';
    setIsSubmissionsView(isSubmissionsRoute);

    // Determine if essential data is still loading from stores
    const stillLoadingData = problemsLoading || userLoading || !categories || (isSubmissionsRoute && !userProfile);

    if (stillLoadingData) {
        setIsLoading(true); // Keep showing loader if store data is loading
        setGroupedProblems({ Easy: [], Medium: [], Hard: [], Unknown: [] }); // Clear previous results
        return; // Wait for data
    }

    // If data is loaded, start processing (show loader briefly if needed)
    setIsLoading(true);
    console.log("CategoryProblemsScreen: Data loaded, starting filtering/grouping...");

    let initialProblemList = [];

    if (isSubmissionsRoute) {
        console.log("Filtering for submitted problems only.", submittedProblemIds);
        initialProblemList = [];
        for (const catKey in categories) {
            for (const probId in categories[catKey]) {
                if (submittedProblemIds.has(probId)) {
                    initialProblemList.push({ ...categories[catKey][probId], id: probId });
                }
            }
        }
    } else if (categoryId && categories[categoryId]) {
        console.log(`Filtering for category: ${categoryId}`);
        initialProblemList = Object.values(categories[categoryId] || {});
    } else {
        console.log("No valid category ID or 'submissions' found in route.");
        initialProblemList = [];
    }

    let listFilteredProblems = initialProblemList;
    if (activeListFilter && activeListFilter !== 'All') {
        const filterKey = activeListFilter.toLowerCase();
        listFilteredProblems = initialProblemList.filter(problem =>
            problem.curated_lists && Array.isArray(problem.curated_lists) && problem.curated_lists.includes(filterKey)
        );
    }

    const searchFilteredProblems = listFilteredProblems.filter(problem =>
      (problem?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const grouped = searchFilteredProblems.reduce((acc, problem) => {
      const difficulty = problem.difficulty || 'Unknown';
      if (!acc[difficulty]) acc[difficulty] = [];
      acc[difficulty].push(problem);
      return acc;
    }, { Easy: [], Medium: [], Hard: [], Unknown: [] });

    Object.keys(grouped).forEach(difficulty => {
        grouped[difficulty].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    });

    setGroupedProblems(grouped);
    console.log("CategoryProblemsScreen: Filtering/grouping complete.");
    setIsLoading(false); // Processing finished

  }, [categories, categoryId, activeListFilter, searchTerm, problemsLoading, userLoading, userProfile, submittedProblemIds]); // Dependencies


  // --- Event Handlers ---
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleCodeSession = (problemId, categoryKey) => {
     if (!problemId || !categoryKey) {
        console.error("Missing problemId or categoryKey for navigation");
        return;
    }
    console.log(`Navigating to problem: ${problemId} in category: ${categoryKey}`);
    navigate(`/${categoryKey}/solve/${problemId}`); // Use categoryKey (sanitized)
  }

  // --- Render Logic ---
  const displayTitle = isSubmissionsView
    ? "My Submissions"
    : (Object.keys(categories || {}).find(key => key === categoryId) || categoryId.replace(/-/g, ' '));


  // --- MODIFIED: Use Loader ---
  if (isLoading) {
      return <Loader message={problemsLoading || userLoading ? "Loading Data..." : "Processing..."} />;
  }

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

      {/* Problems List - Render only if not loading */}
      {problemsError && <p className={styles.errorText}>Error loading problems: {problemsError}</p>}
      {!problemsError && (
        <div className={styles.problemsList}>
          {['Easy', 'Medium', 'Hard', 'Unknown'].map((difficulty) => {
            const problemsInGroup = groupedProblems[difficulty];
            if (!problemsInGroup || problemsInGroup.length === 0) {
                return null;
            }

            return (
              <section key={difficulty} className={styles.difficultySection}>
                <div className={styles.difficultyHeader}>
                  <h2 className={styles.difficultyTitle}>{difficulty}</h2>
                  <span className={styles.problemCount}>{problemsInGroup.length}</span>
                </div>
                <ul className={styles.questionList}>
                  {problemsInGroup.map((problem) => {
                    const isSolved = isSubmissionsView || submissions.hasOwnProperty(problem.id);
                    // Find the category key for navigation
                    const categoryKey = problem.category?.replace(/[\s\/]+/g, '-').replace(/[^\w\-\&]/g, '').replace(/-+/g, '-') || categoryId;

                    return (
                      <li key={problem.id} className={`${styles.questionItem} ${styles[`${difficulty.toLowerCase()}-border`]}`} onClick={()=>handleCodeSession(problem.id, categoryKey)}>
                        <div className={`${styles.questionNumber} ${styles[difficulty.toLowerCase()]}`}>{problem.question_number}</div>
                        <div className={styles.questionDetails}>
                          <span className={`${styles.questionName} ${styles[difficulty.toLowerCase()]}`}>{problem.name}</span>
                          <span className={styles.questionTime}>Est. {difficulty==='Easy'?'15':difficulty==='Medium'?'20':'30'} Mins</span>
                        </div>
                        <div className={styles.questionStatus}>
                          {isSolved ? (
                            <SolvedIcon size={24} className={styles.solvedIcon} />
                          ) : (
                            <span className={`${styles.difficultyText} ${styles[difficulty.toLowerCase()]}`}></span>
                          )}
                        </div>
                      </li>
                    );
                   })}
                </ul>
              </section>
            );
          })}
           {Object.values(groupedProblems).every(arr => arr.length === 0) && (
               <p className={styles.noResults}>No problems match the current filters.</p>
           )}
        </div>
      )}
    </div>
  );
};

export default CategoryProblemsScreen;
