// ✅ Firebase configuration and setup
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 🔑 Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD_Ggk5Un64z6IoLPI2AORqVSZKFZVstv0",
  authDomain: "breadfruit-tracker.firebaseapp.com",
  projectId: "breadfruit-tracker",
  storageBucket: "breadfruit-tracker.firebasestorage.app",
  messagingSenderId: "1002993131736",
  appId: "1:1002993131736:web:e68a73923da8a8a38537ad",
  measurementId: "G-8C2WXVVTBR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Exports
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
