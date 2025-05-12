import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
// Removed useWindowSize as it's not used in the provided snippet's logic
import { getDifficultyBorderClass, getDifficultyClass, getBgColorClass } from "../../utils/UIHelper"; // Adjust path
import { useThemeStore } from '../../stores/themeStore'; // Adjust path
import styles from '../../styles/ProblemView.module.css'; // Import CSS Module
import { MdOutlineKeyboardArrowLeft as BackIcon, MdOutlineLightbulb as HintIcon, MdOutlineExpandMore as ExpandIcon, MdOutlineChevronRight as CollapseIcon } from 'react-icons/md'; // Icons for hints

const ProblemView = ({ problem, categoryId }) => {
  const darkMode = useThemeStore((state) => state.darkMode);
  const navigate = useNavigate();

  // --- State for Accordion ---
  // Stores the index of the currently open hint, or null if all are closed
  const [openHintIndex, setOpenHintIndex] = useState(null);

  const handleBack = () => {
    if (window.history.length > 2) {
      navigate(-1); // go back
    } else {
      navigate("/"); // fallback to home or a relevant problems list page
    }
  };

  // Extract description and examples (assuming problem.description contains both)
  // This logic might need adjustment based on the exact structure of problem.description
  let descriptionOnly = problem?.description || "";
  let examples = [];

  if (problem?.description) {
    const exampleSplit = problem.description.split("**Example");
    descriptionOnly = exampleSplit[0];
    if (exampleSplit.length > 1) {
      const rawExamples = exampleSplit.slice(1).map(exStr => "**Example" + exStr);
      examples = rawExamples.map((example) => {
        const labelMatch = example.match(/\*\*(Example\s*\d+.*?)\*\*/);
        const label = labelMatch ? labelMatch[1].trim() : "Example";
        const codeMatch = example.match(/```(?:java|python|javascript|cpp)?\n([\s\S]*?)\n```/);
        const code = codeMatch ? codeMatch[1].trim() : "";
        return { label, code };
      }).filter(ex => ex.code); // Only keep examples with code
    }
  }


  const convertStringToHtml = (inputString) => {
      if (!inputString) {
        return '';
      }
      // Order matters: bold/code first, then newlines
      let convertedString = inputString
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.*?)`/g, `<code class="${styles.inlineCode}">$1</code>`)
        .replace(/\n/g, '<br />');
      return convertedString;
    };

  const toggleHint = (index) => {
    setOpenHintIndex(openHintIndex === index ? null : index);
  };

  // --- Fallback for question number ---
  const questionNumberDisplay = problem?.question_number
    ? String(problem.question_number).padStart(2, '0')
    : problem?.difficulty === 'Easy'
    ? String(Math.floor(Math.random() * 5) + 5).padStart(2, '0') // Example: 05-09
    : problem?.difficulty === 'Medium'
    ? String(Math.floor(Math.random() * 10) + 10).padStart(2, '0') // Example: 10-19
    : String(Math.floor(Math.random() * 20) + 20).padStart(2, '0'); // Example: 20-39

  return (
    <div className={`${styles.problemViewContainer} ${darkMode ? styles.dark : styles.light}`}>
      <div className={styles.contentWrapper}>
        {/* Header Section */}
        <div className={`${styles.header} ${getDifficultyBorderClass(problem?.difficulty)}`}>
            <button onClick={handleBack} className={styles.backButton}>
                <BackIcon size={28} className={`${getDifficultyClass(problem?.difficulty)}`} />
            </button>
            <div className={`${styles.questionNumber} ${getDifficultyClass(problem?.difficulty)}`}>
                {questionNumberDisplay}
            </div>
            <div className={styles.titleContainer}>
              <h1 className={`${styles.problemName} ${getDifficultyClass(problem?.difficulty)}`}>{problem?.name || "Problem Name"}</h1>
              <p className={styles.categoryName}>{categoryId?.replace(/-/g, ' ') || "Category"}</p>
            </div>
        </div>

        {/* Description Section */}
        <div className={styles.descriptionSection}>
          <p
            className={styles.descriptionText}
            dangerouslySetInnerHTML={{
              __html: convertStringToHtml(descriptionOnly),
            }}
          />

          {/* Examples Section */}
          {examples.length > 0 && (
            <div className={`${styles.examplesContainer} ${getBgColorClass(problem?.difficulty)}`}>
              {examples.map((ex, i) => (
                <div key={i} className={styles.exampleItem}>
                  <div className={styles.exampleLabel}>{ex.label}</div>
                  <pre className={styles.exampleCode}>{ex.code}</pre>
                </div>
              ))}
            </div>
          )}
        </div>

       

        {/* Hints Accordion Section */}
        {problem?.hints && problem.hints.length > 0 && (
          <div className={styles.hintsSection}>
            {/* <h3 className={styles.hintsTitle}>Hints</h3> */}
            {problem.hints.map((hint, index) => (
              <div key={index} className={styles.accordionItem}>
                <button
                  className={styles.accordionHeader}
                  onClick={() => toggleHint(index)}
                >
                  <div className={styles.hintIconTitle}>
                    <HintIcon className={styles.hintIcon} />
                    <span>Hint {index + 1}</span>
                  </div>
                  {openHintIndex === index ? <CollapseIcon size={24} /> : <ExpandIcon size={24} />}
                </button>
                {openHintIndex === index && (
                  <div className={styles.accordionContent}>
                    <p>{hint}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProblemView;
