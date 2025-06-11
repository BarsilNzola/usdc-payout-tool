import React from 'react';
import WalletConnect from './components/WalletConnect';
import CSVUploader from './components/CSVUploader';
import PayoutHistory from './components/PayoutHistory';
import './styles.css';

function App() {
  return (
    <div className="App">
      <h1>USDC Payout Tool</h1>
      <WalletConnect />
      <CSVUploader />
      <PayoutHistory />
    </div>
  );
}

export default App;
