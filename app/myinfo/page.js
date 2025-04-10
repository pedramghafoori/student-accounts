"use client";

import React, { useState } from "react";

// If you want to fetch user info from an API, import axios and useEffect:
import axios from "axios";
import { useEffect } from "react";

export default function MyInfoPage() {
  // Basic user info (replace with real data or an API call)
  const [user, setUser] = useState({ name: "John Doe", email: "john@example.com" });

  useEffect(() => {
    // Example: fetch user info
    // axios.get("/api/myinfo").then((res) => {
    //   setUser(res.data);
    // });
  }, []);

  // Example if you want a “Switch Accounts” button
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  return (
    <>
      {/* Wave-shape header */}
      <header className="header-wave-parent relative bg-blue-500 text-white overflow-hidden">
        <div
          className="my-header absolute inset-0 p-6 flex items-center justify-between"
          style={{ zIndex: 10 }}
        >
          {/* LEFT: Page title */}
          <div>
            <h1 className="text-2xl font-bold">Student Portal</h1>
            {/* Optionally show user’s name under the title */}
            <p className="text-lg font-semibold">{user.name}</p>
          </div>

          {/* RIGHT: Example Switch Accounts button (optional) */}
          <div className="relative">
            <button
              onClick={() => setShowAccountDropdown(!showAccountDropdown)}
              className="flex items-center space-x-2 text-blue-100 hover:text-blue-300 border border-blue-100 px-3 py-2 rounded"
              style={{ zIndex: 10 }}
            >
              <span>Switch Accounts</span>
            </button>
          </div>
        </div>

        {/* Wave shape */}
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

      {/* The Switch Accounts dropdown if needed */}
      {showAccountDropdown && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 999 }}
        >
          <div className="p-6 border rounded bg-white text-black w-96">
            <h2 className="text-xl font-bold mb-2 text-center">Accounts</h2>
            {/* Example: list of accounts. Hard-coded or from an API */}
            <div className="border rounded-lg p-2 mb-2 cursor-pointer hover:bg-blue-50">
              <h2 className="text-lg">John Doe (Account #1)</h2>
            </div>
            <div className="border rounded-lg p-2 mb-2 cursor-pointer hover:bg-blue-50">
              <h2 className="text-lg">Jane Doe (Account #2)</h2>
            </div>

            <div className="mt-2 border-t pt-2 text-center">
              <button
                onClick={() => setShowAccountDropdown(false)}
                className="text-sm text-blue-500 hover:underline"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content: user info section */}
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6">My Info</h1>
        <div className="bg-white shadow p-6 rounded-lg">
          {/* Display user info; adjust fields as you want */}
          <p className="mb-2">
            <span className="font-semibold">Name:</span> {user.name}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Email:</span> {user.email}
          </p>
        </div>
      </div>
    </>
  );
}