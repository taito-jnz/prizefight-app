// src/firestoreHelpers.js
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit, Timestamp, updateDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

// Save complete user data to Firestore
export async function saveUserDataToFirestore(userId, userData) {
  try {
    await setDoc(doc(db, "users", userId), {
      ...userData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("User data saved to Firestore!");
    return true;
  } catch (error) {
    console.error("Error writing user data to Firestore:", error);
    return false;
  }
}

// Save OPC total to Firestore (for backward compatibility)
export async function saveOpcToFirestore(userId, opcTotal) {
  try {
    await updateDoc(doc(db, "users", userId), {
      totalOpc: opcTotal,
      updatedAt: new Date().toISOString()
    });
    console.log("OPC total saved to Firestore!");
    return true;
  } catch (error) {
    // If the document doesn't exist yet, create it
    if (error.code === 'not-found') {
      try {
        await setDoc(doc(db, "users", userId), {
          totalOpc: opcTotal,
          updatedAt: new Date().toISOString()
        });
        console.log("New user document created in Firestore!");
        return true;
      } catch (createError) {
        console.error("Error creating new user document:", createError);
        return false;
      }
    } else {
      console.error("Error writing to Firestore:", error);
      return false;
    }
  }
}

// Update streak in Firestore with lastLogged date
export async function updateStreakInFirestore(userId, streak, lastLogged = null) {
  try {
    const updateData = {
      currentStreak: streak,
      updatedAt: new Date().toISOString()
    };
    
    // If lastLogged is provided, update it too
    if (lastLogged) {
      updateData.lastLogged = lastLogged;
    }
    
    await updateDoc(doc(db, "users", userId), updateData);
    console.log("Streak updated in Firestore with lastLogged:", lastLogged);
    return true;
  } catch (error) {
    console.error("Error updating streak in Firestore:", error);
    return false;
  }
}

// Check streak based on lastLogged date
export async function checkAndUpdateStreak(userId, currentStreak) {
  try {
    const userData = await getUserDataFromFirestore(userId);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    let newStreak = currentStreak;
    let lastLogged = null;
    
    if (userData && userData.lastLogged) {
      // Convert lastLogged string to Date object
      const lastLoggedDate = new Date(userData.lastLogged);
      lastLoggedDate.setHours(0, 0, 0, 0); // Normalize to start of day
      
      // Calculate days between
      const timeDiff = today.getTime() - lastLoggedDate.getTime();
      const daysDiff = Math.floor(timeDiff / (1000 * 3600 * 24));
      
      console.log(`Days since last activity: ${daysDiff}`);
      
      if (daysDiff === 0) {
        // Same day, no streak change
        console.log("Same day activity, no streak change");
      } else if (daysDiff === 1) {
        // Next day, continue streak
        console.log("Next day activity, continuing streak");
        newStreak = currentStreak;
      } else {
        // 2+ days, reset streak
        console.log("2+ days since last activity, resetting streak");
        newStreak = 0;
      }
    }
    
    // Set lastLogged to today
    lastLogged = today.toISOString();
    
    // Update streak and lastLogged in Firestore
    await updateStreakInFirestore(userId, newStreak, lastLogged);
    
    return newStreak;
  } catch (error) {
    console.error("Error checking streak:", error);
    return currentStreak; // Return unchanged on error
  }
}

// Update budget in Firestore
export async function updateBudgetInFirestore(userId, budget) {
  try {
    await updateDoc(doc(db, "users", userId), {
      savedBudget: budget,
      updatedAt: new Date().toISOString()
    });
    console.log("Budget updated in Firestore!");
    return true;
  } catch (error) {
    console.error("Error updating budget in Firestore:", error);
    return false;
  }
}

// Get OPC total from Firestore
export async function getOpcFromFirestore(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data().totalOpc || 0;
    } else {
      console.log("No OPC data found for this user");
      return 0;
    }
  } catch (error) {
    console.error("Error getting OPC data from Firestore:", error);
    return 0;
  }
}

// Fetch user data from Firestore
export async function getUserDataFromFirestore(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      console.log("No user data found");
      return null;
    }
  } catch (error) {
    console.error("Error getting user data from Firestore:", error);
    return null;
  }
}

// Save activity item to Firestore
export async function saveActivityToFirestore(userId, activityItem) {
  try {
    const activityRef = collection(db, "users", userId, "activities");
    
    await setDoc(doc(activityRef, activityItem.id), {
      ...activityItem,
      timestamp: Timestamp.now()
    });
    
    console.log("Activity saved to Firestore!");
    return true;
  } catch (error) {
    console.error("Error saving activity to Firestore:", error);
    return false;
  }
}

// Get activity items from Firestore
export async function getActivitiesFromFirestore(userId, limitCount = 10) {
  try {
    const activitiesRef = collection(db, "users", userId, "activities");
    const q = query(activitiesRef, orderBy("timestamp", "desc"), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        description: data.description,
        date: data.date,
        opcEarned: data.opcEarned
      });
    });
    
    return activities;
  } catch (error) {
    console.error("Error getting activities from Firestore:", error);
    return [];
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