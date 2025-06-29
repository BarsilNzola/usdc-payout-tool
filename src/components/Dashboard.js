import React from 'react';

const chainToName = {
  1: 'Ethereum',
  137: 'Polygon',
  42161: 'Arbitrum',
  10: 'Optimism',
};

function Dashboard({ history }) {
  const stats = history.reduce((acc, tx) => {
    const chain = chainToName[tx.toChainId] || 'Unknown';
    acc[chain] = (acc[chain] || 0) + parseFloat(tx.amount);
    return acc;
  }, {});

  return (
    <div className="dashboard">
      <h3>💸 Total Sent per Chain</h3>
      <div className="chain-stats">
        {Object.entries(stats).map(([chain, amount]) => (
          <div key={chain} className="chain-card">
            <div className="chain-name">{chain}</div>
            <div className="chain-amount">{amount.toFixed(2)} USDC</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;