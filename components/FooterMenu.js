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
          className={`
            footer-menu-item
            flex flex-col items-center
            text-xs            /* smaller text */
            ${isActive("/dashboard") ? "border-1 border-blue-500 rounded-full p-1" : ""}
          `}
        >
          {isActive("/dashboard") ? (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.8516 17.9395" width="24" height="24">
              <g>
                <rect height="17.9395" opacity="0" width="22.8516" x="0" y="0"/>
                <path d="M5.50781 0C3.35938 0 1.12305 0.996094 0.117188 2.72461C0.00976562 2.91992 0 3.04688 0 3.4082L0 17.1875C0 17.6367 0.283203 17.9102 0.771484 17.9102C1.00586 17.9102 1.23047 17.8418 1.40625 17.6758C2.63672 16.6211 4.26758 16.0742 5.89844 16.0742C7.42188 16.0742 8.83789 16.6113 9.87305 17.5C9.98047 17.5879 10.1074 17.6367 10.2148 17.6367C10.4297 17.6367 10.6055 17.4805 10.6055 17.2266L10.6055 2.7832C10.6055 2.5293 10.5859 2.4707 10.4004 2.20703C9.44336 0.830078 7.56836 0 5.50781 0ZM16.9824 0C14.9219 0 13.0469 0.830078 12.0898 2.20703C11.9043 2.4707 11.8848 2.5293 11.8848 2.7832L11.8848 17.2266C11.8848 17.4805 12.0605 17.6367 12.2754 17.6367C12.3828 17.6367 12.5195 17.5879 12.6172 17.5C13.6523 16.6113 15.0684 16.0742 16.5918 16.0742C18.2227 16.0742 19.8535 16.6211 21.084 17.6758C21.2598 17.8418 21.4844 17.9102 21.7188 17.9102C22.207 17.9102 22.4902 17.6367 22.4902 17.1875L22.4902 3.4082C22.4902 3.04688 22.4805 2.91016 22.373 2.72461C21.3672 0.996094 19.1309 0 16.9824 0Z" fill="#007aff"/>
              </g>
            </svg>
          ) : (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.8516 17.9395" width="24" height="24">
              <g>
                <rect height="17.9395" opacity="0" width="22.8516" x="0" y="0"/>
                <path d="M5.50781 0C3.35938 0 1.12305 0.996094 0.117188 2.72461C0.00976562 2.91992 0 3.04688 0 3.4082L0 17.1875C0 17.6367 0.283203 17.9102 0.771484 17.9102C1.00586 17.9102 1.23047 17.8418 1.40625 17.6758C2.63672 16.6211 4.26758 16.0742 5.89844 16.0742C7.42188 16.0742 8.83789 16.6113 9.87305 17.5C9.98047 17.5879 10.1074 17.6367 10.2148 17.6367C10.4297 17.6367 10.6055 17.4805 10.6055 17.2266L10.6055 2.7832C10.6055 2.5293 10.5859 2.4707 10.4004 2.20703C9.44336 0.830078 7.56836 0 5.50781 0ZM16.9824 0C14.9219 0 13.0469 0.830078 12.0898 2.20703C11.9043 2.4707 11.8848 2.5293 11.8848 2.7832L11.8848 17.2266C11.8848 17.4805 12.0605 17.6367 12.2754 17.6367C12.3828 17.6367 12.5195 17.5879 12.6172 17.5C13.6523 16.6113 15.0684 16.0742 16.5918 16.0742C18.2227 16.0742 19.8535 16.6211 21.084 17.6758C21.2598 17.8418 21.4844 17.9102 21.7188 17.9102C22.207 17.9102 22.4902 17.6367 22.4902 17.1875L22.4902 3.4082C22.4902 3.04688 22.4805 2.91016 22.373 2.72461C21.3672 0.996094 19.1309 0 16.9824 0Z" fill="white"/>
              </g>
            </svg>
          )}
          <span className="footer-menu-label">Courses</span>
        </Link>

        {/* Accounts */}
        <div
          className={`
            footer-menu-item
            footer-dropdown
            relative group
            flex flex-col items-center
            text-xs
            ${isActive("/accounts") ? "border-2 border-blue-500 rounded-full p-1" : ""}
          `}
        >
          <Link href="/past-courses" className="flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 mb-0"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <circle cx="12" cy="7" r="5" />
              <path d="M4 22c1-7 6-10 8-10s7 3 8 10" />
            </svg>
            <span className="footer-menu-label">Past Courses</span>
          </Link>

          {/* Hover dropdown content */}
          <div
            className="
              hidden
              group-hover:block
              absolute
              bottom-full
              left-1/2
              -translate-x-1/2
              mb-2
              bg-white
              text-black
              border
              border-gray-200
              shadow-lg
              rounded
              p-2
              w-48
            "
          >
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
          className={`
            footer-menu-item
            flex flex-col items-center
            text-xs
            ${isActive("/transactions") ? "border-2 border-blue-500 rounded-full p-1" : ""}
          `}
        >
          {isActive("/transactions") ? (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.3105 16.6895" width="24" height="24">
              <g>
                <rect height="16.6895" opacity="0" width="23.3105" x="0" y="0"/>
                <path d="M3.99414 13.6621C3.41797 13.6621 3.03711 13.2715 3.03711 12.7246L3.03711 10.918C3.03711 10.3613 3.41797 9.98047 3.99414 9.98047L6.38672 9.98047C6.96289 9.98047 7.34375 10.3613 7.34375 10.918L7.34375 12.7246C7.34375 13.2715 6.96289 13.6621 6.38672 13.6621ZM0 6.16211L0 3.94531L22.9492 3.94531L22.9492 6.16211ZM3.06641 16.6895L19.8828 16.6895C21.9336 16.6895 22.9492 15.6836 22.9492 13.6719L22.9492 3.03711C22.9492 1.02539 21.9336 0.00976562 19.8828 0.00976562L3.06641 0.00976562C1.02539 0.00976562 0 1.02539 0 3.03711L0 13.6719C0 15.6836 1.02539 16.6895 3.06641 16.6895Z" fill="#007aff"/>
              </g>
            </svg>
          ) : (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 23.3105 16.6895" width="24" height="24">
              <g>
                <rect height="16.6895" opacity="0" width="23.3105" x="0" y="0"/>
                <path d="M3.99414 13.6621C3.41797 13.6621 3.03711 13.2715 3.03711 12.7246L3.03711 10.918C3.03711 10.3613 3.41797 9.98047 3.99414 9.98047L6.38672 9.98047C6.96289 9.98047 7.34375 10.3613 7.34375 10.918L7.34375 12.7246C7.34375 13.2715 6.96289 13.6621 6.38672 13.6621ZM0 6.16211L0 3.94531L22.9492 3.94531L22.9492 6.16211ZM3.06641 16.6895L19.8828 16.6895C21.9336 16.6895 22.9492 15.6836 22.9492 13.6719L22.9492 3.03711C22.9492 1.02539 21.9336 0.00976562 19.8828 0.00976562L3.06641 0.00976562C1.02539 0.00976562 0 1.02539 0 3.03711L0 13.6719C0 15.6836 1.02539 16.6895 3.06641 16.6895Z" fill="white"/>
              </g>
            </svg>
          )}
          <span className="footer-menu-label">Transactions</span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`
            footer-menu-item
            flex flex-col items-center
            text-xs
          `}
        >
          {isActive("/profile") ? (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.2832 19.9316" width="24" height="24">
              <g>
                <rect height="19.9316" opacity="0" width="20.2832" x="0" y="0"/>
                <path d="M19.9219 9.96094C19.9219 15.4492 15.459 19.9219 9.96094 19.9219C4.47266 19.9219 0 15.4492 0 9.96094C0 4.46289 4.47266 0 9.96094 0C15.459 0 19.9219 4.46289 19.9219 9.96094ZM3.95508 15.9277C5.44922 17.5195 7.71484 18.4375 9.95117 18.4375C12.1973 18.4375 14.4531 17.5195 15.957 15.9277C14.8926 14.248 12.5781 13.291 9.95117 13.291C7.30469 13.291 5.00977 14.2676 3.95508 15.9277ZM6.60156 7.94922C6.60156 10.0488 8.07617 11.6113 9.95117 11.6309C11.8359 11.6504 13.3008 10.0488 13.3008 7.94922C13.3008 5.97656 11.8262 4.33594 9.95117 4.33594C8.08594 4.33594 6.5918 5.97656 6.60156 7.94922Z" fill="#007aff"/>
              </g>
            </svg>
          ) : (
            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20.2832 19.9316" width="24" height="24">
              <g>
                <rect height="19.9316" opacity="0" width="20.2832" x="0" y="0"/>
                <path d="M19.9219 9.96094C19.9219 15.4492 15.459 19.9219 9.96094 19.9219C4.47266 19.9219 0 15.4492 0 9.96094C0 4.46289 4.47266 0 9.96094 0C15.459 0 19.9219 4.46289 19.9219 9.96094ZM3.95508 15.9277C5.44922 17.5195 7.71484 18.4375 9.95117 18.4375C12.1973 18.4375 14.4531 17.5195 15.957 15.9277C14.8926 14.248 12.5781 13.291 9.95117 13.291C7.30469 13.291 5.00977 14.2676 3.95508 15.9277ZM6.60156 7.94922C6.60156 10.0488 8.07617 11.6113 9.95117 11.6309C11.8359 11.6504 13.3008 10.0488 13.3008 7.94922C13.3008 5.97656 11.8262 4.33594 9.95117 4.33594C8.08594 4.33594 6.5918 5.97656 6.60156 7.94922Z" fill="white"/>
              </g>
            </svg>
          )}
          <span className="footer-menu-label">Profile</span>
        </Link>
      </div>
    </nav>
  );
}