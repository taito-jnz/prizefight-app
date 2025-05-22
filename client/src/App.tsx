import { useState, useEffect } from "react";
import Header from "./components/Header";
import OpcOverview from "./components/OpcOverview";
import SkippedSpendLogger from "./components/SkippedSpendLogger";
import BudgetTracker from "./components/BudgetTracker";
import StreakTracker from "./components/StreakTracker";
import InvestmentSimulator from "./components/InvestmentSimulator";
import RecentActivity from "./components/RecentActivity";
import LoginForm from "./components/Auth/LoginForm";
import UserMenu from "./components/Auth/UserMenu";
import { getStoredData, updateActivity } from "./services/localStorage";
import { 
  saveOpcToFirestore, 
  updateStreakInFirestore, 
  updateBudgetInFirestore,
  getUserDataFromFirestore, 
  getActivitiesFromFirestore,
  saveActivityToFirestore,
  safeFirestoreOperation 
} from "./services/firestoreHelpers";
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
    try {
      // Get user data from Firestore
      const userData = await safeFirestoreOperation(
        async () => {
          const data = await getUserDataFromFirestore(uid);
          return data || null;
        },
        null
      );
      
      if (userData) {
        // We successfully got data from Firestore
        setTotalOpc(userData.totalOpc || 0);
        setCurrentStreak(userData.currentStreak || 0);
        setSavedBudget(userData.savedBudget || 45);
        
        // Try to fetch activity items from Firestore
        const firestoreActivities = await safeFirestoreOperation(
          async () => {
            return await getActivitiesFromFirestore(uid);
          },
          []
        );
        
        // If we got activities from Firestore, use them
        if (firestoreActivities && firestoreActivities.length > 0) {
          setActivityItems(firestoreActivities);
        } else {
          // Otherwise, use localStorage for activity items
          const storedData = getStoredData();
          setActivityItems(storedData.activityItems);
        }
      } else {
        // No user data found in Firestore, use localStorage
        loadLocalData();
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

  const handleAddOpc = async (amount: number, description: string) => {
    const newTotal = totalOpc + amount;
    setTotalOpc(newTotal);
    
    const newActivity = {
      id: Date.now().toString(),
      description,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      opcEarned: amount
    };

    const updatedActivities = [newActivity, ...activityItems].slice(0, 10);
    setActivityItems(updatedActivities);
    
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
      <Header />
      <UserMenu onLogout={handleLogout} />
      {isOffline && (
        <div className="offline-warning">
          <p>You're currently offline. Your data will be saved locally and synced when you reconnect.</p>
        </div>
      )}
      <OpcOverview totalOpc={totalOpc} />
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
