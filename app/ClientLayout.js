"use client";

import React from "react";
import { usePathname, useRouter } from 'next/navigation';
import FooterMenu from "../components/FooterMenu";
import Header from "../components/Header";
import { useAppContext } from "./context/appcontext";
import Cookies from 'js-cookie';

export default function ClientLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const { selectedAccount, allAccounts, showAccountDropdown, setShowAccountDropdown, handleSelect, handleLogout } = useAppContext();

  // Check authentication for protected routes
  React.useEffect(() => {
    if (!isLoginPage) {
      const token = Cookies.get('userToken');
      if (!token) {
        router.push('/login?reason=expired');
      }
    }
  }, [isLoginPage, router]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {!isLoginPage && (
        <Header
          selectedAccount={selectedAccount}
          accounts={allAccounts}
          showAccountDropdown={showAccountDropdown}
          setShowAccountDropdown={setShowAccountDropdown}
          handleSelect={handleSelect}
          handleLogout={handleLogout}
        />
      )}
      <main className="flex-1 w-full relative">
        {children}
      </main>
      {!isLoginPage && <FooterMenu />}
    </div>
  );
} 