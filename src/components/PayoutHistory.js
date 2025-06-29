import React, { useEffect, useState } from 'react';

function PayoutHistory({ walletAddress }) {
  const [history, setHistory] = useState([]);
  const [showFailedOnly, setShowFailedOnly] = useState(false);

  useEffect(() => {
    if (!walletAddress) return;

    const key = `payoutHistory_${walletAddress.toLowerCase()}`;
    const data = JSON.parse(localStorage.getItem(key)) || [];
    setHistory(data.reverse());
  }, [walletAddress]);

  const clearHistory = () => {
    if (!walletAddress) return;

    if (window.confirm('Clear all payout history for this wallet?')) {
      const key = `payoutHistory_${walletAddress.toLowerCase()}`;
      localStorage.removeItem(key);
      setHistory([]);
    }
  };

  const chainToExplorer = (chainId) => ({
    1: 'https://etherscan.io/tx/',
    137: 'https://polygonscan.com/tx/',
    42161: 'https://arbiscan.io/tx/',
    10: 'https://optimistic.etherscan.io/tx/',
  }[chainId] || 'https://etherscan.io/tx/');

  const chainToName = {
    1: 'Ethereum',
    137: 'Polygon',
    42161: 'Arbitrum',
    10: 'Optimism',
  };

  const exportCSV = () => {
    const headers = ['Date', 'Address', 'Amount', 'TxHash', 'Chain'];
    const rows = history.map(item => [
      new Date(item.date).toLocaleString(),
      item.address,
      item.amount,
      item.txHash,
      chainToName[item.chainId] || item.chainId || 'Unknown'
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(val => `"${val}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `payoutHistory_${walletAddress}.csv`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const failedTransactions = history.filter(h => h.error);
  const totalAmount = history.reduce((sum, h) => sum + parseFloat(h.amount || 0), 0).toFixed(4);
  const filteredHistory = showFailedOnly ? failedTransactions : history;

  return (
    <div className="payout-history mt-10 p-6 bg-white rounded-2xl shadow-md border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Payout History</h2>
        {history.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={exportCSV}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
            >
              Export CSV
            </button>
            <button
              onClick={clearHistory}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
            >
              Clear History
            </button>
          </div>
        )}
      </div>

      {/* Status summary */}
      {history.length > 0 && (
        <div className="mb-4">
          {failedTransactions.length > 0 ? (
            <div className="text-red-600 font-semibold flex justify-between items-center">
              ❌ {failedTransactions.length} failed transactions
              <button
                onClick={() => setShowFailedOnly(prev => !prev)}
                className="text-sm bg-yellow-400 text-black px-3 py-1 rounded hover:bg-yellow-500"
              >
                {showFailedOnly ? 'Show All' : 'Show Failed Transactions'}
              </button>
            </div>
          ) : (
            <div className="text-green-600 font-semibold">✅ All transactions sent successfully</div>
          )}
        </div>
      )}

      {filteredHistory.length === 0 ? (
        <p className="text-gray-600">No payouts to show.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-300 rounded-xl">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 text-left">Date</th>
                  <th className="py-2 px-4 text-left">Address</th>
                  <th className="py-2 px-4 text-left">Amount</th>
                  <th className="py-2 px-4 text-left">Transaction</th>
                  <th className="py-2 px-4 text-left">Chain</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item, index) => (
                  <tr key={index} className="even:bg-gray-50">
                    <td className="py-2 px-4">{new Date(item.date).toLocaleString()}</td>
                    <td className="py-2 px-4 font-mono">{item.address}</td>
                    <td className="py-2 px-4">{item.amount}</td>
                    <td className="py-2 px-4">
                      {item.txHash ? (
                        <a
                          href={`${chainToExplorer(item.chainId)}${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 underline"
                        >
                          View
                        </a>
                      ) : item.error ? (
                        <span className="text-red-600 font-bold">❌ {item.error}</span>
                      ) : '—'}
                    </td>
                    <td className="py-2 px-4">
                      {chainToName[item.chainId] || item.chainId || 'Unknown'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end text-sm text-gray-700">
            <div className="text-right">
              <p><strong>Total Transactions:</strong> {history.length}</p>
              <p><strong>Total Amount Sent:</strong> {totalAmount}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default PayoutHistory;
