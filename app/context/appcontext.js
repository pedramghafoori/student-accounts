"use client";
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import Cookies from 'js-cookie';
// We'll store the full array of accounts in allAccounts

export const AppContext = createContext(null);

export default function AppProvider({ children }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");
  const [allAccounts, setAllAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Create axios instance with default config
  const api = axios.create({
    headers: {
      'Authorization': `Bearer ${Cookies.get('userToken')}`
    }
  });

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
    const fetchAccounts = async () => {
      try {
        const res = await api.get("/api/salesforce");
        if (res.data.success) {
          if (res.data.accounts) {
            setAllAccounts(res.data.accounts);
            // If no account is selected, select the first one
            if (!selectedAccount && res.data.accounts.length > 0) {
              setSelectedAccount(res.data.accounts[0]);
            }
          } else if (res.data.account) {
            setAllAccounts([res.data.account]);
            if (!selectedAccount) {
              setSelectedAccount(res.data.account);
            }
          }
        } else {
          setError(res.data.message || "Error fetching accounts");
        }
      } catch (err) {
        if (err.response?.status === 401) {
          setSessionExpired(true);
        }
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // Whenever selectedAccount changes, fetch registrations
  useEffect(() => {
    if (!selectedAccount?.Id) {
      setRegistrations([]);
      return;
    }

    setLoading(true);
    api
      .get(`/api/transactions/registrations?accountId=${selectedAccount.Id}`)
      .then((res) => {
        if (res.data.success) {
          setRegistrations(res.data.records || []);
        } else {
          setError(res.data.message || "Error fetching registrations");
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setSessionExpired(true);
        }
        setError(err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedAccount]);

  function updateGlobalSelectedAccount(acc) {
    console.log("[AppContext] updateGlobalSelectedAccount called with acc=", acc);
    if (acc) {
      setSelectedAccount(acc);
      // Store the selected account ID in localStorage for persistence
      localStorage.setItem('selectedAccountId', acc.Id);
    } else {
      setSelectedAccount(null);
      localStorage.removeItem('selectedAccountId');
    }
  }

  // Restore selected account from localStorage on mount
  useEffect(() => {
    const storedAccountId = localStorage.getItem('selectedAccountId');
    if (storedAccountId && allAccounts.length > 0) {
      const account = allAccounts.find(acc => acc.Id === storedAccountId);
      if (account) {
        setSelectedAccount(account);
      }
    }
  }, [allAccounts]);

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