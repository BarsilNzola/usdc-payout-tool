import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MetaMaskSDK } from '@metamask/sdk';
import { BrowserProvider, Contract, formatUnits } from 'ethers';

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

const USDC_ADDRESS = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',     // Ethereum
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',   // Polygon
  42161: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8', // Arbitrum
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',    // Optimism
};

function WalletConnect({ onConnected }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const sdkRef = useRef(null);

  // Initialize MetaMask SDK
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        const MMSDK = new MetaMaskSDK({
          dappMetadata: {
            name: "USDC Payout Tool",
            url: window.location.href,
          },
          injectProvider: true,
          preferDesktop: false,
          openDeeplink: (link) => {
            window.open(link, '_blank', 'noopener,noreferrer');
          }
        });

        await MMSDK.init();
        sdkRef.current = MMSDK;
        const provider = MMSDK.getProvider();

        provider.on('connect', (info) => console.log('✅ CONNECTED', info));
        provider.on('disconnect', (error) => console.error('⛔ DISCONNECTED', error));
        provider.on('session_update', (info) => console.log('🔄 SESSION UPDATED', info));
        // Removed unused setProvider call
      } catch (error) {
        console.error("SDK initialization failed:", error);
        setStatus('error');
      }
    };

    initializeSDK();

    return () => {
      if (sdkRef.current?.connector) {
        sdkRef.current.connector.disconnect();
      }
    };
  }, []);

  const fetchUSDCBalance = useCallback(async (address, chainId, provider) => {
    try {
      const tokenAddress = USDC_ADDRESS[chainId];
      if (!tokenAddress) {
        setUsdcBalance('Unsupported chain');
        return;
      }

      const contract = new Contract(tokenAddress, USDC_ABI, provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals()
      ]);

      setUsdcBalance(formatUnits(balance, decimals));
    } catch (err) {
      console.error('USDC fetch error:', err);
      setUsdcBalance('Error');
    }
  }, []);

  const connectWallet = useCallback(async () => {
    if (!sdkRef.current) {
      alert('Wallet connection not ready. Please try again.');
      return;
    }
  
    try {
      setStatus('connecting');
  
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  
      if (isMobile) {
        // Let MetaMask SDK handle mobile connection flow
        const { uri } = await sdkRef.current.connect({ deeplink: true });
        console.log("Generated URI:", uri);
      }
  
      const provider = sdkRef.current.getProvider();
  
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });
  
      if (!accounts?.[0]) {
        throw new Error("No accounts returned");
      }
  
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const address = await signer.getAddress();
  
      setAccount(address);
      setChainId(network.chainId.toString());
      setStatus('connected');
  
      onConnected?.({ signer, chainId: network.chainId });
      await fetchUSDCBalance(address, network.chainId, browserProvider);
    } catch (err) {
      console.error("Connection failed:", err);
      setStatus('error');
      alert(`Error: ${err.message}`);
    }
  }, [onConnected, fetchUSDCBalance]);

  return (
    <div className="wallet-connect-card">
      <div className="wallet-connect-content">
        <div className="connection-section">
          <button
            onClick={connectWallet}
            disabled={status === 'connecting'}
            className={`connect-button ${status === 'connected' ? 'connected' : ''}`}
          >
            {status === 'connecting' ? 'Connecting...' : 
             account ? 'Connected ✅' : 'Connect Wallet'}
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