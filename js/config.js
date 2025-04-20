import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCGSkuvkutyGCVrqEOUNYsU75zxEZS-2RY",
    authDomain: "jsi09-3cf10.firebaseapp.com",
    projectId: "jsi09-3cf10",
    storageBucket: "jsi09-3cf10.firebasestorage.app",
    messagingSenderId: "143485670965",
    appId: "1:143485670965:web:41c0a37f87d39d51cec37c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);