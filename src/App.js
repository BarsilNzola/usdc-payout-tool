import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import CSVUploader from './components/CSVUploader';
import PayoutSender from './components/PayoutSender';
import PayoutHistory from './components/PayoutHistory';
import './styles.css';

function App() {
  const [payouts, setPayouts] = useState([]);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);

  const handleWalletData = ({ signer, chainId }) => {
    setSigner(signer);
    setChainId(chainId);
  };

  return (
    <div className="app-container">
      <h1 className="app-title">USDC Payout Tool</h1>

      <div className="card">
        <WalletConnect onConnected={handleWalletData} />
      </div>

      <div className="card">
        <CSVUploader onDataParsed={setPayouts} />
      </div>

      <div className="card">
        <PayoutSender payouts={payouts} signer={signer} chainId={chainId} />
      </div>

      <div className="card">
        <PayoutHistory />
      </div>
    </div>
  );
}

export default App;
