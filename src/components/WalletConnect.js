import React, { useState } from 'react';
import { MetaMaskSDK } from '@metamask/sdk';
import { ethers } from 'ethers';

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const USDC_ADDRESS = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  42161: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
};

function WalletConnect({ onConnected }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [status, setStatus] = useState('disconnected');

  const connectWallet = async () => {
    try {
      const MMSDK = new MetaMaskSDK({ dappMetadata: { name: 'USDC Payout Tool' } });
      const provider = MMSDK.getProvider();

      if (!provider) {
        throw new Error('MetaMask not installed!');
      }

      await provider.request({ method: 'eth_requestAccounts' });
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const address = await signer.getAddress();
      setAccount(address);

      const { chainId } = await ethersProvider.getNetwork();
      const chainIdNumber = Number(chainId);
      setChainId(chainIdNumber);

      onConnected?.({ signer, chainId: chainIdNumber });
      await fetchUSDCBalance(address, chainIdNumber, ethersProvider);
      setStatus('connected');
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('disconnected');
      alert(`Failed: ${error.message}`);
    }
  };

  const fetchUSDCBalance = async (walletAddress, chainId, ethersProvider) => {
    const usdcAddress = USDC_ADDRESS[chainId];
    if (!usdcAddress) {
      setUsdcBalance('Unsupported chain');
      return;
    }

    const contract = new ethers.Contract(usdcAddress, USDC_ABI, ethersProvider);
    const balance = await contract.balanceOf(walletAddress);
    const decimals = await contract.decimals();
    setUsdcBalance(ethers.formatUnits(balance, decimals));
  };

  return (
    <div className="wallet-connect-card">
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={connectWallet}
            className={`connect-button ${status === 'connected' ? 'connected' : ''}`}
          >
            {account ? 'Connected ✅' : 'Connect MetaMask'}
          </button>
          <span className={`status-badge ${status === 'connected' ? 'connected' : ''}`}>
            {status === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="metamask-card-blurb">
          <h3>💳 Spend USDC Instantly</h3>
          <p>Recipients can use MetaMask Card to spend without converting to fiat.</p>
          <a href="https://metamask.io/card" target="_blank">Learn more</a>
        </div>
      </div>

      {account && (
        <div className="wallet-info">
          <p><strong>Wallet:</strong> {account}</p>
          <p><strong>Chain ID:</strong> {chainId}</p>
          <p><strong>USDC Balance:</strong> {usdcBalance || 'Loading...'}</p>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;