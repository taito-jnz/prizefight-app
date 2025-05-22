import { useState, useEffect } from 'react';

interface StreakTrackerProps {
  currentStreak: number;
}

// Function to get the streak emojis based on streak count
const getStreakEmojis = (streak: number): string => {
  if (streak >= 7) {
    return '🚀'; // Rocket for 7+ day streaks
  } else if (streak >= 3) {
    return '🔥🔥🔥'; // Triple fire for 3+ day streaks
  } else if (streak >= 1) {
    return '🔥'; // Single fire for 1+ day streaks
  } else {
    return ''; // No emoji for 0 streak
  }
};

// Get streak milestone message
const getStreakMessage = (streak: number): string => {
  if (streak >= 14) {
    return "Incredible discipline! You're a Wealthweight champion!";
  } else if (streak >= 7) {
    return "Amazing! You've reached Discipline Dealer status!";
  } else if (streak >= 3) {
    return "You're on fire! Keep it up!";
  } else if (streak === 1) {
    return "Great start! Build your streak by staying under budget daily.";
  } else {
    return "Start your streak by staying under budget today!";
  }
};

const StreakTracker = ({ currentStreak }: StreakTrackerProps) => {
  const [prevStreak, setPrevStreak] = useState(currentStreak);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Streak emojis based on current streak count
  const streakEmojis = getStreakEmojis(currentStreak);
  
  // Motivational message based on streak
  const streakMessage = getStreakMessage(currentStreak);
  
  // Track streak changes and trigger animation
  useEffect(() => {
    // If streak increased, trigger animation
    if (currentStreak > prevStreak) {
      setIsAnimating(true);
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1500); // Animation duration
      
      return () => clearTimeout(timer);
    }
    
    setPrevStreak(currentStreak);
  }, [currentStreak, prevStreak]);
  
  return (
    <div className="card">
      <h2 className="card-title">🔥 Your Budget Streak</h2>
      <div className="streak-display">
        <div className={`streak-circle ${isAnimating ? 'streak-animation' : ''}`}>
          <span className="streak-count">{currentStreak}</span>
          <div className="streak-emoji">{streakEmojis}</div>
        </div>
        <p>consecutive days under budget</p>
      </div>
      <div className="streak-message">
        <p>{streakMessage}</p>
      </div>
      <div className="streak-tip">
        <p>
          <span className="tip-label">Tip:</span> Stay under budget every day to build your streak. Each day you go over budget will reset your streak to zero.
        </p>
      </div>
    </div>
  );
};

export default StreakTracker;
