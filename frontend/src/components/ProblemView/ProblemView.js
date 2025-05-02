import React from "react";
import { useNavigate } from "react-router-dom";
import useWindowSize from 'react-use/lib/useWindowSize';
import {getDifficultyBorderClass, getDifficultyClass, getBgColorClass} from "../../utils/UIHelper";
import {useThemeStore} from '../../stores/themeStore'

const ProblemView = ({ problem, categoryId }) => {
  const darkMode = useThemeStore((state) => state.darkMode);

const navigate = useNavigate();
const { width } = useWindowSize();
const isMobile = width < 768;

const handleBack = () => {
  if (window.history.length > 2) {
    navigate(-1); // go back
  } else {
    navigate("/"); // fallback
  }
};
console.log(`darkMode`, darkMode);
  const descriptionOnly = problem.description.split("**Example")[0];

  const rawExamples =
    problem.description.match(/\*\*Example[\s\S]*?```java\n[\s\S]*?\n```/g) || [];

  const examples = rawExamples.map((example) => {
    const label = example.match(/\*\*Example[\s\S]*?\*\*/)?.[0]?.replace(/\*\*/g, "") || "";
    const code = example.match(/```java\n([\s\S]*?)```/)?.[1] || "";
    return { label, code };
  });

  console.log('vineet problem', problem);

  return (
    <div
      className={`space-y-4 h-full bg-cover bg-center bg-no-repeat rounded-xl ${darkMode ? 'text-white' : 'text-black'}`}
    >
      <div className="space-y-4 h-full rounded-xl">
        <div className="flex items-center justify-between">
          <div className={`w-full border rounded-xl p-2 flex items-center justify-between bg-opacity-30 ${getDifficultyBorderClass(problem.difficulty)}`}>
              <svg
                className={`text-3xl font-bold pl-2 hover:text-white ${getDifficultyClass(problem.difficulty)}`}
                onClick={handleBack}
                xmlns="http://www.w3.org/2000/svg"
                width="30"
                height="50"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 6l-6 6 6 6" />
              </svg>
            <div className={`text-3xl font-bold pl-2 ${getDifficultyClass(problem.difficulty)}`}
            >
              {problem.question_number ? problem.question_number : problem.difficulty === 'Easy'
    ? Math.floor(Math.random() * 5) + 5      
    : problem.difficulty === 'Medium'
    ? Math.floor(Math.random() * 10) + 10    
    : Math.floor(Math.random() * 20) + 20} 
    
            </div>
            <div className="flex-1 ml-4">
              <h2 className={`text-white font-semibold ${getDifficultyClass(problem.difficulty)}`}>{problem.name}</h2>
              <p className={`text-gray-400 text-sm `}>{categoryId}</p>
            </div>
          </div>

        </div>

        <div className={`p-2`}>
          <p
            className={`${darkMode ? 'text-white' : 'text-black'} text-base font-medium`}
            dangerouslySetInnerHTML={{
              __html: descriptionOnly,
            }}
          />

          {examples.length > 0 && (
            <div className={`mt-4 bg-black bg-opacity-40 text-white rounded-lg p-4 text-sm font-mono space-y-4 ${getBgColorClass(problem.difficulty)}`}>
              {examples.map((ex, i) => (
                <div key={i}>
                  <div className={`text-white mb-1 font-semibold`}>{ex.label}</div>
                  <pre className="whitespace-pre-wrap">{ex.code}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProblemView;
