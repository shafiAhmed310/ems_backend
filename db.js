const firebase = require("firebase");
const Config = require('./config')
firebase.initializeApp(Config.firebaseConfig);
const db = firebase.firestore();


module.exports = {db};