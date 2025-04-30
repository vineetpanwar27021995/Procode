import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MonacoEditor, AITile, ProblemView } from '../../components';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { baseURL } from '../../utils/getBaseURL';

const CodingSession = () => {
  const { questionId } = useParams();
  const [problem, setProblem] = useState(null);
  const [intuitionApproved, setIntuitionApproved] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const { width, height } = useWindowSize();
  const isMobile = width < 768;

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const res = await fetch(`${baseURL}/api/problem-metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ problemId: questionId }),
        });
  
        const data = await res.json();
        setProblem(data.problem);
      } catch (err) {
        console.error("❌ Failed to fetch problem:", err);
      }
    };

    fetchProblem();
  }, [questionId]);

  const handleTestSuccess = () => {
    setTestPassed(true);
    setTimeout(() => setTestPassed(false), 4000);
  };

  if (!problem) {
    return <div className="text-white p-4">Loading question...</div>;
  }

  return (
    <div className="relative w-full h-screen bg-base-200 overflow-hidden p-4">
      {testPassed && <Confetti width={width} height={height} />}

      {isMobile ? (
        // 🔹 MOBILE VIEW
        <div className="flex flex-col h-full gap-4">
          <div className="h-[40%] overflow-y-auto rounded-box bg-base-100 p-2">
            <ProblemView problem={problem} />
          </div>

          <div className="h-[60%] relative rounded-box bg-base-100">
            {!intuitionApproved ? (
              <div className="w-full h-full flex items-center justify-center text-center">
                <AITile fullScreen setIntuitionApproved={setIntuitionApproved} intuitionApproved={intuitionApproved} problemMetadata={problem}/>
              </div>
            ) : (
              <>
                <MonacoEditor
                  isUnlocked
                  onSuccess={handleTestSuccess}
                  problemId={questionId}
                  customTestCases={problem.custom_test_cases || []}
                  starterCode={problem.starterCode?.javascript || ""}
                  problemMetadata={problem}
                />
                <div className="absolute bottom-4 right-4 z-50">
                  <AITile movable />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // 🔹 DESKTOP VIEW
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="flex flex-col h-full gap-2">
            <div className="h-[60%] overflow-y-auto rounded-box bg-base-100">
              <ProblemView problem={problem} />
            </div>
            <div className="h-[40%] rounded-box bg-white p-2 shadow">
              <AITile fullScreen setIntuitionApproved={setIntuitionApproved} intuitionApproved={intuitionApproved} problemMetadata={problem}/>
            </div>
          </div>

          <div className="relative h-full rounded-box">
            <MonacoEditor
              className="h-full"
              isUnlocked={intuitionApproved}
              onSuccess={handleTestSuccess}
              problemId={questionId}
              customTestCases={problem.custom_test_cases || []}
              starterCode={problem.starterCode?.javascript || ""}
              problemMetadata={problem}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingSession;
