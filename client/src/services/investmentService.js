// Mock implementation that will be replaced with real Plaid + investment API calls later
import { doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { safeFirestoreOperation } from "./firestoreHelpers";

// Local storage key for investment data
const INVESTMENT_STORAGE_KEY = 'prizefight_investment_data';

// Default investment settings
const DEFAULT_INVESTMENT_SETTINGS = {
  isConnected: false,
  bankName: '',
  accountId: '',
  frequency: 'monthly',
  enabled: false,
  balance: 0,
  investmentHistory: [],
  nextScheduledDate: null,
  lastInvestmentAmount: null,
  lastInvestmentDate: null
};

// Get investment data from local storage
export const getLocalInvestmentData = () => {
  try {
    const storedData = localStorage.getItem(INVESTMENT_STORAGE_KEY);
    return storedData ? JSON.parse(storedData) : { ...DEFAULT_INVESTMENT_SETTINGS };
  } catch (error) {
    console.error('Error getting investment data from localStorage:', error);
    return { ...DEFAULT_INVESTMENT_SETTINGS };
  }
};

// Save investment data to local storage
export const saveLocalInvestmentData = (data) => {
  try {
    localStorage.setItem(INVESTMENT_STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving investment data to localStorage:', error);
    return false;
  }
};

// Get investment data from Firestore
export const getInvestmentDataFromFirestore = async (userId) => {
  return await safeFirestoreOperation(async () => {
    const docRef = doc(db, "users", userId, "investments", "settings");
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log("Investment data retrieved from Firestore:", docSnap.data());
      return docSnap.data();
    } else {
      console.log("No investment data found in Firestore");
      return null;
    }
  }, null);
};

// Save investment data to Firestore
export const saveInvestmentDataToFirestore = async (userId, investmentData) => {
  return await safeFirestoreOperation(async () => {
    const docRef = doc(db, "users", userId, "investments", "settings");
    await setDoc(docRef, {
      ...investmentData,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log("Investment data saved to Firestore");
    return true;
  }, false);
};

// Connect bank account (mock implementation)
export const connectBankAccount = async (userId, bankName, accountId) => {
  // Get current investment data
  let investmentData = await getInvestmentDataFromFirestore(userId);
  
  if (!investmentData) {
    investmentData = getLocalInvestmentData();
  }
  
  // Update with new bank connection
  const updatedData = {
    ...investmentData,
    isConnected: true,
    bankName,
    accountId
  };
  
  // Save to Firestore and localStorage
  await saveInvestmentDataToFirestore(userId, updatedData);
  saveLocalInvestmentData(updatedData);
  
  return updatedData;
};

// Update investment settings
export const updateInvestmentSettings = async (userId, frequency, enabled) => {
  // Get current investment data
  let investmentData = await getInvestmentDataFromFirestore(userId);
  
  if (!investmentData) {
    investmentData = getLocalInvestmentData();
  }
  
  // Calculate next scheduled date
  const nextDate = getNextScheduledDate(frequency);
  
  // Update settings
  const updatedData = {
    ...investmentData,
    frequency,
    enabled,
    nextScheduledDate: nextDate
  };
  
  // Save to Firestore and localStorage
  await saveInvestmentDataToFirestore(userId, updatedData);
  saveLocalInvestmentData(updatedData);
  
  return updatedData;
};

// Process investment (mock implementation)
export const processInvestment = async (userId, opcTotal) => {
  // Only process if user has enough OPCs (100+)
  if (opcTotal < 100) {
    return null;
  }
  
  // Get current investment data
  let investmentData = await getInvestmentDataFromFirestore(userId);
  
  if (!investmentData) {
    investmentData = getLocalInvestmentData();
  }
  
  // Check if auto-invest is enabled
  if (!investmentData.isConnected || !investmentData.enabled) {
    return null;
  }
  
  // Calculate investment amount (every 100 OPCs = $25)
  const investmentAmount = Math.floor(opcTotal / 100) * 25;
  const now = new Date();
  
  // Create investment record
  const investmentRecord = {
    amount: investmentAmount,
    date: now.toISOString(),
    opcConverted: Math.floor(opcTotal / 100) * 100
  };
  
  // Add to investment history
  const investmentHistory = [...(investmentData.investmentHistory || []), investmentRecord];
  
  // Calculate new balance (mock implementation with 0.5% monthly growth)
  const previousBalance = investmentData.balance || 0;
  const newBalance = previousBalance + investmentAmount;
  
  // Calculate next scheduled date
  const nextDate = getNextScheduledDate(investmentData.frequency);
  
  // Update investment data
  const updatedData = {
    ...investmentData,
    balance: newBalance,
    investmentHistory,
    lastInvestmentAmount: investmentAmount,
    lastInvestmentDate: now.toISOString(),
    nextScheduledDate: nextDate
  };
  
  // Save to Firestore and localStorage
  await saveInvestmentDataToFirestore(userId, updatedData);
  saveLocalInvestmentData(updatedData);
  
  return {
    success: true,
    amount: investmentAmount,
    newBalance,
    previousBalance,
    date: now.toISOString(),
    nextScheduledDate: nextDate
  };
};

// Helper function to calculate next scheduled date
const getNextScheduledDate = (frequency) => {
  const now = new Date();
  let nextDate = new Date();
  
  if (frequency === 'weekly') {
    // Set to next Monday
    nextDate.setDate(now.getDate() + (7 - now.getDay() + 1) % 7);
  } else {
    // Set to 1st of next month
    nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }
  
  return nextDate.toISOString();
};