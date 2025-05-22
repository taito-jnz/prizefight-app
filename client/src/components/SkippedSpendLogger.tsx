import { useState } from 'react';
import { saveOpcToFirestore, safeFirestoreOperation } from "../services/firestoreHelpers";

interface SkippedSpendLoggerProps {
  onAddOpc: (amount: number, description: string) => void;
}

const DEFAULT_USER_ID = "default-user";

const SkippedSpendLogger = ({ onAddOpc }: SkippedSpendLoggerProps) => {
  const [skippedAmount, setSkippedAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const opcPreview = skippedAmount ? Math.floor(parseFloat(skippedAmount) / 0.5) : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSkippedAmount(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    const amount = parseFloat(skippedAmount);
    
    if (amount >= 0.5) {
      try {
        setIsSubmitting(true);
        const opcEarned = Math.floor(amount / 0.5);
        
        // Call the parent callback to update local state
        onAddOpc(opcEarned, `Skipped purchase ($${amount.toFixed(2)})`);
        
        // Clear the input field immediately for better user experience
        setSkippedAmount('');
        
      } catch (error) {
        console.error("Error logging skipped spend:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="card">
      <h2 className="card-title">💸 Log Skipped Purchase</h2>
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
          <p>You'll earn <span className="highlight">{opcPreview}</span> 🪙 OPCs</p>
        </div>
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting || !skippedAmount || parseFloat(skippedAmount) < 0.5}
        >
          {isSubmitting ? 'Saving...' : 'Log Skipped Spend'}
        </button>
      </form>
    </div>
  );
};

export default SkippedSpendLogger;
