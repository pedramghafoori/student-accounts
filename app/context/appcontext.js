"use client";
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AppContext = createContext(null);

export default function AppProvider({ children }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState("");
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
    console.log("[AppContext] sessionExpired changed:", sessionExpired);
  }, [sessionExpired]);

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

  const contextValue = {
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