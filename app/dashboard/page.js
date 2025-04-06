"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");

  // Helper to parse an example string like:
  // "March 29 - April 6 National Lifeguard - Pool - TMU"
  // into:
  //   courseDates => "March 29 - April 6"
  //   course => "National Lifeguard - Pool"
  //   location => "TMU"
  function parseCourseName(fullName = "") {
    // Split by " - ":
    // e.g. ["March 29", "April 6 National Lifeguard", "Pool", "TMU"]
    let splitted = fullName.split(" - ");

    let location = "";
    let courseDates = "";
    let course = fullName; // fallback if parse fails

    if (splitted.length >= 3) {
      // location is the last item
      location = splitted[splitted.length - 1];
      // remove it
      splitted.pop();

      // now splitted might be ["March 29", "April 6 National Lifeguard", "Pool"]
      // first 2 items might contain the date portion
      const first = splitted[0] || ""; // e.g. "March 29"
      const second = splitted[1] || ""; // e.g. "April 6 National Lifeguard"

      // Attempt to parse the second chunk further:
      let secondParts = second.split(" "); // e.g. ["April","6","National","Lifeguard"]
      if (secondParts.length >= 2) {
        courseDates = first + " - " + secondParts[0] + " " + secondParts[1];
        // remainder => secondParts.slice(2).join(" ") => "National Lifeguard"
        const remainderCourse = secondParts.slice(2).join(" "); // e.g. "National Lifeguard"

        // If splitted has a 3rd item => e.g. "Pool", we attach it
        if (splitted.length === 3) {
          // Combine remainderCourse + " - " + splitted[2]
          // e.g. "National Lifeguard" + " - " + "Pool" => "National Lifeguard - Pool"
          course = remainderCourse + (splitted[2] ? " - " + splitted[2] : "");
        } else {
          course = remainderCourse;
        }
      } else {
        // fallback
        courseDates = first + " - " + second;
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
          // If single 'account' is returned, wrap it in an array
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
                      <h3 className="font-semibold mt-4 mb-4">Related Course Batches</h3>

                      {batches.map((enr) => {
                        // 1) parse the name
                        const { courseDates, course, location } = parseCourseName(enr.CourseName);
                        // 2) Decide if course has passed or not
                        const hasPassed = enr.DaysUntilStart < 0;

                        return (
                          /* 3) Instead of <li>, create a separate card for each course */
                          <div key={enr.Id} className="bg-white shadow p-4 mb-4">
                            {/* Display the info */}
                            {/* - The first chunk is "courseDates" => e.g. "March 29 - April 6" */}
                            <p>
                              <strong>Course Dates:</strong> {courseDates}
                            </p>

                            {/* - The second chunk is "course", e.g. "National Lifeguard - Pool" */}
                            <p>
                              <strong>Course:</strong> {course}
                            </p>

                            {/* - The location is the final chunk, e.g. "TMU" */}
                            <p>
                              <strong>Location:</strong> {location}
                            </p>

                            {/* If course is in the future, show Days Until. Else show "Course has passed" */}
                            {hasPassed ? (
                              <p>Course has passed</p>
                            ) : (
                              <p>
                                <strong>Days Until:</strong> {enr.DaysUntilStart}
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
              {/* Show loading if no accounts and no error */}
              {accounts.length === 0 && !error && (
                <p className="text-gray-700">Loading or no accounts found...</p>
              )}

              {accounts.map((acc) => (
                <div
                  key={acc.Id}
                  className={`mb-4 bg-white rounded-lg shadow p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
                    selectedAccount?.Id === acc.Id ? "border-2 border-blue-500" : ""
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