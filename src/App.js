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

  // Accept signer and chainId from WalletConnect
  const handleWalletData = ({ signer, chainId }) => {
    setSigner(signer);
    setChainId(chainId);
  };

  return (
    <div className="App">
      <h1>USDC Payout Tool</h1>
      <WalletConnect onConnected={handleWalletData} />
      <CSVUploader onDataParsed={setPayouts} />
      <PayoutSender payouts={payouts} signer={signer} chainId={chainId} />
      <PayoutHistory />
    </div>
  );
}

export default App;