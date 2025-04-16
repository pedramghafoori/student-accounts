"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

const AccountContext = createContext();

export function AccountProvider({ children }) {
  const [accountId, setAccountId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize accountId from JWT token and localStorage on mount
  useEffect(() => {
    const token = Cookies.get('userToken');
    let tokenAccountId = null;

    if (token) {
      try {
        const decoded = jwtDecode(token);
        tokenAccountId = decoded.accountId;
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    }

    // Use token accountId if available, otherwise try localStorage
    if (tokenAccountId) {
      setAccountId(tokenAccountId);
      localStorage.setItem('accountId', tokenAccountId);
    } else {
      const storedAccountId = localStorage.getItem('accountId');
      if (storedAccountId) {
        setAccountId(storedAccountId);
      }
    }
    
    setLoading(false);
  }, []);

  // Update localStorage when accountId changes
  const updateAccountId = (newAccountId) => {
    setAccountId(newAccountId);
    if (newAccountId) {
      localStorage.setItem('accountId', newAccountId);
    } else {
      localStorage.removeItem('accountId');
      Cookies.remove('userToken');
    }
  };

  if (loading) {
    return null; // or a loading spinner
  }

  return (
    <AccountContext.Provider value={{ accountId, setAccountId: updateAccountId }}>
      {children}
    </AccountContext.Provider>
  );
}

export function useAccount() {
  const context = useContext(AccountContext);
  if (!context) {
    throw new Error('useAccount must be used within an AccountProvider');
  }
  return context;
} 