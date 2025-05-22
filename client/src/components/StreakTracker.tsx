interface StreakTrackerProps {
  currentStreak: number;
}

const StreakTracker = ({ currentStreak }: StreakTrackerProps) => {
  return (
    <div className="card">
      <h2 className="card-title">Your Budget Streak</h2>
      <div className="streak-display">
        <div className="streak-circle">
          <span className="streak-count">{currentStreak}</span>
        </div>
        <p>consecutive days under budget</p>
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
