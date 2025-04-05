"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import CourseList from "@/components/CourseList";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/api/salesforce")
      .then((res) => {
        if (res.data.success) {
          // 'accounts' is now an array
          setAccounts(res.data.accounts);
        } else {
          setError(res.data.message || "Error fetching accounts");
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // Called when user selects an account from the dropdown
  const handleSelect = (accountId) => {
    const account = accounts.find((a) => a.Id === accountId);
    setSelectedAccount(account);
  };

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">Account</h1>

          {/* Display error message if any */}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          {/* If we have multiple accounts, show a dropdown */}
          {accounts.length > 1 && (
            <div className="mb-4">
              <label className="block mb-2 font-medium">
                Select an Account:
              </label>
              <select
                className="border border-gray-300 rounded px-3 py-2"
                onChange={(e) => handleSelect(e.target.value)}
                defaultValue=""
              >
                <option value="" disabled>
                  -- Choose an account --
                </option>
                {accounts.map((acc) => (
                  <option key={acc.Id} value={acc.Id}>
                    {acc.Name} ({acc.Id})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* If exactly 1 account is found, auto-select it */}
          {accounts.length === 1 && !selectedAccount && (
            <div className="mb-4">
              <p className="text-gray-700">
                Only one matching account found, selected automatically.
              </p>
              <button
                className="bg-blue-600 text-white rounded px-4 py-2 mt-2"
                onClick={() => setSelectedAccount(accounts[0])}
              >
                View Account
              </button>
            </div>
          )}

          {/* Show selected account info */}
          {selectedAccount && (
            <div className="bg-white rounded-lg shadow p-6 space-y-4 mt-4">
              <p>
                <strong>Account ID:</strong> {selectedAccount.Id}
              </p>
              <p>
                <strong>Name:</strong> {selectedAccount.Name}
              </p>
              {/* PersonEmail for Person Account */}
              {selectedAccount.PersonEmail && (
                <p>
                  <strong>Email:</strong> {selectedAccount.PersonEmail}
                </p>
              )}
            </div>
          )}

          {/* If no account is selected yet but we have some accounts, prompt user */}
          {!selectedAccount && accounts.length > 1 && (
            <p className="text-gray-700 mt-2">
              Please select an account from the dropdown.
            </p>
          )}

          {/* If no accounts and not error, show loading or 'none found' */}
          {accounts.length === 0 && !error && (
            <p className="text-gray-700">Loading or no accounts found...</p>
          )}

          {/* Example course list */}
          <div className="mt-8">
            <CourseList />
          </div>
        </div>
      </div>
    </Layout>
  );
}