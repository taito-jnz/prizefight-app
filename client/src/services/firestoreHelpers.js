// src/firestoreHelpers.js
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Save OPC total to Firestore
export async function saveOpcToFirestore(userId, opcTotal) {
  try {
    await setDoc(doc(db, "users", userId), {
      opcTotal: opcTotal,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("OPC total saved to Firestore!");
    return true;
  } catch (error) {
    console.error("Error writing to Firestore:", error);
    return false;
  }
}

// Get OPC total from Firestore
export async function getOpcFromFirestore(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().opcTotal || 0;
    } else {
      console.log("No OPC data found for this user");
      return 0;
    }
  } catch (error) {
    console.error("Error getting OPC data from Firestore:", error);
    return 0;
  }
}

// Add a fallback mechanism to handle connection issues
export async function safeFirestoreOperation(operation, fallbackValue) {
  try {
    return await operation();
  } catch (error) {
    console.warn("Firestore operation failed, using fallback:", error);
    return fallbackValue;
  }
}