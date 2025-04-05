const express = require("express");
const router = express.Router();
const admin = require("../firebaseAdmin"); 
const { getAuth } = require("firebase-admin/auth");

const auth = getAuth();

// ✅ Middleware to verify Firebase ID Token
const verifyFirebaseIdToken = async (req, res, next) => {
  const idToken = req.headers.authorization?.split("Bearer ")[1];

  if (!idToken) return res.status(401).json({ error: "No token provided" });

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
};

// 📌 Signup with Email/Password
router.post("/signup", async (req, res) => {
  const { email, password, displayName } = req.body;

  try {
    const user = await auth.createUser({ email, password, displayName });
    res.status(201).json({ message: "User created", uid: user.uid });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📌 Custom Login with UID → generate Firebase Custom Token
router.post("/login", async (req, res) => {
  const { uid } = req.body;

  if (!uid) return res.status(400).json({ error: "UID is required" });

  try {
    const customToken = await auth.createCustomToken(uid);
    res.status(200).json({ token: customToken });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate custom token", details: err.message });
  }
});

// 📌 Forgot Password
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const link = await auth.generatePasswordResetLink(email);
    res.status(200).json({ message: "Password reset link sent", link });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 📌 Token Verification (Email/Password Login from frontend)
router.post("/verify-token", verifyFirebaseIdToken, async (req, res) => {
  res.status(200).json({ message: "Token verified", user: req.user });
});

// 📌 Google Login
router.post("/google", verifyFirebaseIdToken, (req, res) => {
  res.status(200).json({ message: "Google login verified", user: req.user });
});

// 📌 Facebook Login
router.post("/facebook", verifyFirebaseIdToken, (req, res) => {
  res.status(200).json({ message: "Facebook login verified", user: req.user });
});


module.exports = router;