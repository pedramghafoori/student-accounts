"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import Layout from "@/components/Layout";
import RescheduleModal from "@/components/RescheduleModal"; // new modal component

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [batches, setBatches] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [courseTypeForReschedule, setCourseTypeForReschedule] = useState("");

  /**
   * parseCourseName
   *
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

    if (splitted.length >= 3) {
      // Multi-dash logic
      location = splitted[splitted.length - 1];
      splitted.pop();

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
    } else if (splitted.length === 2) {
      // Single-dash logic
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

  /**
   * getPolicyForCourse
   *
   * Given the number of days until the course starts and the policy object,
   * returns an object with the appropriate refund and reschedule messages.
   */
  function getPolicyForCourse(daysUntilStart, policy) {
    if (!policy) {
      return { refund: "", reschedule: "" };
    }
    const refundPolicy = policy.refundPolicy;
    const reschedulePolicy = policy.reschedulePolicy;
    if (daysUntilStart > 5) {
      return {
        refund: refundPolicy["More than 5 days1*"],
        reschedule: reschedulePolicy["More than 5 days1*"],
      };
    } else if (daysUntilStart <= 5 && daysUntilStart >= 3) {
      return {
        refund: refundPolicy["3-5 days1*"],
        reschedule: reschedulePolicy["3-5 days1*"],
      };
    } else if (daysUntilStart < 3 && daysUntilStart >= 0) {
      return {
        refund: refundPolicy["2 days or less1*"],
        reschedule: reschedulePolicy["2 days or less1*"],
      };
    } else {
      return {
        refund: refundPolicy["After course begins"],
        reschedule: reschedulePolicy["After course begins"],
      };
    }
  }

  /******************************************************
   * 1) Fetch Accounts on Mount
   ******************************************************/
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

  /******************************************************
   * 2) Dynamically Fetch Refund Policy (Poll every 5 minutes)
   ******************************************************/
  useEffect(() => {
    const fetchPolicy = () => {
      axios
        .get("/api/refund-policy")
        .then((res) => {
          console.log("Refund policy response:", res.data);
          if (res.data.success) {
            setPolicy(res.data.policy);
          } else {
            console.error("Error fetching policy:", res.data.message);
          }
        })
        .catch((err) =>
          console.error("Error fetching policy:", err.message)
        );
    };

    fetchPolicy(); // initial fetch
    const intervalId = setInterval(fetchPolicy, 300000); // 5 minutes
    return () => clearInterval(intervalId);
  }, []);

  /******************************************************
   * 3) Handle Account Selection
   ******************************************************/
  const handleSelect = (accountId) => {
    const account = accounts.find((a) => a.Id === accountId);
    setSelectedAccount(account);
  };

  /******************************************************
   * 4) Fetch Batches for Selected Account
   ******************************************************/
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
    <Layout accounts={accounts} onSelectAccount={handleSelect}>
      <div className="container mx-auto py-10 px-6">
        <h1 className="text-3xl font-semibold mb-6">Accounts</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="flex">
          {/* Main content area for the selected account’s courses */}
          <div className="flex-1 ml-6 bg-white shadow p-6 rounded-lg">
            {selectedAccount ? (
              <div>
                <h2 className="text-xl font-bold mb-4">
                  {selectedAccount.Name}
                </h2>
                {batches.length > 0 ? (
                  <div>
                    <h3 className="font-semibold mb-4">
                      Related Course Batches
                    </h3>
                    {batches.map((enr) => {
                      const { courseDates, course, location } =
                        parseCourseName(enr.CourseName);
                      const threshold =
                        (policy && policy.daysBeforeReschedule) || 2;
                      const hasPassed = enr.DaysUntilStart < 0;
                      console.log(
                        `Card ${enr.Id}: DaysUntilStart = ${enr.DaysUntilStart}, Policy Threshold = ${threshold}`
                      );
                      return (
                        <div
                          key={enr.Id}
                          className="card mb-4 p-4 border border-gray-300 rounded-md"
                        >
                          <div className="card-header">
                            <a href="#" className="card-title">
                              {course || "Untitled Course"}
                            </a>
                          </div>
                          <div className="card-body">
                            <div className="card-detail">
                              <span className="icon">📅</span> {courseDates}
                            </div>
                            <div className="card-detail">
                              <span className="icon">📍</span> {location}
                            </div>
                            <div className="card-detail">
                              <span className="icon">⏰</span>{" "}
                              {hasPassed ? (
                                "Course has passed"
                              ) : (
                                <strong>Days Until: {enr.DaysUntilStart}</strong>
                              )}
                            </div>
                          </div>
                          <div className="card-footer mt-4 flex flex-col items-end">
                            {enr.DaysUntilStart > threshold ? (
                              <>
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setCourseTypeForReschedule(course);
                                    setShowRescheduleModal(true);
                                  }}
                                  className="text-blue-500 underline mb-2"
                                >
                                  Reschedule (
                                  {policy?.reschedulePolicy &&
                                    getPolicyForCourse(
                                      enr.DaysUntilStart,
                                      policy
                                    ).reschedule}
                                  )
                                </a>
                                <a
                                  href="#"
                                  className="text-blue-500 underline"
                                >
                                  Refund (
                                  {policy?.refundPolicy &&
                                    getPolicyForCourse(
                                      enr.DaysUntilStart,
                                      policy
                                    ).refund}
                                  )
                                </a>
                              </>
                            ) : (
                              <>
                                <span className="text-blue-300 underline mb-2">
                                  Reschedule (
                                  {policy?.reschedulePolicy &&
                                    getPolicyForCourse(
                                      enr.DaysUntilStart,
                                      policy
                                    ).reschedule}
                                  )
                                </span>
                                <span className="text-blue-300 underline">
                                  Refund (
                                  {policy?.refundPolicy &&
                                    getPolicyForCourse(
                                      enr.DaysUntilStart,
                                      policy
                                    ).refund}
                                  )
                                </span>
                              </>
                            )}
                          </div>
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
        </div>
      </div>
      {showRescheduleModal && (
        <RescheduleModal
          courseType={courseTypeForReschedule}
          onClose={() => setShowRescheduleModal(false)}
          onSelectCourse={(selectedCourse) => {
            console.log("Selected new course:", selectedCourse);
            setShowRescheduleModal(false);
          }}
        />
      )}
    </Layout>
  );
}