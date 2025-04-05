const admin = require("firebase-admin");
const fs = require("fs");

let serviceAccount;

if (process.env.NODE_ENV === "production") {
  const serviceAccountPath = "/firebase-secrets/firebaseServiceAccount.json"; // ✅ FIXED
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} else {
  serviceAccount = require("./secrets/firebaseServiceAccount.json"); // local dev
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});