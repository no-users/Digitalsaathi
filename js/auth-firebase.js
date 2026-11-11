// ===========================================================
// CLICK & CONNECT — Shared Firebase Init
// Loaded on every page AFTER firebase compat scripts.
// ===========================================================
const firebaseConfig = {
    apiKey: "AIzaSyBWyMJvt0OpejwkFEstI_NQToHmMBGwkbE",
    authDomain: "agency-136b6.firebaseapp.com",
    databaseURL: "https://agency-136b6-default-rtdb.firebaseio.com",
    projectId: "agency-136b6",
    storageBucket: "agency-136b6.firebasestorage.app",
    messagingSenderId: "503663950718",
    appId: "1:503663950718:web:8a30b18039c279ffac112f",
    measurementId: "G-1K7QHDXKQ2"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

window.db = firebase.firestore();
window.auth = firebase.auth();