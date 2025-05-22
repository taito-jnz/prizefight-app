import { useState, useEffect } from "react";
import Header from "./components/Header";
import OpcOverview from "./components/OpcOverview";
import SkippedSpendLogger from "./components/SkippedSpendLogger";
import BudgetTracker from "./components/BudgetTracker";
import StreakTracker from "./components/StreakTracker";
import InvestmentSimulator from "./components/InvestmentSimulator";
import RecentActivity from "./components/RecentActivity";
import { 
  getUserData, 
  updateUserStats, 
  addActivity, 
  getActivityItems 
} from "./services/firebaseService";

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

  useEffect(() => {
    // Load data from Firestore
    const loadData = async () => {
      try {
        // Get user data
        const userData = await getUserData();
        setTotalOpc(userData.totalOpc);
        setCurrentStreak(userData.currentStreak);
        setSavedBudget(userData.savedBudget || 45);
        
        // Get activity items
        const activities = await getActivityItems();
        setActivityItems(activities);
      } catch (error) {
        console.error("Error loading data from Firestore:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleAddOpc = async (amount: number, description: string) => {
    const newTotal = totalOpc + amount;
    setTotalOpc(newTotal);
    
    const newActivity = {
      description,
      date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      opcEarned: amount
    };

    // Add to Firestore
    const addedActivity = await addActivity(newActivity);
    
    if (addedActivity) {
      const updatedActivities = [addedActivity, ...activityItems].slice(0, 10);
      setActivityItems(updatedActivities);
      
      // Update user stats in Firestore
      await updateUserStats(newTotal, currentStreak, savedBudget);
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
    
    // Update user stats in Firestore
    await updateUserStats(totalOpc, newStreak, savedBudget);
  };

  const handleUpdateBudget = async (newBudget: number) => {
    setSavedBudget(newBudget);
    
    // Update user stats in Firestore
    await updateUserStats(totalOpc, currentStreak, newBudget);
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
