"use client";

import React, { useState, useEffect, useContext } from "react";
import Header from "../../components/Header";
import { AppContext } from "../context/appcontext";

export default function MyInfoPage() {
  const [user, setUser] = useState({ name: "John Doe", email: "john@example.com" });

  useEffect(() => {
    // ...
  }, []);

  const { selectedAccount, accounts } = useContext(AppContext);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  function handleSelect(accountId) {
    console.log("Select account:", accountId);
  }

  function handleLogout() {
    console.log("Logout clicked");
  }

  return (
    <>
      <Header
        headerTagline="My Info"
        selectedAccount={selectedAccount}
        accounts={accounts || []}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        handleSelect={handleSelect}
        handleLogout={handleLogout}
      />

      <div className="p-6">
        <h1 className="text-3xl font-semibold mb-6">My Info</h1>
        <div className="bg-white shadow p-6 rounded-lg">
          <p className="mb-2">
            <span className="font-semibold">Name:</span> {user.name}
          </p>
          <p className="mb-2">
            <span className="font-semibold">Email:</span> {user.email}
          </p>
        </div>
      </div>
    </>
  );
}