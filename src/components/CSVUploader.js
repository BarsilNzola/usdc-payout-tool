import React, { useState } from 'react';
import Papa from 'papaparse';
import { Tooltip } from 'react-tooltip';

function CSVUploader({ onDataParsed }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState('');

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true, // Now expects: address,amount,chainId
      skipEmptyLines: true,
      complete: (result) => {
        const validChains = [1, 137, 42161, 10];
        const parsed = result.data
          .map(row => ({
            address: row.address?.trim(),
            amount: row.amount?.trim(),
            chainId: Number(row.chainId) || 1, // Default to Ethereum
          }))
          .filter(row => {
            if (!ethers.isAddress(row.address)) {
              setError(`Invalid address: ${row.address}`);
              return false;
            }
            if (isNaN(row.amount) || row.amount <= 0) {
              setError(`Invalid amount: ${row.amount}`);
              return false;
            }
            if (!validChains.includes(row.chainId)) {
              setError(`Unsupported chain ID: ${row.chainId}`);
              return false;
            }
            return true;
          });

        setData(parsed);
        onDataParsed?.(parsed);
      },
      error: (err) => setError(`CSV Error: ${err.message}`),
    });
  };

  return (
    <div className="csv-uploader">
      <h2>
        Upload CSV 
        <span 
          data-tooltip-id="csv-tooltip" 
          className="tooltip-icon"
        >ℹ️</span>
      </h2>
      
      <Tooltip id="csv-tooltip" place="right">
        <div className="tooltip-content">
          <p><strong>CSV Format:</strong></p>
          <pre>address,amount,chainId</pre>
          <p><strong>Chain IDs:</strong></p>
          <ul>
            <li>1: Ethereum</li>
            <li>137: Polygon</li>
            <li>42161: Arbitrum</li>
            <li>10: Optimism</li>
          </ul>
        </div>
      </Tooltip>

      <input 
        type="file" 
        accept=".csv" 
        onChange={handleFileUpload} 
        aria-describedby="csv-format-help"
      />

      {error && <p className="text-red-500">{error}</p>}

      {data.length > 0 && (
        <table className="w-full mt-4 border-collapse border border-gray-200">
          <thead>
            <tr>
              <th className="border p-2">Address</th>
              <th className="border p-2">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index}>
                <td className="border p-2">{row.address}</td>
                <td className="border p-2">{row.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CSVUploader;

