import React, { useState } from 'react';
import { ethers } from 'ethers';

const USDC_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function decimals() view returns (uint8)"
];

const USDC_ADDRESS = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  42161: '0xff970a61f2de4661ED88A30C99A7a9449Aa84174',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
};

function PayoutSender({ payouts, signer, chainId, walletAddress }) {
  const [status, setStatus] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState([]);

  const sendPayouts = async () => {
    if (!signer || !chainId || !walletAddress) {
      setStatus('Wallet not connected or unsupported network.');
      return;
    }

    const usdcAddress = USDC_ADDRESS[chainId];
    if (!usdcAddress) {
      setStatus('Unsupported network.');
      return;
    }

    setIsSending(true);
    setStatus(`Fetching USDC decimals...`);
    setResults([]);

    const contract = new ethers.Contract(usdcAddress, USDC_ABI, signer);
    const decimals = await contract.decimals();
    const key = `payoutHistory_${walletAddress.toLowerCase()}`;
    const existingHistory = JSON.parse(localStorage.getItem(key)) || [];
    let tempResults = [];

    for (let i = 0; i < payouts.length; i++) {
      const { address, amount } = payouts[i];
      try {
        const amountInWei = ethers.parseUnits(amount, decimals);
        setStatus(`Sending ${amount} USDC to ${address} (${i + 1}/${payouts.length})...`);

        const tx = await contract.transfer(address, amountInWei);
        await tx.wait();

        const newEntry = {
          address,
          amount,
          txHash: tx.hash,
          date: new Date().toISOString(),
          chainId,
        };

        tempResults.push({ ...newEntry, error: null });

        const updatedHistory = [...existingHistory, newEntry].slice(-100); // Limit to last 100
        localStorage.setItem(key, JSON.stringify(updatedHistory));
      } catch (error) {
        tempResults.push({ address, amount, txHash: null, error: error.message });
      }

      setResults([...tempResults]);
    }

    setStatus('✅ Payouts complete');
    setIsSending(false);
  };

  const etherscanBase = {
    1: 'https://etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
  }[chainId];

  return (
    <div className="payout-sender mt-6 p-6 bg-white rounded-2xl shadow-md border border-gold">
      <h2 className="text-xl font-semibold mb-4">Send USDC Payouts</h2>
      <button
        onClick={sendPayouts}
        disabled={isSending || payouts.length === 0}
        className={`bg-blue-500 text-white px-4 py-2 rounded-xl hover:bg-blue-600 ${isSending ? 'opacity-50' : ''}`}
      >
        {isSending ? 'Sending...' : `Send ${payouts.length} Payouts`}
      </button>

      {status && <p className="mt-2 text-blue-600 font-medium">{status}</p>}

      {results.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm border border-gold mt-2 rounded-xl overflow-hidden shadow">
            <thead className="bg-gold text-white">
              <tr>
                <th className="py-2 px-4 text-left">Address</th>
                <th className="py-2 px-4 text-left">Amount</th>
                <th className="py-2 px-4 text-left">Transaction</th>
                <th className="py-2 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <tr key={i} className={`even:bg-gray-50 ${r.error ? 'bg-red-50' : ''}`}>
                  <td className="py-2 px-4 font-mono">{r.address}</td>
                  <td className="py-2 px-4">{r.amount}</td>
                  <td className="py-2 px-4">
                    {r.txHash ? (
                      <a href={`${etherscanBase}${r.txHash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                        View on Explorer
                      </a>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-4">
                    {r.error ? (
                      <span className="text-red-600 font-bold">❌ {r.error}</span>
                    ) : (
                      <span className="text-green-600 font-bold">✅ Success</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default PayoutSender;
