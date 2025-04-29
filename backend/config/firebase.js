const admin = require('firebase-admin');
const serviceAccount = require('../secrets/firebaseServiceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
});

const auth = admin.auth();
const db = admin.firestore();

module.exports = { admin, auth, db };