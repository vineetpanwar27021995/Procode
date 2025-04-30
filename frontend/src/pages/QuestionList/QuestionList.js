import { Link } from "react-router-dom";

const questions = [
  { id: "palindrome", title: "Check if a string is a palindrome" },
  { id: "twosum", title: "Two Sum Problem" },
  { id: "duplicates", title: "Find Duplicates in an Array" },
];

const QuestionList = () => {
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">🧠 Coding Problems</h1>
      {questions.map((q) => (
        <Link
          key={q.id}
          to={`/session/${q.id}`}
          className="block p-4 bg-base-100 shadow rounded hover:bg-base-200"
        >
          {q.title}
        </Link>
      ))}
    </div>
  );
};

export default QuestionList;
