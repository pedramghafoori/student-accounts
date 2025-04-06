"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");

  // 1) Fetch the list of Accounts (to display as cards on the right)
  useEffect(() => {
    axios
      .get("/api/salesforce")
      .then((res) => {
        if (res.data.success) {
          // If the API returns a single account in 'account', wrap it in an array
          if (res.data.account) {
            setAccounts([res.data.account]);
          } else if (res.data.accounts) {
            setAccounts(res.data.accounts);
          } else {
            setAccounts([]);
          }
        } else {
          setError(res.data.message || "Error fetching accounts");
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // 2) When user selects an account, set that account
  const handleSelect = (accountId) => {
    const account = accounts.find((a) => a.Id === accountId);
    setSelectedAccount(account);
  };

  // 3) Fetch the related Batch__c records whenever an account is selected
  useEffect(() => {
    if (!selectedAccount) {
      return;
    }

    // Call your new courseQuery endpoint
    axios
      .get(`/api/courseQuery?accountId=${selectedAccount.Id}`)
      .then((res) => {
        if (res.data.success) {
          setBatches(res.data.records || []);
        } else {
          setError(res.data.message || "Error fetching batch info");
          setBatches([]);
        }
      })
      .catch((err) => {
        setError(err.message);
        setBatches([]);
      });
  }, [selectedAccount]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">Accounts</h1>

          {/* Display error message if any */}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <div className="flex space-x-4">
            {/* LEFT COLUMN: Selected account details + batches */}
            <div className="w-2/3">
              {selectedAccount ? (
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                  {/* Show the selected Account Name */}
                  <h2 className="text-xl font-bold">{selectedAccount.Name}</h2>

                  {/* Display the Batch__c records if any */}
                  {batches.length > 0 ? (
                    <div>
                      <h3 className="font-semibold mt-4">Related Course Batches</h3>
                      <ul className="list-disc ml-6">
                        {batches.map((batch) => (
                          <li key={batch.Id} className="mb-2">
                            <p className="font-medium">{batch.Name}</p>
                            <p>Product: {batch.Product__c}</p>
                            <p>Days until Start: {batch.Days_until_Start_Date__c}</p>
                            <p>Start Date/Time: {batch.Start_Date_Time__c}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-gray-700">No course batches found for this account.</p>
                  )}
                </div>
              ) : (
                <p className="text-gray-700">Please select an account to view details.</p>
              )}
            </div>

            {/* RIGHT COLUMN: Account cards */}
            <div className="w-1/3">
              {/* If no accounts and no error, show loading */}
              {accounts.length === 0 && !error && (
                <p className="text-gray-700">Loading or no accounts found...</p>
              )}

              {accounts.map((acc) => (
                <div
                  key={acc.Id}
                  className={`mb-4 bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedAccount?.Id === acc.Id ? "border-2 border-blue-500" : ""
                  }`}
                  onClick={() => handleSelect(acc.Id)}
                >
                  {/* Show only the Name on the card */}
                  <h2 className="text-lg font-medium">{acc.Name}</h2>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}