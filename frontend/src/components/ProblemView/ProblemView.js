import React from "react";
import bgImage from "../../assets/ProcodeBackground.png";
import { useNavigate } from "react-router-dom";
import useWindowSize from 'react-use/lib/useWindowSize';

const ProblemView = ({ problem, categoryId }) => {
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

  const descriptionOnly = problem.description.split("**Example")[0];

  const rawExamples =
    problem.description.match(/\*\*Example[\s\S]*?```java\n[\s\S]*?\n```/g) || [];

  const examples = rawExamples.map((example) => {
    const label = example.match(/\*\*Example[\s\S]*?\*\*/)?.[0]?.replace(/\*\*/g, "") || "";
    const code = example.match(/```java\n([\s\S]*?)```/)?.[1] || "";
    return { label, code };
  });

  return (
    <div
      className="p-4 space-y-4 h-full bg-cover bg-center bg-no-repeat rounded-xl text-white"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundBlendMode: "overlay",
      }}
    >
      {/* {!isMobile && <button
        onClick={handleBack}
        className="btn btn-outline btn-sm text-[#22C55E] border-[#22C55E] hover:bg-[#22C55E] hover:text-white rounded-full px-4 gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M15 6l-6 6 6 6" />
        </svg>
        Back
      </button>
} */}
      <div className="space-y-4 h-full rounded-xl">
        <div className="flex items-center justify-between">
          <div className="w-full border border-green-500 rounded-xl p-2 flex items-center justify-between bg-opacity-30">
              <svg
                className="text-[#22C55E] hover:text-white"
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
            <div className="text-3xl font-bold text-green-500 pl-2">
              {problem.difficulty === "Easy"
                ? "10"
                : problem.difficulty === "Medium"
                ? "20"
                : "30"}
            </div>
            <div className="flex-1 ml-4">
              <h2 className="text-white font-semibold">{problem.name}</h2>
              <p className="text-gray-400 text-sm">{categoryId}</p>
            </div>
          </div>

        </div>

        <div className="p-2">
          <p
            className="text-white text-base font-medium"
            dangerouslySetInnerHTML={{
              __html: descriptionOnly,
            }}
          />

          {examples.length > 0 && (
            <div className="mt-4 bg-black bg-opacity-40 text-white rounded-lg p-4 text-sm font-mono space-y-4">
              {examples.map((ex, i) => (
                <div key={i}>
                  <div className="text-gray-300 mb-1 font-semibold">{ex.label}</div>
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
