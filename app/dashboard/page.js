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
   * parseCourseName
   *
   * Handles various string formats, for example:
   *   1) "March 29 - April 6 National Lifeguard - Pool - TMU"
   *      -> multiple dashes (>=3)
   *   2) "May 24-25 Standard First Aid with CPR-C (SFA) - TMU"
   *      -> single dash (== 2 parts)
   *
   * Returns:
   *   { courseDates, course, location }
   */
  function parseCourseName(fullName = "") {
    // Split by " - "
    let splitted = fullName.split(" - ");
    let location = "";
    let courseDates = "";
    let course = fullName; // fallback if parse fails

    // 1) If there are 3+ parts => multi-dash scenario
    if (splitted.length >= 3) {
      // The final piece is the location
      location = splitted[splitted.length - 1];
      splitted.pop(); // remove location from the array

      // Now splitted might be ["March 29", "April 6 National Lifeguard", "Pool"]
      const first = splitted[0] || "";
      const second = splitted[1] || "";

      let secondParts = second.split(" ");
      if (secondParts.length >= 2) {
        // e.g. "March 29 - April 6"
        courseDates = first + " - " + secondParts[0] + " " + secondParts[1];

        // remainderCourse => e.g. "National Lifeguard"
        const remainderCourse = secondParts.slice(2).join(" ");

        // If we had exactly 3 items, splitted[2] might be "Pool"
        if (splitted.length === 3) {
          // Combine remainderCourse + " - " + splitted[2]
          course = remainderCourse + (splitted[2] ? " - " + splitted[2] : "");
        } else {
          course = remainderCourse;
        }
      } else {
        // fallback
        courseDates = first + " - " + second;
      }

    // 2) If exactly 2 parts => single dash scenario
    } else if (splitted.length === 2) {
      // e.g. ["May 24-25 Standard First Aid with CPR-C (SFA)", "TMU"]
      location = splitted[1];

      // Regex to capture leading "Month day-day"
      const re = /^([A-Za-z]+\s+\d+-\d+)(\s+.*)?$/;
      const match = splitted[0].match(re);
      if (match) {
        // group1 => e.g. "May 24-25"
        // group2 => e.g. " Standard First Aid with CPR-C (SFA)"
        courseDates = match[1].trim();
        const remainder = (match[2] || "").trim();
        course = remainder; // e.g. "Standard First Aid with CPR-C (SFA)"
      } else {
        // fallback if regex doesn't match
        course = splitted[0];
      }
    }

    return { courseDates, course, location };
  }

  /******************************************************
   * 1) Fetch Accounts On Mount
   ******************************************************/
  useEffect(() => {
    axios
      .get("/api/salesforce")
      .then((res) => {
        if (res.data.success) {
          if (res.data.account) {
            // If single 'account' is returned, wrap it in an array
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

  /******************************************************
   * 2) Handle Account Selection
   ******************************************************/
  const handleSelect = (accountId) => {
    console.log("[handleSelect] User clicked on accountId:", accountId);
    const account = accounts.find((a) => a.Id === accountId);
    console.log("[handleSelect] Found account:", account);
    setSelectedAccount(account);
    console.log("[handleSelect] setSelectedAccount to:", account);
  };

  /******************************************************
   * 3) When selectedAccount changes, fetch its Batches
   ******************************************************/
  useEffect(() => {
    if (!selectedAccount) return;

    console.log(
      "[useEffect] selectedAccount: ID =",
      selectedAccount.Id,
      "Name =",
      selectedAccount.Name
    );

    axios
      .get(`/api/courseQuery?accountId=${selectedAccount.Id}`)
      .then((res) => {
        console.log("courseQuery response:", res.data);
        if (res.data.success) {
          console.log("Records from server:", res.data.records);
          if (res.data.records.length > 0) {
            // We assume you want the first returned account
            const accountRecord = res.data.records[0];
            // Use the 'Enrolments' array from the flattened JSON
            const subRecords = accountRecord.Enrolments
              ? accountRecord.Enrolments
              : [];

            console.log("[courseQuery] subRecords array extracted:", subRecords);
            setBatches(subRecords);
          } else {
            console.log("[courseQuery] No records => setBatches([])");
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

  console.log("[render] selectedAccount:", selectedAccount);
  console.log("[render] batches:", batches);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-semibold mb-6">Accounts</h1>

          {/* Show any errors */}
          {error && <p className="text-red-600 mb-4">{error}</p>}

          <div className="flex space-x-4">
            {/* LEFT COLUMN: Account details + Batches */}
            <div className="w-2/3">
              {selectedAccount ? (
                <div className="bg-white rounded-lg shadow p-6 space-y-4">
                  {/* Show the selected Account Name */}
                  <h2 className="text-xl font-bold">{selectedAccount.Name}</h2>

                  {/* Show the Batches (i.e. subRecords) */}
                  {batches.length > 0 ? (
                    <div>
                      <h3 className="font-semibold mt-4 mb-4">
                        Related Course Batches
                      </h3>

                      {batches.map((enr) => {
                        const { courseDates, course, location } =
                          parseCourseName(enr.CourseName);

                        const hasPassed = enr.DaysUntilStart < 0;

                        return (
                          <div
                            key={enr.Id}
                            className="bg-white shadow p-4 mb-4"
                          >
                            {/* Display the info */}
                            <p>
                              <strong>Course Dates:</strong> {courseDates}
                            </p>
                            <p>
                              <strong>Course:</strong> {course}
                            </p>
                            <p>
                              <strong>Location:</strong> {location}
                            </p>

                            {hasPassed ? (
                              <p>Course has passed</p>
                            ) : (
                              <p>
                                <strong>Days Until:</strong>{" "}
                                {enr.DaysUntilStart}
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

            {/* RIGHT COLUMN: Account cards */}
            <div className="w-1/3">
              {accounts.length === 0 && !error && (
                <p className="text-gray-700">Loading or no accounts found...</p>
              )}

              {accounts.map((acc) => (
                <div
                  key={acc.Id}
                  className={`mb-4 bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedAccount?.Id === acc.Id
                      ? "border-2 border-blue-500"
                      : ""
                  }`}
                  onClick={() => handleSelect(acc.Id)}
                >
                  <h2 className="text-lg font-medium">{acc.Name}</h2>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}