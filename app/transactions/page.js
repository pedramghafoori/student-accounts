"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";

/**
 * A single transaction row: shows reference + link if available
 */
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
        <strong>Stripe Ref:</strong>{" "}
        {transaction.Transaction_Reference__c || "N/A"}
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
        <p className="text-gray-400 text-xs">
          No receipt URL or still retrieving...
        </p>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");

  // Suppose your chosen method to get the current selectedAccount
  // is via query param: ?accountId=...
  const searchParams = useSearchParams();
  const accountId = searchParams.get("accountId");

  useEffect(() => {
    if (!accountId) {
      setError("No accountId provided in query params.");
      return;
    }

    axios
      .get(`/api/transactions/registrations?accountId=${accountId}`)
      .then((res) => {
        if (res.data.success) {
          setRegistrations(res.data.records || []);
        } else {
          setError(res.data.message || "Error fetching registrations");
        }
      })
      .catch((err) => {
        setError(err.message);
      });
  }, [accountId]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-semibold mb-4">Transactions</h1>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Each Registration is an Opportunity record */}
      {registrations.length > 0 ? (
        registrations.map((reg) => {
          // Child transactions
          const transactions = reg.Transactions__r?.records || [];

          return (
            <div key={reg.Id} className="mb-6 border p-4 rounded-md shadow">
              <h2 className="text-xl font-bold mb-2">
                {reg.Name || "Untitled Registration"}
              </h2>

              <div className="mb-4 text-sm text-gray-600">
                <p>
                  <strong>Registration Number:</strong> {reg.Registration_Number__c}
                </p>
                <p>
                  <strong>Close Date:</strong>{" "}
                  {reg.CloseDate ? new Date(reg.CloseDate).toLocaleDateString() : "N/A"}
                </p>
              </div>

              {/* Financials section */}
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

              {/* If there are child Transactions__c records, show them */}
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
          );
        })
      ) : (
        <p className="text-gray-600">No registrations found.</p>
      )}
    </div>
  );
}