"use client";

import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/appcontext";
import Header from "../../components/Header"; // adjust path if needed

function TransactionRow({ transaction }) {
  const [receiptUrl, setReceiptUrl] = useState("");

  useEffect(() => {
    if (!transaction.Transaction_Reference__c) return;

    axios
      .get(`/api/transactions/stripe?reference=${transaction.Transaction_Reference__c}`)
      .then((res) => {
        if (res.data.success && res.data.receiptUrl) {
          setReceiptUrl(res.data.receiptUrl);
        }
      })
      .catch((err) => console.error("Error retrieving stripe receipt:", err));
  }, [transaction.Transaction_Reference__c]);

  return (
    // Card-like styling for each transaction row
    <div className="card mt-2 p-3 border border-gray-300 rounded-md">
      <p className="text-sm">
        <strong>Stripe Ref:</strong> {transaction.Transaction_Reference__c || "N/A"}
      </p>
      {receiptUrl ? (
        <a
          href={receiptUrl}
          target="_blank"
          rel="noreferrer"
          className="text-blue-500 underline text-sm"
        >
          View Receipt
        </a>
      ) : (
        <p className="text-gray-400 text-xs">No receipt URL or still retrieving...</p>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const {
    selectedAccount,
    setSelectedAccount,
    error,
    registrations,
    setRegistrations,
    sessionExpired,
    allAccounts,
  } = useContext(AppContext);

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  function handleSelect(accountId) {
    console.log("Select account:", accountId);
    const newAccount = allAccounts?.find((acct) => acct.Id === accountId);
    setSelectedAccount(newAccount || null);
  }

  function handleLogout() {
    console.log("Logout clicked");
    // Possibly remove cookies or do your logout logic
  }

  console.log("Parent is passing:", {
    showAccountDropdown,
    accounts: allAccounts,
    handleSelect,
  });

  useEffect(() => {
    if (!selectedAccount) return;
    axios
      .get(`/api/transactions/registrations?accountId=${selectedAccount.Id}`)
      .then((res) => {
        if (res.data.success) {
          setRegistrations(res.data.records);
        }
      })
      .catch((err) => console.error("Error retrieving registrations:", err));
  }, [selectedAccount, setRegistrations]);

  // If no account is selected yet
  if (!selectedAccount) {
    return (
      <>
        <Header
          headerTagline="Transactions for"
          selectedAccount={selectedAccount}
          accounts={allAccounts || []}
          showAccountDropdown={showAccountDropdown}
          setShowAccountDropdown={setShowAccountDropdown}
          handleSelect={handleSelect}
          handleLogout={handleLogout}
        />

        <div className="p-6">
          <div className="bg-white shadow p-6 rounded-lg">
            <h1 className="text-3xl font-semibold mb-4">Transactions for</h1>
            <p className="text-gray-600">Please select an account.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header
        headerTagline="Transactions for"
        selectedAccount={selectedAccount}
        accounts={allAccounts || []}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        handleSelect={handleSelect}
        handleLogout={handleLogout}
      />

      <div className="p-6">
        <div className="bg-white shadow p-6 rounded-lg">
          <h1 className="text-3xl font-semibold mb-4">Transactions</h1>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {registrations && registrations.length > 0 ? (
            registrations.map((reg) => {
              const transactions = reg.Transactions__r?.records || [];
              return (
                // Card for each registration
                <div
                  key={reg.Id}
                  className="card mb-4 p-4 border border-gray-300 rounded-md"
                >
                  <div className="card-header">
                    <h2 className="text-[#0070d9] font-bold text-lg">
                      {reg.Name || "Untitled Registration"}
                    </h2>
                  </div>

                  <div className="card-body mt-3">
                    <div className="flex flex-wrap gap-6 items-start text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2 7h20M2 11h20M2 15h20M2 19h20"
                          />
                        </svg>
                        <p>
                          <strong>Registration Number:</strong>{" "}
                          {reg.Registration_Number__c}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7V3m8 4V3m-9 8h10m-10 4h4"
                          />
                          <rect x="3" y="5" width="18" height="16" rx="2" ry="2" />
                        </svg>
                        <p>
                          <strong>Close Date:</strong>{" "}
                          {reg.CloseDate
                            ? new Date(reg.CloseDate).toLocaleDateString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-2 flex items-center mt-4">
                      <svg
                        className="h-5 w-5 text-gray-600 mr-1"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M..." />
                      </svg>
                      Financials
                    </h3>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M..." />
                        </svg>
                        <p>
                          <strong>Course Amount:</strong>{" "}
                          {reg.Course_Amount__c || 0}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M..." />
                        </svg>
                        <p>
                          <strong>Discount:</strong> {reg.Discount_Amount__c || 0}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M..." />
                        </svg>
                        <p>
                          <strong>Tax:</strong> {reg.Net_Tax__c || 0}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M..." />
                        </svg>
                        <p>
                          <strong>Add-On Amount:</strong>{" "}
                          {reg.Add_On_Amount__c || 0}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-1"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path d="M..." />
                        </svg>
                        <p>
                          <strong>Total Captured:</strong>{" "}
                          {reg.Total_Captured__c || 0}
                        </p>
                      </div>
                    </div>

                    {transactions.length > 0 ? (
                      <>
                        <h4 className="font-semibold mt-4 mb-2">Stripe Transactions</h4>
                        {transactions.map((tx) => (
                          <TransactionRow key={tx.Id} transaction={tx} />
                        ))}
                      </>
                    ) : (
                      <p className="text-gray-500 mt-2 text-sm">
                        No related Transactions found.
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-700">No registrations found.</p>
          )}
        </div>
      </div>

      {sessionExpired && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-md">
            <p className="mb-4 text-lg text-center">
              Your session has expired. Please log in again.
            </p>
            {/* In this code snippet, no direct navigation is set up for login.
                You can add a button or handle it as needed, depending on your workflow. */}
          </div>
        </div>
      )}
    </>
  );
}