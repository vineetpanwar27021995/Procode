import { parseArgumentsFromTestCase } from "./parseArgumentsFromTestCase";

export const wrapUserCode = (userCode, language, functionName, testCase) => {
  if (!functionName || !testCase) return userCode;

  const args = parseArgumentsFromTestCase(testCase);

  if (language === "javascript") {
    return `
${userCode}

const sol = new Solution();
console.log(sol.${functionName}(${args}));
    `.trim();
  }

  if (language === "python") {
    return `
${userCode}

if __name__ == "__main__":
    sol = Solution()
    print(sol.${functionName}(${args}))
    `.trim();
  }

  if (language === "cpp") {
    return `
#include <iostream>
using namespace std;

${userCode}

int main() {
    Solution sol;
    cout << sol.${functionName}(${args});
    return 0;
}
    `.trim();
  }

  return userCode;
};