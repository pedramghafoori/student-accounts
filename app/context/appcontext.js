"use client";
import React, { createContext, useState } from "react";

export const AppContext = createContext(null);

export default function AppProvider({ children }) {
  const [globalSelectedAccount, setGlobalSelectedAccount] = useState(null);
  // possibly more states: accounts, batches, etc.

  // Provide a setter function so pages can update the global account
  function updateGlobalSelectedAccount(acc) {
    setGlobalSelectedAccount(acc);
  }

  const contextValue = {
    globalSelectedAccount,
    updateGlobalSelectedAccount,
    // other states & methods...
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}