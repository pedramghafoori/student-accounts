// components/Header.js
"use client";
import React from "react";
import { useRouter } from "next/navigation";

export default function Header({
  selectedAccount,       // Accept as a prop
  headerTagline = "", // provide a default or expect the caller to pass it
  accounts,
  showAccountDropdown,
  setShowAccountDropdown,
  handleSelect,
  handleLogout,
  courseName = "", // Add courseName prop
  showBackButton = false, // Add showBackButton prop
}) {
  const router = useRouter();

  return (
    <>
      <header className="header-wave-parent relative bg-blue-500 text-white overflow-hidden">
        <div
          className="my-header absolute inset-0 p-6 flex items-center justify-between"
          style={{ zIndex: 10 }}
        >
          <div>
            <h1 className="header-account-tagline">{headerTagline}</h1>
            {selectedAccount ? (
              <p className="header-account-name">{selectedAccount.Name}</p>
            ) : courseName ? (
              <p className="header-account-name">{courseName}</p>
            ) : null}
          </div>

          {showBackButton ? (
            <div className="relative">
              <button
                onClick={() => router.back()}
                className="flex items-center px-3 py-2 rounded text-white hover:text-blue-100"
              >
                <svg
                  className="w-5 h-5 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                Back
              </button>
            </div>
          ) : accounts.length > 1 ? (
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center px-3 py-2 rounded"
                style={{ zIndex: 10 }}
              >
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.2832 19.9316" width="36" height="36">
                  <g>
                    <rect height="19.9316" opacity="0" width="20.2832" x="0" y="0"/>
                    <path d="M19.9219 9.96094C19.9219 15.4492 15.459 19.9219 9.96094 19.9219C4.47266 19.9219 0 15.4492 0 9.96094C0 4.46289 4.47266 0 9.96094 0C15.459 0 19.9219 4.46289 19.9219 9.96094ZM3.95508 15.9277C5.44922 17.5195 7.71484 18.4375 9.95117 18.4375C12.1973 18.4375 14.4531 17.5195 15.957 15.9277C14.8926 14.248 12.5781 13.291 9.95117 13.291C7.30469 13.291 5.00977 14.2676 3.95508 15.9277ZM6.60156 7.94922C6.60156 10.0488 8.07617 11.6113 9.95117 11.6309C11.8359 11.6504 13.3008 10.0488 13.3008 7.94922C13.3008 5.97656 11.8262 4.33594 9.95117 4.33594C8.08594 4.33594 6.5918 5.97656 6.60156 7.94922Z" fill="white"/>
                  </g>
                </svg>
              </button>
            </div>
          ) : null}
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