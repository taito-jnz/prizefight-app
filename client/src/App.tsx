import { useState, useEffect } from "react";
import Header from "./components/Header";
import OpcOverview from "./components/OpcOverview";
import SkippedSpendLogger from "./components/SkippedSpendLogger";
import BudgetTracker from "./components/BudgetTracker";
import StreakTracker from "./components/StreakTracker";
import InvestmentSimulator from "./components/InvestmentSimulator";
import RecentActivity from "./components/RecentActivity";
import { getStoredData, updateActivity } from "./services/localStorage";

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

  useEffect(() => {
    // Load data from localStorage
    const storedData = getStoredData();
    setTotalOpc(storedData.totalOpc);
    setCurrentStreak(storedData.currentStreak);
    setSavedBudget(storedData.savedBudget || 45);
    setActivityItems(storedData.activityItems);
  }, []);

  const handleAddOpc = (amount: number, description: string) => {
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
    
    // Update localStorage
    updateActivity(newTotal, currentStreak, savedBudget, updatedActivities);
  };

  const handleUpdateStreak = (isUnderBudget: boolean) => {
    let newStreak;
    
    if (isUnderBudget) {
      newStreak = currentStreak + 1;
    } else {
      newStreak = 0;
    }
    
    setCurrentStreak(newStreak);
    updateActivity(totalOpc, newStreak, savedBudget, activityItems);
  };

  const handleUpdateBudget = (newBudget: number) => {
    setSavedBudget(newBudget);
    updateActivity(totalOpc, currentStreak, newBudget, activityItems);
  };

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
