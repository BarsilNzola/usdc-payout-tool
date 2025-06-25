import React, { useState } from 'react';
import { ethers } from 'ethers';

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

// USDC contract addresses per chain
const USDC_ADDRESS = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  42161: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
};

function PayoutSender({ payouts, signer, chainId }) {
  const [status, setStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const sendPayouts = async () => {
    if (!signer || !chainId) {
      return setStatus('Wallet not connected or unsupported network.');
    }
    const usdcAddress = USDC_ADDRESS[chainId];
    if (!usdcAddress) {
      return setStatus('Unsupported network.');
    }

    setIsSending(true);
    setStatus('Fetching USDC decimals...');

    const contract = new ethers.Contract(usdcAddress, USDC_ABI, signer);
    const decimals = await contract.decimals();

    for (let i = 0; i < payouts.length; i++) {
      const { address, amount } = payouts[i];
      try {
        const amountInWei = ethers.parseUnits(amount, decimals);
        setStatus(`Sending ${amount} USDC to ${address} (${i + 1}/${payouts.length})...`);
        const tx = await contract.transfer(address, amountInWei);
        await tx.wait();
      } catch (error) {
        setStatus(`Error sending to ${address}: ${error.message}`);
        setIsSending(false);
        return;
      }
    }

    setStatus('✅ All payouts completed successfully!');
    setIsSending(false);
  };

  return (
    <div className="payout-sender mt-4 p-4 border rounded bg-white">
      <h2 className="text-xl mb-2">Send Payouts</h2>
      <button
        onClick={sendPayouts}
        disabled={isSending || payouts.length === 0}
        className={`bg-blue-500 text-white px-4 py-2 rounded ${isSending ? 'opacity-50' : ''}`}
      >
        {isSending ? 'Sending...' : 'Send Payouts'}
      </button>
      {status && <p className="mt-2">{status}</p>}
    </div>
  );
}

export default PayoutSender;
