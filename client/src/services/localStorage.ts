type StoredData = {
  totalOpc: number;
  currentStreak: number;
  savedBudget: number;
  activityItems: ActivityItem[];
};

type ActivityItem = {
  id: string;
  description: string;
  date: string;
  opcEarned: number;
};

const STORAGE_KEY = 'prizefight_data';

export const getStoredData = (): StoredData => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading from localStorage:', error);
  }
  
  // Return default values if no data exists
  return {
    totalOpc: 0,
    currentStreak: 0,
    savedBudget: 45,
    activityItems: [],
  };
};

export const updateActivity = (
  totalOpc: number,
  currentStreak: number,
  savedBudget: number,
  activityItems: ActivityItem[]
): void => {
  try {
    const data: StoredData = {
      totalOpc,
      currentStreak,
      savedBudget,
      activityItems,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};
