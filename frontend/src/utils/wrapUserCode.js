import { parseArgumentsFromTestCase } from "./parseArgumentsFromTestCase";

export const wrapUserCode = (userCode, language, functionName, testCases = []) => {
    if (!functionName) return userCode;
  
    const args = parseArgumentsFromTestCase(testCases[0]);
  
    if (language === "javascript") {
      const runner = `
  const sol = new Solution();
  console.log(sol.${functionName}(${args}));
      `.trim();
      return userCode + "\n\n" + runner;
    }
  
    if (language === "python") {
      const runner = `
  if __name__ == "__main__":
      sol = Solution()
      print(sol.${functionName}(${args}))
      `.trim();
      return userCode + "\n\n" + runner;
    }
  
    if (language === "cpp") {
      const runner = `
  #include <iostream>
  using namespace std;
  
  int main() {
      Solution sol;
      cout << sol.${functionName}(${args});
      return 0;
  }
      `.trim();
      return userCode + "\n\n" + runner;
    }
  
    return userCode;
  };