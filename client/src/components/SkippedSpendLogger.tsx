import { useState } from 'react';

interface SkippedSpendLoggerProps {
  onAddOpc: (amount: number, description: string) => void;
}

const SkippedSpendLogger = ({ onAddOpc }: SkippedSpendLoggerProps) => {
  const [skippedAmount, setSkippedAmount] = useState<string>('');
  const opcPreview = skippedAmount ? Math.floor(parseFloat(skippedAmount) / 0.5) : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkippedAmount(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(skippedAmount);
    
    if (amount >= 0.5) {
      const opcEarned = Math.floor(amount / 0.5);
      onAddOpc(opcEarned, `Skipped purchase ($${amount.toFixed(2)})`);
      setSkippedAmount('');
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">Log Skipped Purchase</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="skipped-amount" className="form-label">
            Amount you chose not to spend ($)
          </label>
          <div className="input-group">
            <span className="input-prefix">$</span>
            <input
              type="number"
              id="skipped-amount"
              min="0.50"
              step="0.50"
              placeholder="0.00"
              className="form-input"
              value={skippedAmount}
              onChange={handleAmountChange}
            />
          </div>
        </div>
        <div className="preview-box">
          <p>You'll earn <span className="highlight">{opcPreview}</span> OPCs</p>
        </div>
        <button type="submit" className="btn btn-primary" disabled={!skippedAmount || parseFloat(skippedAmount) < 0.5}>
          Log Skipped Spend
        </button>
      </form>
    </div>
  );
};

export default SkippedSpendLogger;
