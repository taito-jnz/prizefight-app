import { useState, useEffect, useRef } from 'react';

interface OpcOverviewProps {
  totalOpc: number;
}

// Function to determine the tier based on OPC and streak
const determineTier = (opcCount: number, streak: number = 0): { label: string; icon: string } => {
  if (opcCount >= 1000 && streak >= 14) {
    return { label: 'Wealthweight', icon: '🏆' };
  } else if (streak >= 7) {
    return { label: 'Discipline Dealer', icon: '🧠' };
  } else if (opcCount >= 500) {
    return { label: 'Cashflow Contender', icon: '🥈' };
  } else if (opcCount >= 100) {
    return { label: 'Budget Rookie', icon: '💼' };
  } else {
    return { label: 'Beginner', icon: '🌱' };
  }
};

const OpcOverview = ({ totalOpc }: OpcOverviewProps) => {
  // Convert OPCs to dollar value (100 OPCs = $25)
  const dollarValue = (totalOpc / 100) * 25;
  
  // Maintain previous OPC count to detect changes
  const [prevOpc, setPrevOpc] = useState(totalOpc);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Current tier based on OPC count
  const tier = determineTier(totalOpc);
  
  // Reference to the OPC amount element
  const opcAmountRef = useRef<HTMLSpanElement>(null);
  
  // Trigger animation when OPC count changes
  useEffect(() => {
    if (totalOpc > prevOpc) {
      setIsAnimating(true);
      
      // Reset animation after it completes
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1000); // Animation duration
      
      return () => clearTimeout(timer);
    }
    
    setPrevOpc(totalOpc);
  }, [totalOpc, prevOpc]);

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">🪙 Your OPC Balance</h2>
        <span className="badge tier-badge">
          {tier.icon} {tier.label}
        </span>
      </div>
      <div className="opc-display">
        <span 
          ref={opcAmountRef} 
          className={`opc-amount ${isAnimating ? 'opc-animation' : ''}`}
        >
          {totalOpc}
        </span>
        <span className="opc-label">OPC</span>
      </div>
      <div className="opc-info">
        <p>That's <span className="highlight">${dollarValue.toFixed(2)}</span> in simulated investments!</p>
      </div>
    </div>
  );
};

export default OpcOverview;
