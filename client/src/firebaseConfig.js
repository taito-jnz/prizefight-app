// src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB99R6Muh0fwxk1zAp33gN5t7fFvNxp1_Y", // Using the API key directly
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