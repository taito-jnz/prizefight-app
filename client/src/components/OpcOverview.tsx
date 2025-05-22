interface OpcOverviewProps {
  totalOpc: number;
}

const OpcOverview = ({ totalOpc }: OpcOverviewProps) => {
  // Convert OPCs to dollar value (100 OPCs = $25)
  const dollarValue = (totalOpc / 100) * 25;

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">🪙 Your OPC Balance</h2>
        <span className="badge">Coins</span>
      </div>
      <div className="opc-display">
        <span className="opc-amount">{totalOpc}</span>
        <span className="opc-label">OPC</span>
      </div>
      <div className="opc-info">
        <p>That's <span className="highlight">${dollarValue.toFixed(2)}</span> in simulated investments!</p>
      </div>
    </div>
  );
};

export default OpcOverview;
