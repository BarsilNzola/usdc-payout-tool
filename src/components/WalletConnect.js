import React, { useState } from "react";
import {
  BrowserProvider,
  Contract,
  formatUnits,
} from "ethers"; // ethers v6
import WalletConnectProvider from "@walletconnect/web3-provider";
import QRCodeModal from "@walletconnect/qrcode-modal";

const USDC_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
];

const USDC_ADDRESS = {
  1: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", // Ethereum
  137: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", // Polygon
  42161: "0xff970a61a04b1ca14834a43f5de4533ebddb5cc8", // Arbitrum
  10: "0x7F5c764cBc14f9669B88837ca1490cCa17c31607", // Optimism
};

function WalletConnect() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [usdcBalance, setUsdcBalance] = useState(null);
  const [status, setStatus] = useState("Disconnected");

  const connected = !!account;

  const fetchUSDCBalance = async (provider, address, chain) => {
    try {
      const tokenAddress = USDC_ADDRESS[chain];
      if (!tokenAddress) {
        setUsdcBalance("Unsupported chain");
        return;
      }
      const contract = new Contract(tokenAddress, USDC_ABI, provider);
      const [balance, decimals] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
      ]);
      setUsdcBalance(formatUnits(balance, decimals));
    } catch (err) {
      console.error("Error fetching USDC:", err);
      setUsdcBalance("Error");
    }
  };

  const connectWallet = async () => {
    try {
      setStatus("Connecting...");

      let provider;

      // ✅ 1. Try MetaMask (desktop injected)
      if (typeof window !== "undefined" && window.ethereum) {
        provider = new BrowserProvider(window.ethereum);
        await window.ethereum.request({ method: "eth_requestAccounts" });
        console.log("🔗 Connected via MetaMask");
      } else {
        // ✅ 2. Fallback to WalletConnect
        const wcProvider = new WalletConnectProvider({
          rpc: {
            1: "https://mainnet.infura.io/v3/REACT_APP_INFURA_API_KEY",
            137: "https://polygon-rpc.com",
            42161: "https://arb1.arbitrum.io/rpc",
            10: "https://mainnet.optimism.io",
          },
          qrcode: true,
          qrcodeModal: QRCodeModal,
        });

        await wcProvider.enable(); // opens QR modal
        provider = new BrowserProvider(wcProvider);
        console.log("🔗 Connected via WalletConnect");
      }

      // ✅ 3. Get signer info
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      const network = await provider.getNetwork();

      setAccount(addr);
      setChainId(Number(network.chainId));
      setStatus("Connected ✅");

      // ✅ 4. Fetch USDC balance
      await fetchUSDCBalance(provider, addr, Number(network.chainId));

      // ✅ 5. Event listeners
      if (window.ethereum) {
        window.ethereum.on("accountsChanged", (accounts) => {
          setAccount(accounts[0] || null);
        });
        window.ethereum.on("chainChanged", (chainId) => {
          setChainId(Number(chainId));
        });
        window.ethereum.on("disconnect", () => {
          setAccount(null);
          setChainId(null);
          setUsdcBalance(null);
          setStatus("Disconnected ❌");
        });
      }
    } catch (err) {
      console.error("Wallet connection error:", err);
      setStatus("Connection failed ❌");
    }
  };

  const disconnectWallet = async () => {
    setAccount(null);
    setChainId(null);
    setUsdcBalance(null);
    setStatus("Disconnected ❌");
  };

  return (
    <div className="wallet-connect-container">
      {!account ? (
        <button
        className={`wallet-connect-button ${connected ? "connected" : ""}`}
        onClick={connected ? disconnectWallet : connectWallet}
        >
          {connected ? "Disconnect Wallet" : "Connect Wallet"}
        </button>
      ) : (
        <div className="wallet-info">
          <p>Connected: {account.slice(0, 6)}...{account.slice(-4)}</p>
          <p>Chain ID: {chainId}</p>
          <p>USDC Balance: {usdcBalance}</p>
          <button className="wallet-connect-button" onClick={disconnectWallet}>
            Disconnect
          </button>
        </div>
      )}

      <div className="status-text">Status: {status}</div>
    </div>
  );
}

export default WalletConnect;
