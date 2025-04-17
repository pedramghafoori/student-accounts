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
      <header className="header-wave-parent relative bg-blue-500 text-white">
        <div
          className="absolute inset-0 p-6 flex items-center justify-between"
          style={{ zIndex: 2 }}
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
                style={{ zIndex: 2 }}
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

        <div className="absolute inset-x-0 bottom-0" style={{ zIndex: 1 }}>
          <svg className="wave-svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
            <path fill="#ffffff" fillOpacity="0.2" d="M-360,160 C0,20 360,300 720,160 C1080,20 1440,300 1800,160 L1800,320 L-360,320 Z" />
            <path fill="#ffffff" fillOpacity="0.4" d="M-360,192 C0,52 360,332 720,192 C1080,52 1440,332 1800,192 L1800,320 L-360,320 Z" />
            <path fill="#ffffff" d="M-360,224 C0,84 360,364 720,224 C1080,84 1440,364 1800,224 L1800,320 L-360,320 Z" />
          </svg>
        </div>
      </header>

      {showAccountDropdown && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ 
            zIndex: 9999,
            position: 'fixed',
            minHeight: '100vh',
            width: '100vw'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAccountDropdown(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            style={{ position: 'relative', zIndex: 10000 }}
          >
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
                  className="border rounded-lg p-4 mb-2 cursor-pointer hover:bg-blue-50"
                >
                  <h2 className="text-base">{acc.Name}</h2>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4 text-center">
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