import { useState, useEffect } from "react";
import Header from "./components/Header";
import OpcOverview from "./components/OpcOverview";
import SkippedSpendLogger from "./components/SkippedSpendLogger";
import BudgetTracker from "./components/BudgetTracker";
import StreakTracker from "./components/StreakTracker";
import InvestmentSimulator from "./components/InvestmentSimulator";
import RecentActivity from "./components/RecentActivity";
import { getStoredData, updateActivity } from "./services/localStorage";
import { saveOpcToFirestore, getOpcFromFirestore, safeFirestoreOperation } from "./services/firestoreHelpers";

type ActivityItem = {
  id: string;
  description: string;
  date: string;
  opcEarned: number;
};

const DEFAULT_USER_ID = "default-user";

function App() {
  const [totalOpc, setTotalOpc] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [savedBudget, setSavedBudget] = useState(45);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Load data from Firestore with localStorage fallback
    const loadData = async () => {
      try {
        // First try to load from Firestore
        const opcTotal = await safeFirestoreOperation(
          () => getOpcFromFirestore(DEFAULT_USER_ID),
          -1 // Use -1 as indicator to try localStorage
        );
        
        // If Firestore operation succeeded (didn't return our fallback value)
        if (opcTotal !== -1) {
          // We successfully got data from Firestore
          setTotalOpc(opcTotal);
          
          // For now, other data still comes from localStorage
          const storedData = getStoredData();
          setCurrentStreak(storedData.currentStreak);
          setSavedBudget(storedData.savedBudget || 45);
          setActivityItems(storedData.activityItems);
        } else {
          // Firestore failed, use localStorage as fallback
          setIsOffline(true);
          const storedData = getStoredData();
          setTotalOpc(storedData.totalOpc);
          setCurrentStreak(storedData.currentStreak);
          setSavedBudget(storedData.savedBudget || 45);
          setActivityItems(storedData.activityItems);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        // On error, fall back to localStorage
        setIsOffline(true);
        const storedData = getStoredData();
        setTotalOpc(storedData.totalOpc);
        setCurrentStreak(storedData.currentStreak);
        setSavedBudget(storedData.savedBudget || 45);
        setActivityItems(storedData.activityItems);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
    
    // Check online status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
    
    // Update localStorage (always do this for backup)
    updateActivity(newTotal, currentStreak, savedBudget, updatedActivities);
    
    // Try to update Firestore if online
    if (!isOffline) {
      await safeFirestoreOperation(
        () => saveOpcToFirestore(DEFAULT_USER_ID, newTotal),
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
  };

  const handleUpdateBudget = async (newBudget: number) => {
    setSavedBudget(newBudget);
    
    // Always update localStorage
    updateActivity(totalOpc, currentStreak, newBudget, activityItems);
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

  return (
    <div className="container">
      <Header />
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
