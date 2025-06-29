import React, { useState } from 'react';
import { LiFi } from '@lifi/sdk';
import { ethers } from 'ethers';

const USDC_ABI = ["function decimals() view returns (uint8)"];
const USDC_ADDRESS = {
  1: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  137: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
  42161: '0xff970a61a04b1ca14834a43f5de4533ebddb5cc8',
  10: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607',
};

// Initialize LI.FI with error handling
let lifi;
try {
  lifi = new LiFi({
    integrator: 'USDC_Payout_Hackathon',
    apiKey: process.env.REACT_APP_LIFI_API_KEY,
  });
} catch (error) {
  console.error('LI.FI initialization failed:', error);
}

function PayoutSender({ payouts, signer, chainId, walletAddress }) {
  const [status, setStatus] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState([]);

  const sendCrossChainPayout = async (payout) => {
    if (!lifi) throw new Error('LI.FI not initialized');
    
    const { address, amount, chainId: toChainId } = payout;
    
    // Validate chain support
    if (!USDC_ADDRESS[chainId] || !USDC_ADDRESS[toChainId]) {
      throw new Error(`Unsupported chain pair: ${chainId}→${toChainId}`);
    }

    const route = await lifi.getRoutes({
      fromChainId: chainId,
      toChainId,
      fromTokenAddress: USDC_ADDRESS[chainId],
      toTokenAddress: USDC_ADDRESS[toChainId],
      fromAmount: ethers.parseUnits(amount, 6).toString(),
      fromAddress: walletAddress,
      toAddress: address,
    });

    if (!route.routes.length) {
      throw new Error('No route found');
    }

    const result = await lifi.executeRoute(route.routes[0], signer);
    return {
      txHash: result.transactionHash,
      toChainId,
      gasUsed: result.gasUsed,
    };
  };

  const sendPayouts = async () => {
    if (!signer) {
      setStatus('Wallet not connected');
      return;
    }

    setIsSending(true);
    setResults([]);
    setCurrentStep(0);

    const key = `payoutHistory_${walletAddress.toLowerCase()}`;
    const existingHistory = JSON.parse(localStorage.getItem(key)) || [];
    let tempResults = [];

    for (const [index, payout] of payouts.entries()) {
      try {
        setStatus(`Processing ${index + 1}/${payouts.length}...`);
        const result = await sendCrossChainPayout(payout);
        
        const newEntry = {
          ...payout,
          txHash: result.txHash,
          date: new Date().toISOString(),
          fromChainId: chainId,
          toChainId: result.toChainId,
        };

        tempResults.push(newEntry);
        setResults([...tempResults]);

        localStorage.setItem(
          key,
          JSON.stringify([...existingHistory, newEntry].slice(-100))
        );
      } catch (error) {
        tempResults.push({ ...payout, error: error.message });
        setResults([...tempResults]);
      }
    }

    setStatus('✅ All payouts completed');
    setIsSending(false);
    setCurrentStep(3);
  };

  // Step tracker UI
  const steps = [
    'Preparing',
    'Routing',
    'Sending',
    'Complete'
  ];

  return (
    <div className="payout-sender">
      <h2>Cross-Chain USDC Payouts</h2>
      
      {/* Step Tracker */}
      <div className="step-tracker">
        {steps.map((step, i) => (
          <div 
            key={i} 
            className={`step ${i <= currentStep ? 'active' : ''}`}
          >
            {step}
          </div>
        ))}
      </div>

      <button 
        onClick={sendPayouts} 
        disabled={isSending || !payouts.length}
      >
        {isSending ? 'Processing...' : `Send ${payouts.length} Payouts`}
      </button>

      {status && <div className="status">{status}</div>}

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
