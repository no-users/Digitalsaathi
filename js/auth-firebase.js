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

// Firestore rules me data padhne ke liye login zaroori hai. Isliye har page pehle
// auth ready hone ka wait kare (warna 'permission-denied' aata hai aur purana cache dikhta hai).
window.ccAuthReady = new Promise(function (resolve) {
    var off = window.auth.onAuthStateChanged(function (u) { try { off(); } catch (e) {} resolve(u || null); });
});

// Firebase error ko aasan Hindi me samjhane ke liye
window.ccFbHint = function (err) {
    var c = (err && (err.code || err.message)) || '';
    if (/permission-denied/.test(c)) return 'Firestore Rules is data ko padhne nahi de rahe (permission-denied). docs/firestore-admin-rules.txt ke rules Firebase Console me publish karein aur admins collection me apna email jodein.';
    if (/unauthenticated/.test(c)) return 'Login nahi hai. Dobara login karein.';
    if (/unavailable|network|offline/.test(c)) return 'Internet ya Firebase se connection nahi ban pa raha.';
    return c || 'Unknown error';
};

