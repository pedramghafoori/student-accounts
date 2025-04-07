import React, { useState } from "react";

export default function Sidebar({ accounts, onSelectAccount }) {
  const [selectedId, setSelectedId] = useState(null);

  function handleAccountClick(accountId) {
    setSelectedId(accountId);
    onSelectAccount(accountId);
  }

  function handleLogout() {
    // Basic logout: clear userToken cookie
    document.cookie = "userToken=; path=/; max-age=0;";
    // Optionally redirect to login or home
    window.location.href = "/login";
  }

  return (
    <div className="fixed top-0 left-0 w-64 h-screen bg-white shadow p-4 pt-14 flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-center">Accounts</h2>

      <div className="flex-1 overflow-y-auto">
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

      {/* Logout button at bottom */}
      <div className="mt-4 border-t pt-4 text-center">
        <button
          onClick={handleLogout}
          className="border border-gray-300 text-sm px-4 py-2 rounded hover:bg-gray-100"
        >
          Logout
        </button>
      </div>
    </div>
  );
}