"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");

  /**
   * Splits text like:
   *   "March 29 - April 6 National Lifeguard - Pool - TMU"
   *   "May 24-25 Standard First Aid with CPR-C (SFA) - TMU"
   * into { courseDates, course, location }
   */
  function parseCourseName(fullName = "") {
    let splitted = fullName.split(" - ");
    let location = "";
    let courseDates = "";
    let course = fullName; // fallback if parse fails

    // Multi-dash logic (3+ parts)
    if (splitted.length >= 3) {
      location = splitted[splitted.length - 1];
      splitted.pop(); // remove location from array

      const first = splitted[0] || "";
      const second = splitted[1] || "";

      let secondParts = second.split(" ");
      if (secondParts.length >= 2) {
        courseDates = first + " - " + secondParts[0] + " " + secondParts[1];
        const remainderCourse = secondParts.slice(2).join(" ");
        if (splitted.length === 3) {
          course = remainderCourse + (splitted[2] ? " - " + splitted[2] : "");
        } else {
          course = remainderCourse;
        }
      } else {
        courseDates = first + " - " + second;
      }

    // Single-dash logic (2 parts)
    } else if (splitted.length === 2) {
      location = splitted[1];
      const re = /^([A-Za-z]+\s+\d+-\d+)(\s+.*)?$/;
      const match = splitted[0].match(re);
      if (match) {
        courseDates = match[1].trim();
        const remainder = (match[2] || "").trim();
        course = remainder;
      } else {
        course = splitted[0];
      }
    }

    return { courseDates, course, location };
  }

  // 1) Fetch Accounts on Mount
  useEffect(() => {
    axios
      .get("/api/salesforce")
      .then((res) => {
        if (res.data.success) {
          if (res.data.account) {
            setAccounts([res.data.account]);
          } else if (res.data.accounts) {
            setAccounts(res.data.accounts);
          } else {
            setAccounts([]);
          }
        } else {
          setError(res.data.message || "Error fetching accounts");
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  // 2) Handle Account Selection
  const handleSelect = (accountId) => {
    const account = accounts.find((a) => a.Id === accountId);
    setSelectedAccount(account);
  };

  // 3) Fetch Batches whenever selectedAccount changes
  useEffect(() => {
    if (!selectedAccount) return;

    axios
      .get(`/api/courseQuery?accountId=${selectedAccount.Id}`)
      .then((res) => {
        if (res.data.success) {
          if (res.data.records.length > 0) {
            const accountRecord = res.data.records[0];
            const subRecords = accountRecord.Enrolments ?? [];
            setBatches(subRecords);
          } else {
            setBatches([]);
          }
        } else {
          setError(res.data.message || "Error fetching batch info");
          setBatches([]);
        }
      })
      .catch((err) => {
        setError(err.message);
        setBatches([]);
      });
  }, [selectedAccount]);

  return (
    <Layout>
      {/* A container to give more breathing room */}
      <div className="container mx-auto py-10 px-6">
        <h1 className="text-3xl font-semibold mb-6">Accounts</h1>

        {/* Display any error message */}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="flex space-x-8">
          {/* LEFT COLUMN: selected account + course batches */}
          <div className="flex-1">
            {selectedAccount ? (
              <div className="bg-white rounded-lg shadow p-6 space-y-4">
                <h2 className="text-xl font-bold">{selectedAccount.Name}</h2>

                {batches.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mt-4 mb-4">
                      Related Course Batches
                    </h3>

                    {batches.map((enr) => {
                      const { courseDates, course, location } = parseCourseName(
                        enr.CourseName
                      );
                      const hasPassed = enr.DaysUntilStart < 0;

                      return (
                        <div
                          key={enr.Id}
                          className="mb-4 p-4 border border-gray-300 rounded-md"
                        >
                          {/* Course Name */}
                          <p className="font-bold">{course || "Untitled Course"}</p>

                          {/* Dates */}
                          <p className="text-gray-700">{courseDates}</p>

                          {/* Location */}
                          <p className="text-gray-700">{location}</p>

                          {/* Days Until or Passed */}
                          {hasPassed ? (
                            <p className="text-sm text-red-600 mt-2">
                              Course has passed
                            </p>
                          ) : (
                            <p className="text-sm text-gray-800 mt-2">
                              Days Until: {enr.DaysUntilStart}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-700">
                    No course batches found for this account.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-700">
                Please select an account to view details.
              </p>
            )}
          </div>

          {/* RIGHT COLUMN: list of accounts */}
          <div className="w-64">
            {accounts.length === 0 && !error && (
              <p className="text-gray-700">Loading or no accounts found...</p>
            )}

            {accounts.map((acc) => (
              <div
                key={acc.Id}
                className={`mb-4 bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                  selectedAccount?.Id === acc.Id
                    ? "border-2 border-blue-500"
                    : "border border-gray-300"
                }`}
                onClick={() => handleSelect(acc.Id)}
              >
                <h2 className="text-lg font-medium">{acc.Name}</h2>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}