"use client";
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
// We'll store the full array of accounts in allAccounts

export const AppContext = createContext(null);

export default function AppProvider({ children }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    console.log("[AppContext] selectedAccount changed:", selectedAccount);
  }, [selectedAccount]);

  useEffect(() => {
    console.log("[AppContext] registrations changed:", registrations);
  }, [registrations]);

  useEffect(() => {
    console.log("[AppContext] error changed:", error);
  }, [error]);

  useEffect(() => {
    console.log("[AppContext] allAccounts changed:", allAccounts);
  }, [allAccounts]);

  // 1) On mount, fetch the full array of accounts
  useEffect(() => {
    axios.get("/api/salesforce")
      .then((res) => {
        if (res.data.success) {
          if (res.data.accounts) setAllAccounts(res.data.accounts);
          else if (res.data.account) setAllAccounts([res.data.account]);
        } else setError(res.data.message || "Error fetching accounts");
      })
      .catch((err) => setError(err.message));
  }, []);

  // Whenever selectedAccount changes, fetch registrations
  useEffect(() => {
    if (!selectedAccount?.Id) {
      setRegistrations([]);
      return;
    }

    setLoading(true);
    axios
      .get(`/api/transactions/registrations?accountId=${selectedAccount.Id}`)
      .then((res) => {
        if (res.data.success) {
          setRegistrations(res.data.records || []);
        } else {
          setError(res.data.message || "Error fetching registrations");
        }
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedAccount]);

  function updateGlobalSelectedAccount(acc) {
    console.log("[AppContext] updateGlobalSelectedAccount called with acc=", acc);
    setSelectedAccount(acc);
  }

  // Provide allAccounts in context
  const contextValue = {
    allAccounts,
    setAllAccounts,
    selectedAccount,
    setSelectedAccount,
    registrations,
    setRegistrations,
    error,
    setError,
    sessionExpired,
    setSessionExpired,
    updateGlobalSelectedAccount,
    loading,
    setLoading,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}