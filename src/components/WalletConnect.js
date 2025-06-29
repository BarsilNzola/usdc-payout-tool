import React, { useState, useEffect } from 'react';
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
  const [sdk, setSdk] = useState(null);

  // Initialize SDK once
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const MMSDK = new MetaMaskSDK({
          dappMetadata: {
            name: "USDC Payout Tool",
            url: window.location.href,
          },
          infuraAPIKey: process.env.REACT_APP_INFURA_API_KEY,
          enableDebug: false,
        });
        await MMSDK.init();
        setSdk(MMSDK);
      } catch (error) {
        console.error('SDK initialization failed:', error);
        setStatus('error');
      }
    };

    if (!sdk) {
      initializeSDK();
    }
  }, []);

  const connectWallet = async () => {
    if (!sdk) {
      setStatus('error');
      return alert('SDK not initialized. Please refresh the page.');
    }

    try {
      setStatus('connecting');
      const provider = sdk.getProvider();

      if (!provider) {
        throw new Error('MetaMask provider not available');
      }

      // Request accounts first
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();
      const address = await signer.getAddress();
      
      // Get network details
      const network = await ethersProvider.getNetwork();
      const chainIdNumber = Number(network.chainId);

      setAccount(address);
      setChainId(chainIdNumber);
      setStatus('connected');
      
      onConnected?.({ signer, chainId: chainIdNumber });
      await fetchUSDCBalance(address, chainIdNumber, ethersProvider);
      
    } catch (error) {
      console.error('Connection error:', error);
      setStatus('error');
      alert(`Connection failed: ${error.message}`);
    }
  };

  const fetchUSDCBalance = async (walletAddress, chainId, ethersProvider) => {
    try {
      const usdcAddress = USDC_ADDRESS[chainId];
      if (!usdcAddress) {
        setUsdcBalance('Unsupported chain');
        return;
      }

      const contract = new ethers.Contract(usdcAddress, USDC_ABI, ethersProvider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(walletAddress),
        contract.decimals()
      ]);
      setUsdcBalance(ethers.formatUnits(balance, decimals));
    } catch (error) {
      console.error('Balance fetch error:', error);
      setUsdcBalance('Error loading');
    }
  };

  return (
    <div className="wallet-connect-card">
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={connectWallet}
            disabled={status === 'connecting'}
            className={`connect-button ${status === 'connected' ? 'connected' : ''}`}
          >
            {status === 'connecting' ? 'Connecting...' : 
             account ? 'Connected ✅' : 'Connect MetaMask'}
          </button>
          
          <span className={`status-badge ${status === 'connected' ? 'connected' : ''} ${
            status === 'error' ? 'error' : ''}`}>
            {status === 'connected' ? 'Connected' : 
             status === 'error' ? 'Error' : 'Disconnected'}
          </span>
        </div>
        
        <div className="metamask-card-blurb">
          <h3>💳 Spend USDC Instantly</h3>
          <p>Recipients can use MetaMask Card to spend without converting to fiat.</p>
          <a 
            href="https://metamask.io/card" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Learn more
          </a>
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