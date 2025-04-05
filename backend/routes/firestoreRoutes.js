const express = require("express");
const router = express.Router();
const { db } = require("../firebaseAdmin");

// Create a document
router.post("/add-user-data", async (req, res) => {
  try {
    const { uid, data } = req.body;
    await db.collection("users").doc(uid).set(data);
    res.status(200).json({ message: "Data saved" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user data
router.get("/get-user/:uid", async (req, res) => {
  try {
    const doc = await db.collection("users").doc(req.params.uid).get();
    if (!doc.exists) return res.status(404).json({ error: "Not found" });
    res.json(doc.data());
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;