import styles from '../../styles/Profile.module.css'; // Shared CSS module
import React, { useMemo } from 'react';
import { useUserStore } from '../../stores/userStore'; // Adjust path
import { useProblemStore } from '../../stores/problemStore'; // Adjust path
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip as RechartsTooltip } from 'recharts'; // Renamed Tooltip to avoid conflict
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css'; // Import heatmap styles
import { FiCheckSquare, FiAward, FiPercent, FiBarChart2 } from 'react-icons/fi';
import moment from 'moment'; // For heatmap date calculations
// NEW: Import react-tooltip
import { Tooltip } from 'react-tooltip'; // Import v5 version
import 'react-tooltip/dist/react-tooltip.css'; // Import tooltip styles

// --- Helper function to sanitize category names for keys ---
const sanitizeCategoryKey = (categoryName) => {
    if (typeof categoryName !== 'string') return 'unknown-category';
    return categoryName
           .replace(/[\s\/]+/g, '-') // Replace spaces and slashes with hyphens
           .replace(/[^\w\-\&]/g, '') // Remove other invalid characters except hyphen and ampersand
           .replace(/-+/g, '-'); // Collapse multiple hyphens
};


const StatsTab = () => {
    // Get data from stores
    const { userProfile } = useUserStore();
    const { categories, roadmap } = useProblemStore();

    // --- Calculate Dynamic Stats using useMemo ---
    const calculatedStats = useMemo(() => {
        console.log("Recalculating stats tab data...");
        const stats = {
            quizzes: 0,
            leaderboardRank: 2, // Static as requested
            accuracy: 0,
            recall: 86, // Static as requested
            heatmapData: [],
            strongTopicsData: [],
            weakTopicsData: [],
        };

        // Guard clause: Exit if essential data is missing, but provide default chart data
        if (!userProfile?.submissions || !categories || !roadmap || roadmap.length === 0 || Object.keys(categories).length === 0) {
            console.log("User submissions, categories, or roadmap data not available for stats calculation.");
            const defaultScoreWeak = 30; // Default score for weak chart when no data
            const defaultScoreStrong = 0; // Default score for strong chart when no data
            // Ensure roadmap is at least an empty array before mapping
            const currentRoadmap = roadmap || [];
            stats.strongTopicsData = currentRoadmap.map(catName => ({ topic: catName, score: defaultScoreStrong, fullMark: 100 }));
            stats.weakTopicsData = currentRoadmap.map(catName => ({ topic: catName, score: defaultScoreWeak, fullMark: 100 }));
            return stats;
        }

        const submissions = userProfile.submissions;
        const submittedProblemIds = Object.keys(submissions);
        stats.quizzes = submittedProblemIds.length; // Total submissions count

        let totalSuccessAttempts = 0;
        let totalUserAttempts = 0;
        const heatmapCounts = {};
        const categoryStats = {}; // Use original roadmap name as key
        let anyCategoryUnsolved = false; // Flag to track if any category still has unsolved problems

        // Initialize categoryStats and check initial unsolved status
        roadmap.forEach(catName => {
            const catKey = sanitizeCategoryKey(catName);
            const problemsInCategory = categories[catKey] || {};
            const totalProblems = Object.keys(problemsInCategory).length;
            categoryStats[catName] = {
                key: catKey,
                solved: 0,
                success: 0,
                attempts: 0,
                totalProblems: totalProblems,
                accuracy: 0,
                hasUnsolved: totalProblems > 0, // Initially true if problems exist
            };
            // Don't set anyCategoryUnsolved here yet, check after processing submissions
        });

        // 1. Process Submissions
        for (const problemId in submissions) {
            const submissionData = submissions[problemId];
            const successCount = Number(submissionData.SUCCESS_ATTEMPT_COUNT) || 0;
            const attemptCount = Number(submissionData.USER_ATTEMPT_COUNT) || 0;

            totalSuccessAttempts += successCount;
            totalUserAttempts += attemptCount;

            // Heatmap data
            let timestampSource = submissionData.TIMESTAMP;
            const timestamps = Array.isArray(timestampSource) ? timestampSource : [timestampSource];
            timestamps.forEach(ts => {
                if (ts) {
                    let dateStr = null;
                    if (ts.toDate) { dateStr = moment(ts.toDate()).format('YYYY-MM-DD'); }
                    else { const p = moment(ts); if (p.isValid()) dateStr = p.format('YYYY-MM-DD'); }
                    if (dateStr) heatmapCounts[dateStr] = (heatmapCounts[dateStr] || 0) + 1;
                }
            });

            // Find category and update stats
            let categoryNameFound = null;
            for (const categoryKeyLoop in categories) {
                if (categories[categoryKeyLoop]?.[problemId]) {
                    const originalName = roadmap.find(r_cat => sanitizeCategoryKey(r_cat) === categoryKeyLoop);
                    if (originalName) categoryNameFound = originalName;
                    else categoryNameFound = categoryKeyLoop;
                    break;
                }
            }

            if (categoryNameFound && categoryStats[categoryNameFound]) {
                const catStat = categoryStats[categoryNameFound];
                catStat.solved += 1;
                catStat.success += successCount;
                catStat.attempts += attemptCount;
                if (catStat.attempts > 0) {
                    catStat.accuracy = parseFloat(((catStat.success / catStat.attempts) * 100).toFixed(1));
                }
                if (catStat.solved >= catStat.totalProblems) {
                    catStat.hasUnsolved = false; // Mark as solved only when all problems done
                }
            }
        }

        // After processing all submissions, check if *any* category remains unsolved
        anyCategoryUnsolved = Object.values(categoryStats).some(stat => stat.hasUnsolved);

        // 2. Calculate Overall Accuracy
        if (totalUserAttempts > 0) {
            stats.accuracy = parseFloat(((totalSuccessAttempts / totalUserAttempts) * 100).toFixed(1));
        }

        // 3. Format Heatmap Data
        stats.heatmapData = Object.entries(heatmapCounts).map(([date, count]) => ({ date, count }));

        // 4. --- REVISED: Calculate Strong/Weak Radar Data ---
        const strongData = [];
        const weakData = [];

        if (anyCategoryUnsolved) {
            // --- Scenario 1: At least one category has unsolved problems ---
            console.log("Calculating radar data: Unsolved categories exist.");
            roadmap.forEach(categoryName => {
                const catStat = categoryStats[categoryName];
                if (!catStat) { // Should not happen if initialized correctly
                     strongData.push({ topic: categoryName, score: 0, fullMark: 100 });
                     weakData.push({ topic: categoryName, score: 60, fullMark: 100 });
                     return;
                }

                if (catStat.hasUnsolved) {
                    // Unsolved category: Weak score = 60, Strong score = 0
                    strongData.push({ topic: categoryName, score: catStat.accuracy?catStat.accuracy:0, fullMark: 100 });
                    weakData.push({ topic: categoryName, score: catStat.accuracy?0:60, fullMark: 100 });
                } else {
                    // Solved category: Strong score = accuracy, Weak score = 0
                    strongData.push({ topic: categoryName, score: catStat.accuracy, fullMark: 100 });
                    weakData.push({ topic: categoryName, score: 0, fullMark: 100 });
                }
            });
        } else {
            // --- Scenario 2: All categories are fully solved ---
            console.log("Calculating radar data: All categories solved. Splitting by accuracy.");
            // Create list of categories with their final accuracy, excluding those with 0 problems
            const solvedPerformances = roadmap
                .map(categoryName => ({
                    topic: categoryName,
                    score: categoryStats[categoryName]?.accuracy || 0,
                    totalProblems: categoryStats[categoryName]?.totalProblems || 0
                }))
                .filter(cat => cat.totalProblems > 0); // Exclude categories with 0 problems

            // Sort by accuracy ascending
            solvedPerformances.sort((a, b) => a.score - b.score);

            const midPoint = Math.ceil(solvedPerformances.length / 2);
            // Create Sets for efficient lookup of strong/weak topics among those with problems
            const weakTopicsSet = new Set(solvedPerformances.slice(0, midPoint).map(c => c.topic));
            const strongTopicsSet = new Set(solvedPerformances.slice(midPoint).map(c => c.topic));

            // Populate final arrays based on sets, iterating through the full roadmap
            roadmap.forEach(categoryName => {
                 const catStat = categoryStats[categoryName];
                 if (!catStat) return; // Should not happen

                 const accuracy = catStat.accuracy;

                 if (weakTopicsSet.has(categoryName)) {
                     // Belongs to weaker half of solved categories
                     strongData.push({ topic: categoryName, score: 0, fullMark: 100 });
                     weakData.push({ topic: categoryName, score: accuracy, fullMark: 100 });
                 } else if (strongTopicsSet.has(categoryName)) {
                     // Belongs to stronger half of solved categories
                     strongData.push({ topic: categoryName, score: accuracy, fullMark: 100 });
                     weakData.push({ topic: categoryName, score: 0, fullMark: 100 });
                 } else {
                     // Category was not in solvedPerformances (must have had 0 problems)
                     // Assign 0 score to both strong and weak charts for these.
                     strongData.push({ topic: categoryName, score: 0, fullMark: 100 });
                     weakData.push({ topic: categoryName, score: 0, fullMark: 100 });
                 }
            });
        }

        stats.strongTopicsData = strongData;
        stats.weakTopicsData = weakData;
        // --- End Radar Data Calculation ---

        console.log("Final Calculated Stats:", stats);
        return stats;

    }, [userProfile, categories, roadmap]); // Recalculate when data changes

    // Function to determine heatmap color intensity
    const getClassForValue = (value) => {
        if (!value || value.count === 0) return styles.heatmapColorEmpty;
        if (value.count <= 1) return styles.heatmapColor1;
        if (value.count <= 2) return styles.heatmapColor2;
        if (value.count <= 3) return styles.heatmapColor3;
        return styles.heatmapColor4;
    };

    return (
        <div className={`${styles.tabContent} ${styles.statsTab}`}>
            {/* --- Activity Grid Section --- */}
            <div className={styles.activityGrid}>
                <div className={styles.activityCard}>
                    <FiCheckSquare className={`${styles.activityIcon} ${styles.iconQuizzes}`} />
                    <span className={styles.activityValue}>{calculatedStats.quizzes}</span>
                    <span className={styles.activityLabel}>Submissions</span> {/* Changed label */}
                </div>
                <div className={styles.activityCard}>
                    <FiAward className={`${styles.activityIcon} ${styles.iconLeaderboard}`} />
                    <span className={styles.activityValue}>#{calculatedStats.leaderboardRank}</span>
                    <span className={styles.activityLabel}>Leaderboard</span>
                </div>
                <div className={styles.activityCard}>
                    <FiPercent className={`${styles.activityIcon} ${styles.iconAccuracy}`} />
                    <span className={styles.activityValue}>{calculatedStats.accuracy}%</span>
                    <span className={styles.activityLabel}>Accuracy</span>
                </div>
                <div className={styles.activityCard}>
                    <FiBarChart2 className={`${styles.activityIcon} ${styles.iconRecall}`} />
                    <span className={styles.activityValue}>{calculatedStats.recall}%</span>
                    <span className={styles.activityLabel}>Recall</span>
                </div>
            </div>
            {/* --- End Activity Grid Section --- */}

            {/* Heatmap Section */}
            <div className={styles.statsSection}>
                <h4 className={styles.statsTitle}>CONTRIBUTION HEATMAP</h4>
                <div className={styles.heatmapContainer}>
                    <CalendarHeatmap
                        startDate={moment().subtract(1, 'year').toDate()}
                        endDate={new Date()}
                        values={calculatedStats.heatmapData}
                        classForValue={getClassForValue}
                        tooltipDataAttrs={value => ({
                            'data-tooltip-id': 'heatmap-tooltip',
                            'data-tooltip-content': `${value?.date || 'No date'}: ${value?.count || 0} submissions`,
                        })}
                        showWeekdayLabels={true}
                        showMonthLabels={true}
                        monthLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']}
                        gutterSize={2}
                    />
                </div>
            </div>

            {/* Radar Charts Section */}
            <div className={styles.statsSection}>
                <h4 className={styles.statsTitle}>STRONGEST TOPICS</h4>
                <div className={styles.radarChartContainer}>
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={calculatedStats.strongTopicsData}>
                            <PolarGrid stroke="var(--radar-grid-color, #555)" />
                            <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--welcome-text-color)', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar name="Accuracy" dataKey="score" stroke="var(--radar-strong-stroke, #8884d8)" fill="var(--radar-strong-fill, #8884d8)" fillOpacity={0.6} />
                            <RechartsTooltip contentStyle={{ backgroundColor: 'var(--welcome-card-bg)', border: '1px solid var(--welcome-border-color)' }}/>
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className={styles.statsSection}>
                <h4 className={styles.statsTitle}>WEAKEST TOPICS</h4>
                <div className={styles.radarChartContainer}>
                    <ResponsiveContainer width="100%" height={250}>
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={calculatedStats.weakTopicsData}>
                        <PolarGrid stroke="var(--radar-grid-color, #555)"/>
                        <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--welcome-text-color)', fontSize: 10 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                        <Radar name="Score" dataKey="score" stroke="var(--radar-weak-stroke, #ff7300)" fill="var(--radar-weak-fill, #ff7300)" fillOpacity={0.6} />
                         <RechartsTooltip contentStyle={{ backgroundColor: 'var(--welcome-card-bg)', border: '1px solid var(--welcome-border-color)' }}/>
                        </RadarChart>
                    </ResponsiveContainer>
                 </div>
            </div>

             {/* Add react-tooltip component */}
             <Tooltip id="heatmap-tooltip" />
        </div>
    );
};

export default StatsTab;
