import React, { useState } from 'react';
import detectEthereumProvider from '@metamask/detect-provider';
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
  const [status, setStatus] = useState('disconnected'); // ✅ status state

  const connectWallet = async () => {
    const provider = await detectEthereumProvider();

    if (!provider || !provider.isMetaMask) {
      return alert('Only MetaMask is supported. Please install or switch to MetaMask.');
    }

    try {
      await provider.request({ method: 'eth_requestAccounts' });
      const ethersProvider = new ethers.BrowserProvider(provider);
      const signer = await ethersProvider.getSigner();

      const address = await signer.getAddress();
      setAccount(address);

      const { chainId } = await ethersProvider.getNetwork();
      const chainIdNumber = Number(chainId);
      setChainId(chainIdNumber);

      onConnected && onConnected({ signer, chainId: chainIdNumber });

      await fetchUSDCBalance(address, chainIdNumber, ethersProvider);
      setStatus('connected'); // ✅ set status
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect to MetaMask.');
      setStatus('disconnected');
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
    <div>
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={connectWallet}
          style={{
            padding: '10px 16px',
            backgroundColor: status === 'connected' ? '#28a745' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          {account ? 'Connected ✅' : 'Connect MetaMask'}
        </button>

        <span
          style={{
            marginLeft: '12px',
            padding: '6px 10px',
            borderRadius: '5px',
            backgroundColor: status === 'connected' ? '#28a745' : '#dc3545',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
          }}
        >
          {status === 'connected' ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      {account && (
        <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
          <p><strong>Wallet:</strong> {account}</p>
          <p><strong>Chain ID:</strong> {chainId}</p>
          <p><strong>USDC Balance:</strong> {usdcBalance}</p>
        </div>
      )}
    </div>
  );
}

export default WalletConnect;
