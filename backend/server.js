// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGINS = [
    "http://localhost:3000", // Local frontend
    "https://procode-silk.vercel.app", // Vercel frontend
];
// Enable CORS
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Middleware
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 Hello from ProCode on GCP! Hope you are doing great... Just checking if GCP cloud run is working fine ");
});

// Sample API route
app.get("/api/test", (req, res) => {
  res.json({
    message: "🎉 Hello from ProCode Backend!",
    status: "success",
    time: new Date().toISOString(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend server listening on port ${PORT}`);
});