import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import OpcOverview from "./components/OpcOverview";
import SkippedSpendLogger from "./components/SkippedSpendLogger";
import BudgetTracker from "./components/BudgetTracker";
import StreakTracker from "./components/StreakTracker";
import InvestmentSimulator from "./components/InvestmentSimulator";
import RecentActivity from "./components/RecentActivity";
import BankConnection from "./components/BankConnection";
import RecurringInvestmentSettings from "./components/RecurringInvestmentSettings";
import RealWorldInvestment from "./components/RealWorldInvestment";
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
import { 
  getInvestmentDataFromFirestore, 
  connectBankAccount, 
  updateInvestmentSettings, 
  processInvestment,
  getLocalInvestmentData,
  saveLocalInvestmentData
} from "./services/investmentService";

type ActivityItem = {
  id: string;
  description: string;
  date: string;
  opcEarned: number;
};

// Investment data interface
interface InvestmentData {
  isConnected: boolean;
  bankName?: string;
  accountId?: string;
  frequency: string;
  enabled: boolean;
  balance: number;
  investmentHistory?: Array<{
    amount: number;
    date: string;
    opcConverted: number;
  }>;
  nextScheduledDate?: string;
  lastInvestmentAmount?: number;
  lastInvestmentDate?: string;
}

function App() {
  const [totalOpc, setTotalOpc] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [savedBudget, setSavedBudget] = useState(45);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Investment states
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    isConnected: false,
    frequency: 'monthly',
    enabled: false,
    balance: 0
  });
  
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
      
      // Also load investment data
      const investData = await safeFirestoreOperation(
        async () => {
          const data = await getInvestmentDataFromFirestore(uid);
          console.log("Retrieved investment data from Firestore:", data);
          return data || null;
        },
        null
      );
      
      // If we have investment data in Firestore, use it
      if (investData) {
        console.log("Setting investment data from Firestore");
        setInvestmentData(investData);
      } else {
        // Otherwise use from local storage
        const localInvestData = getLocalInvestmentData();
        setInvestmentData(localInvestData);
      }
      
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
    
    // Also load investment data from localStorage
    const investData = getLocalInvestmentData();
    setInvestmentData(investData);
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
  
  // Handler for connecting a bank account
  const handleConnectBank = async (bankName: string, accountId: string) => {
    if (!currentUserId) return;
    
    try {
      const updatedData = await connectBankAccount(currentUserId, bankName, accountId);
      setInvestmentData(updatedData);
      
      // Trigger celebratory confetti
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
    } catch (error) {
      console.error("Error connecting bank account:", error);
    }
  };
  
  // Handler for updating investment settings
  const handleUpdateInvestmentSettings = async (frequency: string, enabled: boolean) => {
    if (!currentUserId) return;
    
    try {
      const updatedData = await updateInvestmentSettings(currentUserId, frequency, enabled);
      setInvestmentData(updatedData);
    } catch (error) {
      console.error("Error updating investment settings:", error);
    }
  };
  
  // Process investment based on OPC balance
  const processInvestmentIfNeeded = async () => {
    if (!currentUserId || !investmentData.isConnected || !investmentData.enabled) return;
    
    try {
      const result = await processInvestment(currentUserId, totalOpc);
      if (result) {
        setInvestmentData(prev => ({
          ...prev,
          balance: result.newBalance,
          lastInvestmentAmount: result.amount,
          lastInvestmentDate: result.date,
          nextScheduledDate: result.nextScheduledDate
        }));
      }
    } catch (error) {
      console.error("Error processing investment:", error);
    }
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
      
      // Check if we need to process an investment
      // Only do this if the user has connected a bank and enabled auto-invest
      if (investmentData.isConnected && investmentData.enabled) {
        await processInvestmentIfNeeded();
      }
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
      
      {/* Simple Banking Connection Section - Direct HTML */}
      <div className="card" style={{border: '2px solid #e6effd', marginBottom: '1.5rem'}}>
        <h2 style={{fontSize: '1.25rem', marginTop: 0, marginBottom: '1rem'}}>
          🏦 Connect Your Bank Account
        </h2>
        
        {investmentData.isConnected ? (
          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap'}}>
            <div style={{
              width: '12px', 
              height: '12px', 
              borderRadius: '50%', 
              backgroundColor: '#4caf50',
              display: 'inline-block'
            }}></div>
            <p style={{margin: '0.5rem 0'}}>
              Connected to <strong>{investmentData.bankName || 'Chase'}</strong>
            </p>
            <button 
              onClick={() => handleConnectBank('Chase', 'acct_' + Math.random().toString(36).substring(2, 10))}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #4361ee',
                color: '#4361ee',
                padding: '0.5rem 1rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                marginLeft: 'auto'
              }}
            >
              Change Bank
            </button>
          </div>
        ) : (
          <div style={{textAlign: 'center', margin: '1rem 0'}}>
            <p style={{marginBottom: '1rem'}}>
              Connect your bank to automate investments based on your OPC balance
            </p>
            <button 
              onClick={() => handleConnectBank('Chase', 'acct_' + Math.random().toString(36).substring(2, 10))}
              style={{
                backgroundColor: '#4361ee',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                maxWidth: '300px',
                margin: '0 auto',
                display: 'block'
              }}
            >
              Connect Bank Account
            </button>
          </div>
        )}

        {investmentData.isConnected && (
          <div style={{marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem'}}>
            <div style={{marginBottom: '1rem'}}>
              <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: '500'}}>
                Investment Frequency
              </label>
              <select 
                value={investmentData.frequency}
                onChange={(e) => handleUpdateInvestmentSettings(e.target.value, investmentData.enabled)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #ddd'
                }}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div style={{
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span>Auto-invest when OPCs convert to funds</span>
              <div 
                onClick={() => handleUpdateInvestmentSettings(investmentData.frequency, !investmentData.enabled)}
                style={{
                  width: '50px',
                  height: '24px',
                  backgroundColor: investmentData.enabled ? '#4caf50' : '#ccc',
                  borderRadius: '12px',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
              >
                <div style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: 'white',
                  borderRadius: '50%',
                  position: 'absolute',
                  top: '2px',
                  left: investmentData.enabled ? '28px' : '2px',
                  transition: 'left 0.3s'
                }}></div>
              </div>
            </div>
            
            <div style={{
              backgroundColor: '#f9f9f9',
              padding: '1rem',
              borderRadius: '0.5rem',
              fontSize: '0.9rem'
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                <span style={{color: '#666'}}>Next Investment:</span>
                <span style={{fontWeight: '600', color: '#4361ee'}}>
                  {investmentData.enabled 
                    ? `$${Math.floor(totalOpc / 100) * 25} on ${investmentData.nextScheduledDate ? new Date(investmentData.nextScheduledDate).toLocaleDateString() : 'Not scheduled'}` 
                    : 'Auto-invest disabled'}
                </span>
              </div>
              
              {investmentData.lastInvestmentAmount && (
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem'}}>
                  <span style={{color: '#666'}}>Last Investment:</span>
                  <span>
                    ${investmentData.lastInvestmentAmount.toFixed(2)} on {investmentData.lastInvestmentDate ? new Date(investmentData.lastInvestmentDate).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              )}
              
              <div style={{display: 'flex', justifyContent: 'space-between'}}>
                <span style={{color: '#666'}}>OPC Conversion Rate:</span>
                <span>100 OPCs = $25 invested</span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Investment Balance Card */}
      {investmentData.isConnected && (
        <div className="card" style={{border: '2px solid #e6f7f0', marginBottom: '1.5rem'}}>
          <h2 style={{fontSize: '1.25rem', marginTop: 0, marginBottom: '1rem'}}>
            💹 Real-World Investment Balance
          </h2>
          
          <div style={{textAlign: 'center', marginBottom: '1.5rem'}}>
            <div style={{marginBottom: '1rem'}}>
              <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1rem', color: '#666'}}>
                Current Balance
              </h3>
              <div style={{fontSize: '2rem', fontWeight: 'bold', color: '#4caf50'}}>
                ${investmentData.balance.toFixed(2)}
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-around',
              maxWidth: '300px',
              margin: '0 auto'
            }}>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '1.25rem', fontWeight: 'bold'}}>
                  {Math.floor(totalOpc / 100)}
                </div>
                <div style={{fontSize: '0.75rem', color: '#666'}}>
                  investments made
                </div>
              </div>
              <div style={{textAlign: 'center'}}>
                <div style={{fontSize: '1.25rem', fontWeight: 'bold'}}>
                  {totalOpc % 100}
                </div>
                <div style={{fontSize: '0.75rem', color: '#666'}}>
                  OPCs until next
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            backgroundColor: '#f0f9f6',
            padding: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#10b981'
          }}>
            <p style={{margin: 0}}>
              Your skipped spending has turned into real investments! Keep saving to watch your money grow.
            </p>
          </div>
        </div>
      )}
      
      <RecentActivity activityItems={activityItems} />
      <footer className="footer">
        <p>Prizefight - Smart spending simulator</p>
      </footer>
    </div>
  );
}

export default App;
