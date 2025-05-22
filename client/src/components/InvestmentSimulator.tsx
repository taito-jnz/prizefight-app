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

  return (
    <div className="card">
      <h2 className="card-title">Investment Simulator</h2>
      <div className="simulator-stats">
        <div className="stat-row">
          <span className="stat-label">Your OPC Balance</span>
          <span className="stat-value highlight">{totalOpc} OPCs</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Equivalent Investment</span>
          <span className="stat-value">${investmentValue.toFixed(2)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Annual Return Rate</span>
          <span className="stat-value success">6% APY</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Time Horizon</span>
          <span className="stat-value">5 years</span>
        </div>
      </div>

      <div className="projection-box">
        <h3 className="projection-title">Projected Future Value</h3>
        <div className="projection-value">
          <span>${futureValue.toFixed(2)}</span>
        </div>
        <p className="projection-info">
          This is how much your simulated investments could be worth in 5 years, 
          assuming a 6% annual return compounded yearly.
        </p>
      </div>
    </div>
  );
};

export default InvestmentSimulator;
