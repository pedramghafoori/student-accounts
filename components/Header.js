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
            <h1 className="text-lg font-thin">{headerTagline}</h1>
            {selectedAccount && (
              <p className="text-4xl font-bold">{selectedAccount.Name}</p>
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
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 40 40"
                fill="none"
                className="menu-icon"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="8" r="3" />
                <path d="M6 18c1.5-4 5.5-4 6-4s4.5 0 6 4" />
                </svg>
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