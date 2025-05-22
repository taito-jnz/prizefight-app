import { useState } from 'react';

interface BudgetTrackerProps {
  onAddOpc: (amount: number, description: string) => void;
  onUpdateStreak: (isUnderBudget: boolean) => void;
  savedBudget: number;
  onUpdateBudget: (budget: number) => void;
}

const BudgetTracker = ({ 
  onAddOpc, 
  onUpdateStreak, 
  savedBudget, 
  onUpdateBudget 
}: BudgetTrackerProps) => {
  const [budget, setBudget] = useState(savedBudget.toString());
  const [actualSpend, setActualSpend] = useState('');
  
  const budgetValue = parseFloat(budget);
  const spendValue = actualSpend ? parseFloat(actualSpend) : 0;
  const difference = budgetValue - spendValue;
  const isUnderBudget = difference > 0;
  const opcToEarn = isUnderBudget ? Math.floor(difference / 0.5) : 0;

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBudget(e.target.value);
    if (parseFloat(e.target.value) > 0) {
      onUpdateBudget(parseFloat(e.target.value));
    }
  };

  const handleSpendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualSpend(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (budgetValue > 0 && actualSpend !== '') {
      // Update streak
      onUpdateStreak(isUnderBudget);
      
      // If under budget, add OPCs
      if (isUnderBudget && opcToEarn > 0) {
        onAddOpc(opcToEarn, `Under budget ($${difference.toFixed(2)})`);
      }
      
      setActualSpend('');
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">📊 Daily Budget Tracker</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="daily-budget" className="form-label">
            Your daily budget ($)
          </label>
          <div className="input-group">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="daily-budget"
              min="1"
              step="0.50"
              placeholder="0.00"
              className="form-input"
              value={budget}
              onChange={handleBudgetChange}
            />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="actual-spend" className="form-label">
            Your actual spend today ($)
          </label>
          <div className="input-group">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="actual-spend"
              min="0"
              step="0.50"
              placeholder="0.00"
              className="form-input"
              value={actualSpend}
              onChange={handleSpendChange}
            />
          </div>
        </div>
        
        {actualSpend && (
          <>
            {isUnderBudget ? (
              <div className="preview-box">
                <p>✅ You're <span className="success">${difference.toFixed(2)}</span> under budget!</p>
                <p>You'll earn <span className="highlight">{opcToEarn}</span> 🪙 OPCs</p>
              </div>
            ) : (
              <div className="preview-box">
                <p>⚠️ You're <span className="error">${Math.abs(difference).toFixed(2)}</span> over budget</p>
                <p>Stay under budget to earn OPCs!</p>
              </div>
            )}
          </>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary"
          disabled={!budget || !actualSpend || budgetValue <= 0}
        >
          Log Today's Spending
        </button>
      </form>
    </div>
  );
};

export default BudgetTracker;
