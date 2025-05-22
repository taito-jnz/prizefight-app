import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { db } from "../firebaseConfig";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Get Firebase Auth instance
const auth = getAuth();

// Sign up a new user
export const signUpUser = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Create a user document in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: userCredential.user.email,
      totalOpc: 0,
      currentStreak: 0,
      savedBudget: 45,
      createdAt: new Date().toISOString()
    });
    
    return userCredential.user;
  } catch (error) {
    console.error("Error signing up:", error);
    throw error;
  }
};

// Sign in an existing user
export const signInUser = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error("Error signing in:", error);
    throw error;
  }
};

// Sign out the current user
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return true;
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get the current user
export const getCurrentUser = () => {
  return auth.currentUser;
};

// Listen for auth state changes
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Get user data from Firestore
export const getUserData = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      console.log("No user data found!");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    throw error;
  }
};