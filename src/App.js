import React, { useState } from 'react';
import WalletConnect from './components/WalletConnect';
import CSVUploader from './components/CSVUploader';
import PayoutSender from './components/PayoutSender';
import PayoutHistory from './components/PayoutHistory';
import Dashboard from './components/Dashboard';
import './styles.css';

function App() {
  const [payouts, setPayouts] = useState([]);
  const [signer, setSigner] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  const handleWalletData = ({ signer, chainId }) => {
    const update = async () => {
      const address = await signer.getAddress();
      setSigner(signer);
      setChainId(chainId);
      setWalletAddress(address);
    };
    update();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">Cross-Chain USDC Payout Tool</h1>
        <p className="app-subtitle">
          Send batch payments across Ethereum, Polygon, Arbitrum & Optimism
        </p>
      </header>

      <main>
        {/* Connection Card */}
        <div className="card connection-card">
          <WalletConnect onConnected={handleWalletData} />
        </div>

        {/* Dashboard Stats */}
        {walletAddress && (
          <div className="card stats-card">
            <Dashboard history={JSON.parse(localStorage.getItem(`payoutHistory_${walletAddress.toLowerCase()}`)) || []} />
          </div>
        )}

        {/* CSV Upload */}
        <div className="card upload-card">
          <CSVUploader 
            onDataParsed={(data) => setPayouts(data)} 
          />
          {payouts.length > 0 && (
            <div className="payout-summary">
              <strong>Ready to send:</strong> {payouts.length} payouts across{' '}
              {new Set(payouts.map(p => p.chainId)).size} chains
            </div>
          )}
        </div>

        {/* Payout Sender */}
        {signer && (
          <div className="card sender-card">
            <PayoutSender 
              payouts={payouts} 
              signer={signer} 
              chainId={chainId}
              walletAddress={walletAddress}
            />
          </div>
        )}

        {/* History */}
        {walletAddress && (
          <div className="card history-card">
            <PayoutHistory walletAddress={walletAddress} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-section">
          <h3>Powered By</h3>
          <div className="tech-stack">
            <img src="https://li.fi/logo.svg" alt="LI.FI" width="80" />
            <img src="https://metamask.io/metamask-icon.svg" alt="MetaMask" width="30" />
            <img src="https://cctp.circle.com/logo.svg" alt="CCTP" width="80" />
          </div>
        </div>
        <div className="footer-section">
          <p>
            <strong>Need help?</strong> Contact: theforeverknights1@gmail.com
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;