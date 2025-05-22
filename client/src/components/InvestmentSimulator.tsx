interface InvestmentSimulatorProps {
  totalOpc: number;
}

const InvestmentSimulator = ({ totalOpc }: InvestmentSimulatorProps) => {
  // Convert OPCs to dollar value (100 OPCs = $25)
  const investmentValue = (totalOpc / 100) * 25;
  
  // Calculate future value with compound interest
  // Formula: futureValue = principal * (1 + rate)^time
  const rate = 0.06; // 6% annual interest
  const timeYears = 5; // 5-year projection
  const futureValue = investmentValue * Math.pow(1 + rate, timeYears);

  // Calculate how many full $25 investments can be made
  const fullInvestments = Math.floor(totalOpc / 100);
  
  // Calculate OPCs needed for next investment
  const opcNeededForNext = fullInvestments > 0 ? 100 - (totalOpc % 100) : 100;

  return (
    <div className="card investment-card">
      <h2 className="card-title">📈 Investment Simulator</h2>
      <div className="simulator-stats">
        <div className="stat-row">
          <span className="stat-label">Your OPC Balance</span>
          <span className="stat-value highlight">{totalOpc} 🪙</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Equivalent Investment</span>
          <span className="stat-value">${investmentValue.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Next Investment In</span>
          <span className="stat-value">{opcNeededForNext} more OPCs</span>
        </div>
      </div>

      <div className="projection-box">
        <h3 className="projection-title">💰 Projected Future Value</h3>
        <div className="projection-value">
          <span>${futureValue.toFixed(2)}</span>
        </div>
        <div className="projection-details">
          <div className="detail-item">
            <span className="detail-label">Annual Return Rate:</span>
            <span className="detail-value success">6% APY</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Time Horizon:</span>
            <span className="detail-value">5 years</span>
          </div>
        </div>
        <p className="projection-info">
          This is what your saved money could be worth if invested for 5 years
          at a 6% annual return, compounded yearly.
        </p>
      </div>
    </div>
  );
};

export default InvestmentSimulator;
