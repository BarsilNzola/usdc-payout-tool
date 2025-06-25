import React, { useState } from 'react';
import Papa from 'papaparse';

function CSVUploader({ onDataParsed }) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: false, // assuming the CSV is just address,amount per line
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = result.data.map((row) => ({
          address: row[0]?.trim(),
          amount: row[1]?.trim(),
        }));
        setData(parsed);
        setError(null);
        onDataParsed && onDataParsed(parsed); // callback up to App.js if needed
      },
      error: (err) => {
        setError(`Error parsing CSV: ${err.message}`);
      },
    });
  };

  return (
    <div className="csv-uploader border p-4 my-4 rounded shadow-sm bg-white">
      <h2 className="text-xl font-semibold mb-2">Upload CSV of Payouts</h2>
      <input type="file" accept=".csv" onChange={handleFileUpload} className="mb-2" />

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

