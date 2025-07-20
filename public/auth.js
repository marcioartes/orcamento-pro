// auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCVvf8wKaZO8frn17e8vsoQQvB6ZX6wrCA",
  authDomain: "orcamentopro-5fab8.firebaseapp.com",
  projectId: "orcamentopro-5fab8",
  storageBucket: "orcamentopro-5fab8.firebasestorage.app",
  messagingSenderId: "798859547323",
  appId: "1:798859547323:web:9396a0e5893a0fe7470f9e",
  measurementId: "G-V694NR59H8"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export function onAuthStateChange(callback) {
  onAuthStateChanged(auth, (user) => {
    callback(user);
  });
}

export { auth, provider, signInWithPopup, signOut }