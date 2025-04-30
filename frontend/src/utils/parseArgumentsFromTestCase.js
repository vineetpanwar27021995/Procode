export const parseArgumentsFromTestCase = (testCase) => {
  if (!testCase) return "";

  const lines = testCase
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const args = [];

  for (const line of lines) {
    const equalIndex = line.indexOf("=");

    if (equalIndex === -1) continue;

    const value = line.slice(equalIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      args.push(value);
    } else if (value.startsWith("[") && value.endsWith("]")) {
      args.push(value);
    } else {
      args.push(value);
    }
  }

  return args.join(", ");
};