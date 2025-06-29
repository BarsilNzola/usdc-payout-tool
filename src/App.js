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
      <header className="app-header">
        <h1 className="app-title">USDC Payout Tool</h1>
      </header>

      <main>
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
      </main>

      <footer className="app-footer">
        <p>
          💰 <strong>Donate</strong>:<br />
          <strong>Bitcoin (BTC):</strong> bc1q9wnzq42c0nz8659hajq3820e5pgn5t342e2wcz<br />
          <strong>Ethereum (ETH):</strong> 0x78fE31D333aec6Be5EBF57854b635f3d1C614F22
        </p>
        <p>📧 <strong>Contact:</strong> theforeverknights1@gmail.com</p>
      </footer>
    </div>
  );
}

export default App;
