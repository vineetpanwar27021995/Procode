import React from "react";
import bgImage from "../../assets/ProcodeBackground.png";

const ProblemView = ({ problem }) => {
  if (!problem || !problem.description) {
    return <div className="text-white p-4">Loading question...</div>;
  }

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
      <div className="space-y-4 h-full rounded-xl">
        <div className="border border-green-500 rounded-xl p-2 flex items-center justify-between bg-opacity-30">
          <div className="text-3xl font-bold text-green-500 pl-2">
            {problem.difficulty === "Easy"
              ? "10"
              : problem.difficulty === "Medium"
              ? "20"
              : "30"}
          </div>
          <div className="flex-1 ml-4">
            <h2 className="text-white font-semibold">{problem.name}</h2>
            <p className="text-gray-400 text-sm">{problem.tag}</p>
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
