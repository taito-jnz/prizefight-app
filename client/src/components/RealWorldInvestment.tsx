import { useState, useEffect } from 'react';

interface RealWorldInvestmentProps {
  isConnected: boolean;
  totalOpc: number;
  investmentData: {
    balance: number;
    lastInvestmentAmount?: number;
    lastInvestmentDate?: string;
    nextScheduledDate?: string;
    frequency: string;
    enabled: boolean;
  };
}

const RealWorldInvestment = ({ 
  isConnected, 
  totalOpc,
  investmentData
}: RealWorldInvestmentProps) => {
  // Calculate how many investments have been made
  const investmentsCount = Math.floor(totalOpc / 100);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not scheduled';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <div className="card real-world-investment-card">
      <h2 className="card-title">💸 Real-World Investment Status</h2>
      
      {isConnected ? (
        <div className="investment-status">
          <div className="balance-section">
            <div className="balance-amount">
              <h3>Current Balance</h3>
              <span className="amount">{formatCurrency(investmentData.balance)}</span>
            </div>
            
            <div className="investment-metrics">
              <div className="metric">
                <span className="metric-value">{investmentsCount}</span>
                <span className="metric-label">investments made</span>
              </div>
              <div className="metric">
                <span className="metric-value">{totalOpc % 100}</span>
                <span className="metric-label">OPCs until next</span>
              </div>
            </div>
          </div>
          
          <div className="schedule-section">
            <div className="schedule-item">
              <span className="item-label">Next scheduled:</span>
              <span className="item-value">
                {investmentData.enabled 
                  ? formatDate(investmentData.nextScheduledDate)
                  : 'Auto-invest disabled'}
              </span>
            </div>
            
            {investmentData.lastInvestmentDate && (
              <div className="schedule-item">
                <span className="item-label">Last investment:</span>
                <span className="item-value">
                  {formatCurrency(investmentData.lastInvestmentAmount || 0)} on {formatDate(investmentData.lastInvestmentDate)}
                </span>
              </div>
            )}
            
            <div className="schedule-item">
              <span className="item-label">Frequency:</span>
              <span className="item-value capitalize">
                {investmentData.frequency}
              </span>
            </div>
          </div>
          
          <div className="insight-box">
            <p>
              Your skipped spending has turned into real investments! Keep saving to watch your money grow.
            </p>
          </div>
        </div>
      ) : (
        <div className="connect-prompt">
          <p>Connect your bank account to start tracking real-world investments</p>
          <div className="benefits-list">
            <div className="benefit-item">
              <span className="icon">✓</span>
              <span>Automatically invest when you reach 100 OPCs</span>
            </div>
            <div className="benefit-item">
              <span className="icon">✓</span>
              <span>Track your real investment balance</span>
            </div>
            <div className="benefit-item">
              <span className="icon">✓</span>
              <span>See the power of compound growth over time</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealWorldInvestment;