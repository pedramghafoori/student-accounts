import React from "react";

export default function Sidebar({ accounts, onSelectAccount }) {
  return (
    <div className="w-64 bg-white shadow p-4">
      <h2 className="text-xl font-bold mb-2">Accounts</h2>
      <p className="mb-4"></p>

      {accounts.length === 0 && (
        <p className="text-gray-700">No accounts found...</p>
      )}

      {accounts.map((acc) => (
        <div
          key={acc.Id}
          className="border border-gray-300 rounded-lg p-4 mb-4 hover:bg-blue-50 cursor-pointer"
          onClick={() => onSelectAccount(acc.Id)}
        >
          <h2 className="text-lg font-medium">{acc.Name}</h2>
        </div>
      ))}
    </div>
  );
}