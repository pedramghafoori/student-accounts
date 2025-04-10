"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";


export default function FooterMenu({ allUserAccounts = [] }) {
  const pathname = usePathname();
  function isActive(path) {
    return pathname === path;
  }

  return (
    <nav className="footer-nav">
      <div className="footer-nav-items">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`footer-menu-item ${
            isActive("/dashboard") ? "border-1 border-blue-500 rounded-full p-2" : ""
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
          <span className="footer-menu-label">Courses</span>
        </Link>

        {/* Accounts */}
        <div
          className={`footer-menu-item footer-dropdown relative group ${
            isActive("/accounts") ? "border-2 border-blue-500 rounded-full p-2" : ""
          }`}
        >
          <Link href="/myinfo" className="flex flex-col items-center">
            <svg
            xmlns="http://www.w3.org/2000/svg"
            className="footer-menu-icon"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            >
            <circle cx="12" cy="7" r="5" />
            <path d="M4 22c1-7 6-10 8-10s7 3 8 10" />
            </svg>
            <span className="footer-menu-label">My Info</span>
          </Link>
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
        <Link
          href="/transactions"
          className={`footer-menu-item ${
            isActive("/transactions") ? "border-2 border-blue-500 rounded-full p-2" : ""
          }`}
        >
          <svg
  xmlns="http://www.w3.org/2000/svg"
  className="footer-menu-icon"
  fill="none"
  viewBox="0 0 29 24"   // <- wider canvas
  stroke="currentColor"
  strokeWidth="2"
  strokeLinecap="round"
  strokeLinejoin="round"
>
  <rect x="1" y="4" width="27" height="17" rx="2" ry="2" />
  <line x1="1" y1="8" x2="26" y2="8" />
  <line x1="4" y1="13" x2="15" y2="13" />
  <line x1="20" y1="13" x2="25" y2="13" />
  <line x1="4" y1="17" x2="14" y2="17" />

</svg>
          <span className="footer-menu-label">Transactions</span>
        </Link>
      </div>
    </nav>
  );
}