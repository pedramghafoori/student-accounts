// components/Header.js
"use client";
import React from "react";

export default function Header({
  selectedAccount,       // Accept as a prop
  headerTagline = "", // provide a default or expect the caller to pass it
  accounts,
  showAccountDropdown,
  setShowAccountDropdown,
  handleSelect,
  handleLogout,
}) {
  return (
    <>
      <header className="header-wave-parent relative bg-blue-500 text-white overflow-hidden">
        <div
          className="my-header absolute inset-0 p-6 flex items-center justify-between"
          style={{ zIndex: 10 }}
        >
          <div>
            <h1 className="header-account-tagline">{headerTagline}</h1>
            {selectedAccount && (
              <p className="header-account-name">{selectedAccount.Name}</p>
            )}
          </div>

          {accounts.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center px-3 py-2 rounded"
                style={{ zIndex: 10 }}
              >
                <svg 
                id="Layer_1" 
                fill="WHITE"
                stroke="currentColor"
                strokeWidth="0"
                className="menu-icon"
                data-name="Layer 1" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 122.88 122.88">
                    <title>account</title>
                    <path d="M61.44,0A61.31,61.31,0,0,1,84.92,4.66h0A61.66,61.66,0,0,1,118.21,38l.1.24a61.39,61.39,0,0,1-.1,46.73h0A61.42,61.42,0,0,1,38,118.21h0A61.3,61.3,0,0,1,18,104.88l0,0A61.5,61.5,0,0,1,4.66,84.94l-.09-.24A61.48,61.48,0,0,1,4.66,38v0A61.37,61.37,0,0,1,18,18l0,0A61.5,61.5,0,0,1,37.94,4.66l.24-.09A61.35,61.35,0,0,1,61.44,0ZM48.78,79.89a16.44,16.44,0,0,1-1.34-1.62c-2.6-3.56-4.93-7.58-7.27-11.33-1.7-2.5-2.59-4.73-2.59-6.52s1-4.13,3-4.64a101,101,0,0,1-.18-11.73A16.86,16.86,0,0,1,41,41.11a17,17,0,0,1,7.58-9.64,19.26,19.26,0,0,1,4.11-2c2.59-1,1.34-4.91,4.19-5C63.54,24.33,74.52,30,78.8,34.68a16.91,16.91,0,0,1,4.38,11l-.27,10.57a3.31,3.31,0,0,1,2.41,2.41c.36,1.43,0,3.39-1.25,6.16h0c0,.09-.09.09-.09.18-2.75,4.53-5.62,9.78-8.78,14-1.59,2.12-2.9,1.75-1.54,3.78,6.45,8.87,19.18,7.64,27,13.55a52.66,52.66,0,0,0,9.36-54.72l-.09-.2A52.7,52.7,0,0,0,98.55,24.33h0a52.63,52.63,0,0,0-57-11.49l-.21.09a52.53,52.53,0,0,0-17,11.4h0a52.63,52.63,0,0,0-11.49,57l.09.21A52.66,52.66,0,0,0,22.19,96.3c7.85-5.91,20.58-4.68,27-13.55,1.12-1.68.83-1.52-.44-2.86Z"/></svg>
              </button>
            </div>
          )}
        </div>

        <svg
          className="relative block h-[90px] w-full"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
          <path
            d="M985.66 40.99c-49.94 2.19-99.88 9.21-149.82 16.12C711 65.55 661 78.1 610.96 83.66 530 92 449 86.32 368 83.29c-49.39-1.72-98.88-1.6-148.23 1.33-52.23 3.14-104.37 8.78-156.58 14.14-2.88.29-52.07 5.75-52.19 7.85 0 .56 1200 0 1200 0v-24.7c-52-3.89-104-7.78-156-11.57z"
            fill="white"
          />
        </svg>
      </header>

      {showAccountDropdown && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 999 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAccountDropdown(false);
            }
          }}
        >
            <div className="my-modal-forced-size">
            <h2 className="text-xl font-bold mb-2 text-center">Accounts</h2>
            <p className="text-sm text-center text-gray-500 mb-4">
              The accounts below are associated with your email address.
            </p>
            <div className="overflow-y-auto max-h-96">
              {accounts.map((acc) => (
                <div
                  key={acc.Id}
                  onClick={() => {
                    handleSelect(acc.Id);
                    setShowAccountDropdown(false);
                  }}
                  style={{ padding: "0.5rem" }}
                  className="border rounded-lg mb-2 cursor-pointer hover:bg-blue-50"
                >
                  <h2 className="text-base">{acc.Name}</h2>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t pt-2 text-center">
              <button
                onClick={handleLogout}
                className="text-sm text-blue-500 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}