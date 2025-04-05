const admin = require("firebase-admin");
const serviceAccount = require("./firebaseServiceAccount.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<your-project-id>.firebaseio.com", // optional
});

const auth = admin.auth();
const db = admin.firestore();

module.exports = { auth, db };