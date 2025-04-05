// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const firestoreRoutes = require("./routes/firestoreRoutes");
const analyzeRoute = require("./routes/analyzeIntutionRoutes");

const app = express();
const PORT = process.env.PORT || 8080;
// Middleware
app.use(express.json());

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

// DeepSeek API
app.use("/api/analyze", analyzeRoute);

// Authentication
app.use("/api/auth", authRoutes);

// DB
app.use("/api/db", firestoreRoutes);

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