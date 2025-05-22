// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "GOOGLE_API_KEY_FB",
  authDomain: "prizefight-98651.firebaseapp.com",
  projectId: "prizefight-98651",
  storageBucket: "prizefight-98651.firebasestorage.app",
  messagingSenderId: "36382136940",
  appId: "1:36382136940:web:1a5067206bdeb291a25649",
  measurementId: "G-CC8NLWZVMZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Initialize Analytics (in browser environments only)
let analytics = null;
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn("Analytics could not be initialized:", error);
  }
}

export { analytics };