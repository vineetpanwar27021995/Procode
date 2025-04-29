const admin = require("firebase-admin");
const fs = require("fs");

let serviceAccount;

if (process.env.NODE_ENV === "production") {
  const serviceAccountPath = "/firebase-secrets/firebaseServiceAccount.json";
  serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} else {
  serviceAccount = require("./secrets/firebaseServiceAccount.json");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const db = admin.firestore();

module.exports = { admin, auth, db };