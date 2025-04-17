"use client";
import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
          href="/courses"
          className={`footer-menu-item flex flex-col items-center text-xs ${isActive("/courses") ? "active" : ""}`}
        >
          <Image
            src={isActive("/courses") ? "/active.book.fill.svg" : "/grey.book.fill.svg"}
            alt="Courses"
            width={24}
            height={24}
          />
          <span className="footer-menu-label">Courses</span>
        </Link>

        {/* Receipts */}
        <Link
          href="/transactions"
          className={`footer-menu-item flex flex-col items-center text-xs ${isActive("/transactions") ? "active" : ""}`}
        >
          <Image
            src={isActive("/transactions") ? "/active.creditcard.fill.svg" : "/grey.creditcard.fill.svg"}
            alt="Receipts"
            width={24}
            height={24}
          />
          <span className="footer-menu-label">Receipts</span>
        </Link>

        {/* Profile */}
        <Link
          href="/profile"
          className={`footer-menu-item flex flex-col items-center text-xs ${isActive("/profile") ? "active" : ""}`}
        >
          <Image
            src={isActive("/profile") ? "/active.person.crop.circle.fill.svg" : "/grey.person.crop.circle.fill.svg"}
            alt="Profile"
            width={24}
            height={24}
          />
          <span className="footer-menu-label">Profile</span>
        </Link>
      </div>
    </nav>
  );
}