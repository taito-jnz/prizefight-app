import { useState, useEffect } from 'react';

interface RecurringInvestmentSettingsProps {
  totalOpc: number;
  isConnected: boolean;
  onUpdateSettings: (frequency: string, enabled: boolean) => void;
  investmentSettings: {
    frequency: string;
    enabled: boolean;
    nextScheduledDate?: string;
    lastInvestmentAmount?: number;
    lastInvestmentDate?: string;
  };
}

const RecurringInvestmentSettings = ({ 
  totalOpc, 
  isConnected, 
  onUpdateSettings,
  investmentSettings
}: RecurringInvestmentSettingsProps) => {
  const [frequency, setFrequency] = useState(investmentSettings.frequency || 'monthly');
  const [enabled, setEnabled] = useState(investmentSettings.enabled || false);
  
  // Calculate investment amount based on OPC balance
  // Every 100 OPCs = $25 investment
  const potentialInvestmentAmount = Math.floor(totalOpc / 100) * 25;
  
  // Format dates for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Calculate next scheduled date based on frequency
  const getNextScheduledDate = (): string => {
    if (!enabled) return '';
    
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
  
  const handleFrequencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFrequency(e.target.value);
  };
  
  const handleToggleEnable = () => {
    setEnabled(!enabled);
  };
  
  const handleSaveSettings = () => {
    onUpdateSettings(frequency, enabled);
  };
  
  // Update when settings change
  useEffect(() => {
    setFrequency(investmentSettings.frequency || 'monthly');
    setEnabled(investmentSettings.enabled || false);
  }, [investmentSettings]);

  return (
    <div className="card recurring-investment-card">
      <h2 className="card-title">🔄 Recurring Investments</h2>
      
      {isConnected ? (
        <div className="investment-settings">
          <div className="settings-form">
            <div className="form-group">
              <label htmlFor="frequency">Investment Frequency</label>
              <select 
                id="frequency"
                value={frequency}
                onChange={handleFrequencyChange}
                className="select-input"
                disabled={!isConnected}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            
            <div className="form-group toggle-group">
              <label>Auto-invest when OPCs convert to funds</label>
              <div 
                className={`toggle-switch ${enabled ? 'active' : ''}`}
                onClick={handleToggleEnable}
              >
                <div className="toggle-handle"></div>
              </div>
            </div>
            
            <button 
              className="btn btn-primary save-settings-btn"
              onClick={handleSaveSettings}
              disabled={!isConnected}
            >
              Save Settings
            </button>
          </div>
          
          <div className="investment-info">
            <div className="info-item">
              <span className="info-label">Next Investment:</span>
              <span className="info-value highlight">
                {enabled 
                  ? `$${potentialInvestmentAmount.toFixed(2)} on ${formatDate(investmentSettings.nextScheduledDate || getNextScheduledDate())}` 
                  : 'Auto-invest disabled'}
              </span>
            </div>
            
            {investmentSettings.lastInvestmentAmount && (
              <div className="info-item">
                <span className="info-label">Last Investment:</span>
                <span className="info-value">
                  ${investmentSettings.lastInvestmentAmount.toFixed(2)} on {formatDate(investmentSettings.lastInvestmentDate)}
                </span>
              </div>
            )}
            
            <div className="opc-conversion info-item">
              <span className="info-label">OPC Conversion Rate:</span>
              <span className="info-value">100 OPCs = $25 invested</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="connect-prompt">
          <p>Connect a bank account to set up recurring investments</p>
        </div>
      )}
    </div>
  );
};

export default RecurringInvestmentSettings;