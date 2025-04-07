import React, { useState } from "react";

export default function Sidebar({ accounts, onSelectAccount }) {
  // Track which account is selected (no need to pass anything down from the parent)
  const [selectedId, setSelectedId] = useState(null);

  function handleAccountClick(accountId) {
    setSelectedId(accountId);
    // Let the parent know which account was selected
    onSelectAccount(accountId);
  }

  return (
    // Make the sidebar take up the full screen height, then center its contents
    <div className="fixed top-0 left-0 w-64 h-screen bg-white shadow p-4 pt-14 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-center">Accounts</h2>

      {accounts.length === 0 && (
        <p className="text-gray-700 text-center">Loading accounts...</p>
      )}

      {accounts.map((acc) => {
        const isSelected = acc.Id === selectedId;
        return (
          <div
            key={acc.Id}
            className={`border rounded-lg p-4 mb-4 hover:bg-blue-50 cursor-pointer 
              ${isSelected ? "bg-blue-100 border-blue-400" : "border-gray-300"}`}
            onClick={() => handleAccountClick(acc.Id)}
          >
            <h2 className="text-lg font-medium">{acc.Name}</h2>
          </div>
        );
      })}
    </div>
  );
}