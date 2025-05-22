import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import OpcOverview from "./components/OpcOverview";
import SkippedSpendLogger from "./components/SkippedSpendLogger";
import BudgetTracker from "./components/BudgetTracker";
import StreakTracker from "./components/StreakTracker";
import InvestmentSimulator from "./components/InvestmentSimulator";
import RecentActivity from "./components/RecentActivity";
import LoginForm from "./components/Auth/LoginForm";
import UserMenu from "./components/Auth/UserMenu";
import Confetti from 'react-confetti';
import { getStoredData, updateActivity } from "./services/localStorage";
import { 
  saveOpcToFirestore, 
  updateStreakInFirestore, 
  updateBudgetInFirestore,
  getUserDataFromFirestore, 
  getActivitiesFromFirestore,
  saveActivityToFirestore,
  checkAndUpdateStreak,
  safeFirestoreOperation 
} from "./services/firestoreHelpers";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { onAuthStateChange, getCurrentUser } from "./services/authService";

type ActivityItem = {
  id: string;
  description: string;
  date: string;
  opcEarned: number;
};

function App() {
  const [totalOpc, setTotalOpc] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [savedBudget, setSavedBudget] = useState(45);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Gamification states
  const [showConfetti, setShowConfetti] = useState(false);
  const [prevOpcTotal, setPrevOpcTotal] = useState(0);
  const [prevStreak, setPrevStreak] = useState(0);
  
  // Window dimensions for confetti
  const windowSize = useRef({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  });

  // Check authentication state on app load
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      if (user) {
        setIsAuthenticated(true);
        setCurrentUserId(user.uid);
        loadUserData(user.uid);
      } else {
        setIsAuthenticated(false);
        setCurrentUserId(null);
        // If not authenticated, load from localStorage as fallback
        loadLocalData();
        setIsLoading(false);
      }
    });
    
    // Check online status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load user data from Firestore
  const loadUserData = async (uid: string) => {
    setIsLoading(true);
    console.log("Loading user data from Firestore for UID:", uid);
    try {
      // Get user data from Firestore
      const userData = await safeFirestoreOperation(
        async () => {
          const data = await getUserDataFromFirestore(uid);
          console.log("Retrieved user data from Firestore:", data);
          return data || null;
        },
        null
      );
      
      if (userData) {
        // We successfully got data from Firestore
        console.log("Setting app state with Firestore data");
        const currentOpcTotal = userData.totalOpc || 0;
        
        // Store previous values for achievement comparison
        setPrevOpcTotal(currentOpcTotal);
        
        setTotalOpc(currentOpcTotal);
        
        // Check if we need to update the streak based on lastLogged date
        let streak = userData.currentStreak || 0;
        if (!isOffline) {
          try {
            // Only check streak on app load
            const updatedStreak = await checkAndUpdateStreak(uid, streak);
            console.log("Streak checked and updated:", updatedStreak);
            streak = updatedStreak;
            
            // Store previous streak for achievement comparison
            setPrevStreak(streak);
          } catch (error) {
            console.error("Error checking streak:", error);
          }
        }
        
        setCurrentStreak(streak);
        setSavedBudget(userData.savedBudget || 45);
        
        // Try to fetch activity items from Firestore
        const firestoreActivities = await safeFirestoreOperation(
          async () => {
            const activities = await getActivitiesFromFirestore(uid);
            console.log("Retrieved activities from Firestore:", activities);
            return activities;
          },
          []
        );
        
        // If we got activities from Firestore, use them
        if (firestoreActivities && firestoreActivities.length > 0) {
          console.log("Using activities from Firestore");
          setActivityItems(firestoreActivities);
        } else {
          // Otherwise, use localStorage for activity items
          console.log("No activities in Firestore, using localStorage");
          const storedData = getStoredData();
          setActivityItems(storedData.activityItems);
        }
      } else {
        // No user data found in Firestore, create initial user data
        console.log("No user data found in Firestore, initializing with localStorage data");
        const storedData = getStoredData();
        
        // Initialize user data in Firestore with localStorage data
        await safeFirestoreOperation(
          async () => {
            // Use the existing saveOpcToFirestore function which will create the document if needed
            await saveOpcToFirestore(uid, storedData.totalOpc);
            await updateStreakInFirestore(uid, storedData.currentStreak);
            await updateBudgetInFirestore(uid, storedData.savedBudget || 45);
            return true;
          },
          false
        );
        
        // Set state with localStorage data
        setTotalOpc(storedData.totalOpc);
        setCurrentStreak(storedData.currentStreak);
        setSavedBudget(storedData.savedBudget || 45);
        setActivityItems(storedData.activityItems);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };

  // Load data from localStorage
  const loadLocalData = () => {
    const storedData = getStoredData();
    setTotalOpc(storedData.totalOpc);
    setCurrentStreak(storedData.currentStreak);
    setSavedBudget(storedData.savedBudget || 45);
    setActivityItems(storedData.activityItems);
  };

  const handleLoginSuccess = () => {
    const user = getCurrentUser();
    if (user) {
      setIsAuthenticated(true);
      setCurrentUserId(user.uid);
      loadUserData(user.uid);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUserId(null);
    // Reset to default state or load from localStorage
    loadLocalData();
  };

  // Check for milestones and trigger celebrations
  const checkForMilestones = (newOpcTotal: number, newStreak: number) => {
    // Milestone thresholds for OPC totals
    const opcMilestones = [100, 500, 1000];
    // Milestone thresholds for streaks
    const streakMilestones = [3, 7, 14];
    
    // Check if any OPC milestone was crossed
    const crossedOpcMilestone = opcMilestones.some(milestone => 
      prevOpcTotal < milestone && newOpcTotal >= milestone
    );
    
    // Check if any streak milestone was crossed
    const crossedStreakMilestone = streakMilestones.some(milestone => 
      prevStreak < milestone && newStreak >= milestone
    );
    
    // If any milestone was crossed, show confetti
    if (crossedOpcMilestone || crossedStreakMilestone) {
      setShowConfetti(true);
      console.log("Milestone reached! Celebrating with confetti!");
      
      // Hide confetti after 5 seconds
      setTimeout(() => {
        setShowConfetti(false);
      }, 5000);
    }
    
    // Update previous values for next check
    setPrevOpcTotal(newOpcTotal);
    setPrevStreak(newStreak);
  };

  const handleAddOpc = async (amount: number, description: string) => {
    const newTotal = totalOpc + amount;
    setTotalOpc(newTotal);
    
    const now = new Date();
    const today = now.toISOString();
    
    const newActivity = {
      id: Date.now().toString(),
      description,
      date: now.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      opcEarned: amount
    };

    const updatedActivities = [newActivity, ...activityItems].slice(0, 10);
    setActivityItems(updatedActivities);
    
    // Check for milestones with the new OPC total
    checkForMilestones(newTotal, currentStreak);
    
    // Always update localStorage as backup
    updateActivity(newTotal, currentStreak, savedBudget, updatedActivities);
    
    // If authenticated and online, save to Firestore
    if (currentUserId && !isOffline) {
      // Save OPC total to Firestore
      await safeFirestoreOperation(
        () => saveOpcToFirestore(currentUserId, newTotal),
        false
      );
      
      // Save activity to Firestore
      await safeFirestoreOperation(
        () => saveActivityToFirestore(currentUserId, newActivity),
        false
      );
      
      // Update lastLogged date whenever user logs activity
      await safeFirestoreOperation(
        async () => {
          await updateDoc(doc(db, "users", currentUserId), {
            lastLogged: today,
            updatedAt: today
          });
          console.log("Last logged date updated:", today);
          return true;
        },
        false
      );
    }
  };

  const handleUpdateStreak = async (isUnderBudget: boolean) => {
    let newStreak;
    
    if (isUnderBudget) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 0;
    }
    
    setCurrentStreak(newStreak);
    
    // Check for streak milestones
    checkForMilestones(totalOpc, newStreak);
    
    // Always update localStorage
    updateActivity(totalOpc, newStreak, savedBudget, activityItems);
    
    // Update streak in Firestore if authenticated and online
    if (currentUserId && !isOffline) {
      await safeFirestoreOperation(
        () => updateStreakInFirestore(currentUserId, newStreak),
        false
      );
    }
  };

  const handleUpdateBudget = async (newBudget: number) => {
    setSavedBudget(newBudget);
    
    // Always update localStorage
    updateActivity(totalOpc, currentStreak, newBudget, activityItems);
    
    // Update budget in Firestore if authenticated and online
    if (currentUserId && !isOffline) {
      await safeFirestoreOperation(
        () => updateBudgetInFirestore(currentUserId, newBudget),
        false
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <p>Loading your data...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="container">
      {/* Confetti celebration for achievements */}
      {showConfetti && (
        <Confetti
          width={windowSize.current.width}
          height={windowSize.current.height}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
          colors={['#FFC107', '#4CAF50', '#2196F3', '#F44336', '#9C27B0']}
        />
      )}
      
      <Header />
      <UserMenu onLogout={handleLogout} />
      {isOffline && (
        <div className="offline-warning">
          <p>You're currently offline. Your data will be saved locally and synced when you reconnect.</p>
        </div>
      )}
      <OpcOverview totalOpc={totalOpc} currentStreak={currentStreak} />
      <SkippedSpendLogger onAddOpc={handleAddOpc} />
      <BudgetTracker 
        onAddOpc={handleAddOpc} 
        onUpdateStreak={handleUpdateStreak}
        savedBudget={savedBudget}
        onUpdateBudget={handleUpdateBudget}
      />
      <StreakTracker currentStreak={currentStreak} />
      <InvestmentSimulator totalOpc={totalOpc} />
      <RecentActivity activityItems={activityItems} />
      <footer className="footer">
        <p>Prizefight - Smart spending simulator</p>
      </footer>
    </div>
  );
}

export default App;
