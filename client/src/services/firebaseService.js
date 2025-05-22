import { db } from '../firebaseConfig';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  updateDoc,
  Timestamp
} from 'firebase/firestore';

// Collection references
const USER_DATA_COLLECTION = 'userData';
const ACTIVITY_COLLECTION = 'activities';

// Get or create user document
export const getUserData = async (userId = 'default-user') => {
  try {
    const userDocRef = doc(db, USER_DATA_COLLECTION, userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return userDocSnap.data();
    } else {
      // Create default user data if it doesn't exist
      const defaultData = {
        totalOpc: 0,
        currentStreak: 0,
        savedBudget: 45,
      };
      
      await setDoc(userDocRef, defaultData);
      return defaultData;
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    // Fallback to defaults if there's an error
    return {
      totalOpc: 0,
      currentStreak: 0,
      savedBudget: 45,
    };
  }
};

// Update user data
export const updateUserData = async (userData, userId = 'default-user') => {
  try {
    const userDocRef = doc(db, USER_DATA_COLLECTION, userId);
    await setDoc(userDocRef, userData, { merge: true });
    return true;
  } catch (error) {
    console.error('Error updating user data:', error);
    return false;
  }
};

// Get activity items
export const getActivityItems = async (userId = 'default-user', limitCount = 10) => {
  try {
    const activitiesRef = collection(db, USER_DATA_COLLECTION, userId, ACTIVITY_COLLECTION);
    const q = query(activitiesRef, orderBy('timestamp', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const activities = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      activities.push({
        id: doc.id,
        description: data.description,
        date: data.date,
        opcEarned: data.opcEarned,
        timestamp: data.timestamp
      });
    });
    
    return activities;
  } catch (error) {
    console.error('Error getting activity items:', error);
    return [];
  }
};

// Add activity item
export const addActivity = async (activityData, userId = 'default-user') => {
  try {
    const activitiesRef = collection(db, USER_DATA_COLLECTION, userId, ACTIVITY_COLLECTION);
    
    const activityWithTimestamp = {
      ...activityData,
      timestamp: Timestamp.now()
    };
    
    const docRef = await addDoc(activitiesRef, activityWithTimestamp);
    
    return {
      id: docRef.id,
      ...activityData
    };
  } catch (error) {
    console.error('Error adding activity:', error);
    return null;
  }
};

// Update OPC total, streak, and budget in a single call
export const updateUserStats = async (totalOpc, currentStreak, savedBudget, userId = 'default-user') => {
  try {
    const userDocRef = doc(db, USER_DATA_COLLECTION, userId);
    await updateDoc(userDocRef, {
      totalOpc,
      currentStreak,
      savedBudget
    });
    return true;
  } catch (error) {
    console.error('Error updating user stats:', error);
    return false;
  }
};