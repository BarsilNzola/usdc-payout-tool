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
        <div className="footer-grid">
          {/* Column 1: Powered By */}
          <div className="footer-column">
            <h4>Powered By</h4>
            <div className="tech-stack-compact">
              <img src="https://li.fi/logo.svg" alt="LI.FI" />
              <img src="https://metamask.io/metamask-icon.svg" alt="MetaMask" />
              <img src="https://cctp.circle.com/logo.svg" alt="CCTP" />
            </div>
          </div>

          {/* Column 2: Contact */}
          <div className="footer-column">
            <h4>Contact</h4>
            <div className="contact-info">
              <div>theforeverknights1@gmail.com</div>
            </div>
          </div>

          {/* Column 3: Donations */}
          <div className="footer-column">
            <h4>Donate</h4>
            <div className="contact-info">
              <div>ETH: <span className="wallet-address">0x78fE31D333aec6Be5EBF57854b635f3d1C614F22</span></div>
              <div>BTC: <span className="wallet-address">bc1q9wnzq42c0nz8659hajq3820e5pgn5t342e2wcz</span></div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;