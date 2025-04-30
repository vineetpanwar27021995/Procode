export const extractFunctionName = (language, code) => {
    try {
      if (language === "javascript") {
        const match = code.match(/hasDuplicate|\w+\(/);
        if (match) {
          return match[0].replace("(", "").trim();
        }
      }
      if (language === "python") {
        const match = code.match(/def\s+(\w+)\(/);
        if (match) {
          return match[1];
        }
      }
      if (language === "cpp") {
        const match = code.match(/\w+\s+(\w+)\(/);
        if (match) {
          return match[1];
        }
      }
    } catch (err) {
      console.error("Failed to extract function name:", err);
    }
    return "unknownFunction";
  };