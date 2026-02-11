// Firebase Config for Compat SDK
// No imports needed, 'firebase' is available globally from the script tag in HTML

var firebaseConfig = {
    apiKey: "AIzaSyC7J3p_kXTHSFD2o-pKtBPWTUF4GaZsHmw",
    authDomain: "bloge-1f76f.firebaseapp.com",
    projectId: "bloge-1f76f",
    storageBucket: "bloge-1f76f.firebasestorage.app",
    messagingSenderId: "928024422200",
    appId: "1:928024422200:web:12c222ef2a274c996143cd"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Initialize Firestore globally
window.db = firebase.firestore();
console.log("Firebase Initialized, DB is ready.");
