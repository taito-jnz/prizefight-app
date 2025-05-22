import { useState } from 'react';

interface BankConnectionProps {
  onConnect: (bankName: string, accountId: string) => void;
  isConnected: boolean;
  bankName?: string;
}

const BankConnection = ({ onConnect, isConnected, bankName }: BankConnectionProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Mock bank options
  const bankOptions = [
    { id: 'chase', name: 'Chase' },
    { id: 'bofa', name: 'Bank of America' },
    { id: 'wells', name: 'Wells Fargo' },
    { id: 'citi', name: 'Citibank' },
    { id: 'capital', name: 'Capital One' }
  ];
  
  const handleOpenModal = () => {
    setShowModal(true);
  };
  
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBank('');
  };
  
  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
  };
  
  const handleConnect = () => {
    if (!selectedBank) return;
    
    setLoading(true);
    
    // Simulate Plaid connection process with a timeout
    setTimeout(() => {
      // Generate a mock account ID
      const accountId = `acct_${Math.random().toString(36).substring(2, 10)}`;
      const bank = bankOptions.find(b => b.id === selectedBank);
      
      if (bank) {
        onConnect(bank.name, accountId);
      }
      
      setLoading(false);
      setShowModal(false);
    }, 2000);
  };
  
  return (
    <div className="bank-connection-widget">
      <div className="card">
        <h2 className="card-title">🏦 Bank Connection</h2>
        
        {isConnected ? (
          <div className="connected-status">
            <div className="status-indicator success"></div>
            <p>Connected to <strong>{bankName}</strong></p>
            <button 
              className="btn btn-outline" 
              onClick={handleOpenModal}
            >
              Change Bank
            </button>
          </div>
        ) : (
          <div className="connection-prompt">
            <p>Connect your bank to automate investments based on your OPC balance</p>
            <button 
              className="btn btn-primary" 
              onClick={handleOpenModal}
            >
              Connect Bank Account
            </button>
          </div>
        )}
      </div>
      
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="modal-header">
              <h3>Select Your Bank</h3>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            <div className="modal-body">
              {loading ? (
                <div className="loading-indicator">
                  <div className="spinner"></div>
                  <p>Connecting to bank...</p>
                </div>
              ) : (
                <>
                  <div className="bank-list">
                    {bankOptions.map(bank => (
                      <div 
                        key={bank.id} 
                        className={`bank-option ${selectedBank === bank.id ? 'selected' : ''}`}
                        onClick={() => handleBankSelect(bank.id)}
                      >
                        <div className="bank-logo">{bank.name.charAt(0)}</div>
                        <div className="bank-name">{bank.name}</div>
                      </div>
                    ))}
                  </div>
                  <div className="modal-footer">
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleCloseModal}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleConnect}
                      disabled={!selectedBank}
                    >
                      Connect
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankConnection;