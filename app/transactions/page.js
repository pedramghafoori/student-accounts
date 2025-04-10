"use client";

import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/appcontext";

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
    <div className="border p-3 my-2 rounded">
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
  // Pull from context:
  const { selectedAccount, registrations, error, sessionExpired } = useContext(AppContext);

  // If no account is selected, prompt user
  if (!selectedAccount) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-4">Transactions</h1>
        <p className="text-gray-600">Please select an account.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-4">Transactions</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* If we have registrations, display them */}
      {registrations && registrations.length > 0 ? (
        registrations.map((reg) => {
          const transactions = reg.Transactions__r?.records || [];
          return (
            <div key={reg.Id} className="mb-6 border p-4 rounded-md shadow">
              <h2 className="text-xl font-bold mb-2">{reg.Name || "Untitled Registration"}</h2>

              <div className="mb-4 text-sm text-gray-600">
                <p>
                  <strong>Registration Number:</strong> {reg.Registration_Number__c}
                </p>
                <p>
                  <strong>Close Date:</strong> {reg.CloseDate ? new Date(reg.CloseDate).toLocaleDateString() : "N/A"}
                </p>
              </div>

              <h3 className="text-lg font-semibold mb-2">Financials</h3>
              <div className="mb-2 text-sm">
                <p>
                  <strong>Course Amount:</strong> {reg.Course_Amount__c || 0}
                </p>
                <p>
                  <strong>Discount:</strong> {reg.Discount_Amount__c || 0}
                </p>
                <p>
                  <strong>Tax:</strong> {reg.Net_Tax__c || 0}
                </p>
                <p>
                  <strong>Add-On Amount:</strong> {reg.Add_On_Amount__c || 0}
                </p>
                <p>
                  <strong>Total Captured:</strong> {reg.Total_Captured__c || 0}
                </p>
              </div>

              {transactions.length > 0 ? (
                <>
                  <h4 className="font-semibold mt-4 mb-2">Stripe Transactions</h4>
                  {transactions.map((tx) => (
                    <TransactionRow key={tx.Id} transaction={tx} />
                  ))}
                </>
              ) : (
                <p className="text-gray-500 mt-2 text-sm">No related Transactions found.</p>
              )}
            </div>
          );
        })
      ) : (
        <p className="text-gray-600">No registrations found.</p>
      )}

      {sessionExpired && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-md">
            <p className="mb-4 text-lg text-center">
              Your session has expired. Please log in again.
            </p>
            {/* ... sessionExpired logic ... */}
          </div>
        </div>
      )}
    </div>
  );
}