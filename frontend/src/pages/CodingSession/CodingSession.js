import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MonacoEditor, AITile, ProblemView } from '../../components';
import Confetti from 'react-confetti';
import useWindowSize from 'react-use/lib/useWindowSize';
import { baseURL } from '../../utils/getBaseURL';
import { useAnamStore } from '../../stores/anamStore';


const CodingSession = () => {
  const { questionId, categoryId } = useParams();
  const [problem, setProblem] = useState(null);
  const [intuitionApproved, setIntuitionApproved] = useState(false);
  const [testPassed, setTestPassed] = useState(false);
  const { width, height } = useWindowSize();
  const isMobile = width < 768;
  const hasFetchedRef = useRef(false);
  const clearConversationHistory = useAnamStore((state) => state.clearConversationHistory);

  useEffect(() => {
    const fetchProblem = async () => {
      try {
        hasFetchedRef.current = true;
        const res = await fetch(`${baseURL}/api/problem-metadata`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ problemId: questionId, categoryId }),
        });
  
        const data = await res.json();
        setProblem(data.problem);
        clearConversationHistory();
      } catch (err) {
        console.error("❌ Failed to fetch problem:", err);
      }
    };
    if (questionId && categoryId && !hasFetchedRef.current) {
      fetchProblem();
    }
  }, [questionId, categoryId]);

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
          <div className="h-[60%] overflow-y-auto rounded-box bg-base-100 p-2">
            <ProblemView problem={problem} />
          </div>

          <div className="h-[40%] relative rounded-box bg-base-100">
            {!intuitionApproved ? (
              <div className="w-full h-full flex items-center justify-center text-center border border-[#22C55E] relative p-2">
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
                  categoryId={categoryId}
                />
              </>
            )}
          </div>
        </div>
      ) : (
        // 🔹 DESKTOP VIEW
        <div className="grid grid-cols-2 gap-4 h-full">
          <div className="flex flex-col h-full gap-2">
            { intuitionApproved ? (
              <>
                <div className="h-[100%] overflow-y-auto rounded-box bg-base-100">
                <ProblemView problem={problem} />
                </div>
              </>
            ) : (
              <>
                <div className="h-[60%] overflow-y-auto rounded-box bg-base-100">
                <ProblemView problem={problem} />
                </div>
                <div className="h-[40%] rounded-box p-4 shadow border border-[#22C55E]">
                  <AITile fullScreen setIntuitionApproved={setIntuitionApproved} intuitionApproved={intuitionApproved} problemMetadata={problem}/>
                </div>
              </>
            )
              
            }
           
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
              categoryId={categoryId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodingSession;
