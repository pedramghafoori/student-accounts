// /app/context/AppContext.js
"use client";

import React, { createContext, useState } from "react";

export const AppContext = createContext(null);

export default function AppProvider({ children }) {
  const [selectedAccount, setSelectedAccount] = useState(null);
  // ... maybe other states (accounts, showAccountDropdown, etc.) ...

  const contextValue = {
    selectedAccount,
    setSelectedAccount,
    // other states/methods...
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}