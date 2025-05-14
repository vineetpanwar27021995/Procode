export const baseURL =
  process.env.NODE_ENV === "production"
    ? "https://your-cloud-run-url.com"
    : "http://localhost:8082";