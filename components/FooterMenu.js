"use client";
import React from "react";
import { usePathname } from "next/navigation";

export default function FooterMenu({ allUserAccounts = [] }) {
  const pathname = usePathname();
  function isActive(path) {
    return pathname === path;
  }

  return (
    <nav className="footer-nav">
      <div className="footer-nav-items">
        {/* Dashboard */}
        <a
          href="/dashboard"
          className={`footer-menu-item ${
            isActive("/dashboard") ? "border-2 border-blue-500 rounded-full p-2" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="footer-menu-icon"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 9.75L12 4.5l9 5.25M4.5 10.5v9.75a.75.75 
              0 00.75.75h4.5a.75.75 
              0 00.75-.75v-4.5a.75.75 
              0 01.75-.75h1.5a.75.75 
              0 01.75.75v4.5a.75.75 
              0 00.75.75h4.5a.75.75 
              0 00.75-.75V10.5M21 
              10.5l-9-5.25-9 5.25"
            />
          </svg>
          <span className="footer-menu-label">Dashboard</span>
        </a>

        {/* Accounts */}
        <div
          className={`footer-menu-item footer-dropdown relative group ${
            isActive("/accounts") ? "border-2 border-blue-500 rounded-full p-2" : ""
          }`}
        >
          <a href="/myinfo" className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="footer-menu-icon"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.121 17.804A9 9 0 1119 8.999m-2.1 
                   5.1A5 5 0 1012 7.999"
              />
            </svg>
            <span className="footer-menu-label">My Info</span>
          </a>
          {/* Hover dropdown content */}
          <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white text-black border border-gray-200 shadow-lg rounded p-2 w-48">
            <p className="text-xs text-gray-500 mb-2">Switch Account:</p>
            {allUserAccounts.map((account) => (
              <a
                key={account.id}
                href={`/accounts/switch/${account.id}`}
                className="block px-2 py-1 hover:bg-gray-100 rounded text-sm"
              >
                {account.displayName}
              </a>
            ))}
          </div>
        </div>

        {/* Transactions */}
        <a
          href="/transactions"
          className={`footer-menu-item ${
            isActive("/transactions") ? "border-2 border-blue-500 rounded-full p-2" : ""
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="footer-menu-icon"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 9V7a2 2 0 00-2-2H7a2 2 
                0 00-2 2v10a2 2 0 002 2h8a2 2 
                0 002-2v-2m-5-5l10-10M12 14l9-9"
            />
          </svg>
          <span className="footer-menu-label">Transactions</span>
        </a>
      </div>
    </nav>
  );
}