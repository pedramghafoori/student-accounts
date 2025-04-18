"use client";

import React, { useState, useContext } from "react";
import useSWR from 'swr';
import axios from "axios";
import { AppContext } from "../context/appcontext";
import Header from "../../components/Header";
import Image from 'next/image';

// Create fetcher function for SWR
const fetcher = url => axios.get(url).then(res => res.data);

function ReceiptDisplay({ transaction }) {
  // Use SWR for receipt data
  const { data, error: receiptError, isLoading } = useSWR(
    transaction.Transaction_Reference__c?.startsWith('pi_') 
      ? `/api/transactions/stripe?reference=${transaction.Transaction_Reference__c}`
      : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 3600000, // Cache for 1 hour
    }
  );

  const receiptUrl = data?.receiptUrl;
  const cardType = data?.cardType;
  const last4 = data?.last4;

  const getCardLogo = (type) => {
    switch (type.toLowerCase()) {
      case 'visa':
        return (
          <Image
            src="/visa-logo-gray.png"
            alt="Visa Logo"
            width={32}
            height={16}
            className="object-contain"
          />
        );
      case 'mastercard':
        return (
          <svg className="h-4 w-8" viewBox="0 0 24 8" fill="none">
            <circle cx="8" cy="4" r="3.5" fill="#444444"/>
            <circle cx="16" cy="4" r="3.5" fill="#AAAAAA"/>
          </svg>
        );
      case 'amex':
        return (
          <svg className="h-4 w-8" viewBox="0 0 24 8" fill="none">
            <path d="M0 0.5H24V7.5H0V0.5Z" fill="#016FD0"/>
            <path d="M4 2.5H20V5.5H4V2.5Z" fill="#FFFFFF"/>
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mt-4">
      {isLoading && (
        <div className="text-sm text-gray-500">Loading receipt details...</div>
      )}
      
      {receiptError && (
        <div className="text-sm text-red-500 flex items-center gap-2">
          <span>{receiptError.message}</span>
        </div>
      )}

      {!isLoading && !receiptError && (
        <>
          <div className="flex items-center gap-2">
            {cardType && (
              <>
                <p className="text-sm text-gray-600">
                  <strong>Payment Method:</strong>
                </p>
                {getCardLogo(cardType)}
                {last4 && (
                  <span className="text-sm text-gray-600">{last4}</span>
                )}
              </>
            )}
          </div>
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-500 underline text-sm mt-1 block"
            >
              Download Receipt
            </a>
          )}
        </>
      )}
    </div>
  );
}

export default function ReceiptsPage() {
  const {
    selectedAccount,
    setSelectedAccount,
    sessionExpired,
    allAccounts,
  } = useContext(AppContext);

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Use SWR for registrations data
  const { data: registrationsData, error: registrationsError } = useSWR(
    selectedAccount?.Id ? `/api/transactions/registrations?accountId=${selectedAccount.Id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );

  const registrations = registrationsData?.records || [];
  const error = registrationsError?.message;

  function handleSelect(accountId) {
    console.log("Select account:", accountId);
    const newAccount = allAccounts?.find((acct) => acct.Id === accountId);
    setSelectedAccount(newAccount || null);
  }

  function handleLogout() {
    console.log("Logout clicked");
  }

  if (!selectedAccount) {
    return (
      <>
        <Header
          headerTagline="Receipts for"
          selectedAccount={selectedAccount}
          accounts={allAccounts || []}
          showAccountDropdown={showAccountDropdown}
          setShowAccountDropdown={setShowAccountDropdown}
          handleSelect={handleSelect}
          handleLogout={handleLogout}
        />

        <div className="p-6">
          <div className="bg-white shadow p-6 rounded-lg">
            <h1 className="text-3xl font-semibold mb-4">Receipts for</h1>
            <p className="text-gray-600">Please select an account.</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header 
        selectedAccount={selectedAccount}
        headerTagline="Receipts for"
        accounts={allAccounts || []}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        handleSelect={handleSelect}
        handleLogout={handleLogout}
      />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-semibold mb-4">Receipts for {selectedAccount?.Name}</h1>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {registrations && registrations.length > 0 ? (
            registrations.map((reg) => {
              const transactions = reg.Transactions__r?.records || [];
              return (
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
                          <strong>Registered on:</strong>{" "}
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
                    <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <span><strong>Course:</strong></span>
                          <span>{reg.Course_Amount__c || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span><strong>Discounts:</strong></span>
                          <span>{reg.Discount_Amount__c || 0}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <span><strong>Add-Ons:</strong></span>
                          <span>{reg.Add_On_Amount__c || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span><strong>Total Charged:</strong></span>
                          <span>{reg.Total_Captured__c || 0}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-1">
                          <span><strong>Tax:</strong></span>
                          <span>{reg.Net_Tax__c || 0}</span>
                        </div>
                      </div>
                    </div>

                    {transactions.length > 0 ? (
                      <>
                        {transactions.map((tx) => (
                          <ReceiptDisplay key={tx.Id} transaction={tx} />
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
      </main>

      {sessionExpired && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-md">
            <p className="mb-4 text-lg text-center">
              Your session has expired. Please log in again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}