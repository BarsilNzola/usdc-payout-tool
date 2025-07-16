import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MetaMaskSDK } from '@metamask/sdk';
import WalletConnectProvider from '@walletconnect/web3-provider';
import { BrowserProvider, Contract, formatUnits } from 'ethers';

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
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
    setStatus('connecting');
    let provider;

    try {
      // Try MetaMask connection
      if (!sdkRef.current) throw new Error('MetaMask SDK not initialized');

      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isMobile) {
        const { uri } = await sdkRef.current.connect({ deeplink: true });
        console.log("Generated URI:", uri);
      }

      provider = sdkRef.current.getProvider();
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts?.[0]) throw new Error("No accounts returned");

    } catch (err) {
      console.warn("MetaMask failed. Falling back to WalletConnect...", err);

      // Fallback to WalletConnect
      try {
        const wcProvider = new WalletConnectProvider({
          rpc: {
            1: "https://mainnet.infura.io/v3/REACT_APP_INFURA_API_KEY",
            137: "https://polygon-rpc.com",
            42161: "https://arb1.arbitrum.io/rpc",
            10: "https://mainnet.optimism.io"
          },
          bridge: "https://bridge.walletconnect.org",
          qrcode: true,
        });

        await wcProvider.enable();
        provider = wcProvider;
      } catch (wcError) {
        console.error("WalletConnect fallback failed:", wcError);
        alert("All wallet connection methods failed.");
        setStatus('error');
        return;
      }
    }

    try {
      const browserProvider = new BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      const network = await browserProvider.getNetwork();
      const address = await signer.getAddress();

      setAccount(address);
      setChainId(network.chainId.toString());
      setStatus('connected');

      onConnected?.({ signer, chainId: network.chainId });
      await fetchUSDCBalance(address, network.chainId, browserProvider);
    } catch (finalError) {
      console.error("Final connection step failed:", finalError);
      setStatus('error');
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
          
          <span className={`status-badge ${status === 'connected' ? 'connected' : ''} ${status === 'error' ? 'error' : ''}`}>
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