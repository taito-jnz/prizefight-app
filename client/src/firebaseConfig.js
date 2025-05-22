// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getApps, getApp } from "firebase/app";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCzhM52OKKOhj2GRrYTBuBWBWZimdr5cMs",
  authDomain: "prizefight-98651.firebaseapp.com",
  projectId: "prizefight-98651",
  storageBucket: "prizefight-98651.firebasestorage.app",
  messagingSenderId: "36382136940",
  appId: "1:36382136940:web:1a5067206bdeb291a25649",
  measurementId: "G-CC8NLWZVMZ"
};

// Initialize Firebase only if it hasn't been initialized already
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);