"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppContext } from "../context/appcontext";

/** Helper #1: parse a course name in the format:
 *   "May 24-25 Standard First Aid with CPR-C (SFA) - TMU"
 */
function parseCourseName(fullName = "") {
  let splitted = fullName.split(" - ");
  let location = "";
  let courseDates = "";
  let course = fullName;
  if (splitted.length >= 3) {
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

/** Helper #2: parse a string like "April 12-13 Bronze Harbord"
 * returning { date, location }, used for certain combos
 */
function parseBronzeClassroom(classroomString = "") {
  const parts = classroomString.split(" ");
  if (parts.length >= 4) {
    const datePart = parts.slice(0, 2).join(" ");
    const locationPart = parts[parts.length - 1];
    return { date: datePart, location: locationPart };
  }
  return { date: classroomString, location: "" };
}

/** Helper #3: get the policy strings for refund/reschedule
 * based on daysUntilStart + the given policy object
 */
function getPolicyForCourse(daysUntilStart, policy) {
  if (!policy) {
    return { refund: "", reschedule: "" };
  }
  const { refundPolicy, reschedulePolicy } = policy;
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

/** Helper #4: format days into a user-friendly string */
function formatDays(days) {
  const weeks = Math.floor(days / 7);
  const remainder = days % 7;
  if (weeks > 0 && remainder > 0) {
    return `Starts in ${weeks} weeks, ${remainder} days`;
  } else if (weeks > 0) {
    return `Starts in ${weeks} weeks`;
  } else {
    return `Starts in ${days} days`;
  }
}

export default function DashboardPage() {
  const router = useRouter();

  // Basic local states for accounts + selection
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);

  // Batches/courses, policy, errors, session expiry
  const [batches, setBatches] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  // For multi-course operations (reschedule, etc.)
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);

  /** 1) Fetch the accounts on mount */
  useEffect(() => {
    axios
      .get("/api/salesforce")
      .then((res) => {
        if (res.data.success) {
          if (res.data.account) {
            setAccounts([res.data.account]);
          } else if (res.data.accounts) {
            setAccounts(res.data.accounts);
          }
        } else {
          setError(res.data.message || "Error fetching accounts");
        }
      })
      .catch((err) => setError(err.message));
  }, []);

  /** 2) If we want the policy info */
  useEffect(() => {
    axios
      .get("/api/refund-policy")
      .then((res) => {
        if (res.data.success) {
          setPolicy(res.data.policy);
        } else {
          console.error("Error fetching policy:", res.data.message);
        }
      })
      .catch((err) => console.error("Error fetching policy:", err.message));
  }, []);

  /** 3) On select an account, setSelectedAccount */
  function handleSelect(accountId) {
    const found = accounts.find((a) => a.Id === accountId);
    setSelectedAccount(found || null);
  }

  /** 4) If the user picked an account, fetch its course enrollments */
  useEffect(() => {
    if (!selectedAccount) {
      setBatches([]);
      return;
    }
    axios
      .get(`/api/courseQuery?accountId=${selectedAccount.Id}`)
      .then((res) => {
        if (res.data.success) {
          if (res.data.records?.length > 0) {
            const record = res.data.records[0];
            setBatches(record.Enrolments || []);
          } else {
            setBatches([]);
            setError(res.data.message || "No course batches found");
          }
        } else {
          setError(res.data.message || "Error fetching batch info");
          setBatches([]);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setSessionExpired(true);
        } else {
          setError(err.message);
        }
        setBatches([]);
      });
  }, [selectedAccount]);

  /** 5) For toggling enrollment selection (reschedule, etc.) */
  function handleToggleEnrollment(id) {
    setSelectedEnrollments((prev) => {
      const existingIndex = prev.findIndex((obj) => obj.Id === id);
      if (existingIndex !== -1) {
        return prev.filter((obj) => obj.Id !== id);
      } else {
        return [...prev, { Id: id }];
      }
    });
  }

  /** 6) If you need a logout, define it here */
  function handleLogout() {
    // Example: remove cookie, redirect to login, etc.
    document.cookie = "userToken=; path=/; max-age=0;";
    router.push("/login");
  }

  // If there's a Bronze Cross standard enrollment
  const bronzeCrossEnrollment = batches.find(
    (en) =>
      !en.isCombo &&
      en.CourseName &&
      en.CourseName.includes("Bronze Cross")
  );

  return (
    <>
      {/** WAVE-SHAPE HEADER (includes Switch Accounts logic) */}
      <header className="header-wave-parent relative bg-blue-500 text-white overflow-hidden">
        <div
          className="my-header absolute inset-0 p-6 flex items-center justify-between"
          style={{ zIndex: 10 }}
        >
          {/* LEFT: portal title + selected account’s name */}
          <div>
            <h1 className="text-lg font-bold">Student Portal</h1>
            {selectedAccount && (
              <p className="text-lg font-semibold">{selectedAccount.Name}</p>
            )}
          </div>

          {/* RIGHT: Switch Accounts button if multiple accounts exist */}
          {accounts.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center space-x-2 text-blue-100 hover:text-blue-300 border border-blue-100 px-3 py-2 rounded"
                style={{ zIndex: 10 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.121 17.804A9 9 0 1119 8.999m-2.1 5.1A5 5 0 1012 7.999"
                  />
                </svg>
                <span>Switch Accounts</span>
              </button>

            </div>
          )}
        </div>

        {/* wave shape itself */}
        <svg
          className="relative block h-[90px] w-full"
          preserveAspectRatio="none"
          viewBox="0 0 1200 120"
        >
          <path
            d="M985.66 40.99c-49.94 2.19-99.88 9.21-149.82 16.12C711 65.55 661 78.1 610.96 83.66 530 92 449 86.32 368 83.29c-49.39-1.72-98.88-1.6-148.23 1.33-52.23 3.14-104.37 8.78-156.58 14.14-2.88.29-52.07 5.75-52.19 7.85 0 .56 1200 0 1200 0v-24.7c-52-3.89-104-7.78-156-11.57z"
            fill="white"
          />
        </svg>
      </header>
      
      {showAccountDropdown && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          style={{ zIndex: 999 }}
          onClick={(e) => {
            // If the click target is the backdrop itself, close the dropdown.
            if (e.target === e.currentTarget) {
              setShowAccountDropdown(false);
            }
          }}
        >
          <div className="p-6 border rounded bg-white text-black w-96">
            <h2 className="text-xl font-bold mb-2 text-center">Accounts</h2>
            <div className="overflow-y-auto max-h-64">
              {accounts.map((acc) => (
                <div
                  key={acc.Id}
                  onClick={() => {
                    handleSelect(acc.Id);
                    setShowAccountDropdown(false);
                  }}
                  className="border rounded-lg p-2 mb-2 cursor-pointer hover:bg-blue-50"
                >
                  <h2 className="text-lg">{acc.Name}</h2>
                </div>
              ))}
            </div>
            <div className="mt-2 border-t pt-2 text-center">
              <button
                onClick={handleLogout}
                className="text-sm text-blue-500 hover:underline"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN DASHBOARD CONTENT */}
      <div className="p-6">
        {error && <p className="text-red-600 mb-4">{error}</p>}

        {selectedAccount ? (
          <h1 className="text-3xl font-semibold mb-6">
            {selectedAccount.Name}
          </h1>
        ) : (
          <h1 className="text-3xl font-semibold mb-6">
            Please select a student from above
          </h1>
        )}

        <div className="bg-white shadow p-6 rounded-lg">
          {selectedAccount ? (
            batches.length > 0 ? (
              <>
                {batches.map((enr) => {
                  let displayedCourseName = "";
                  let displayedDates = "";
                  let displayedLocation = "";
                  let displayedDaysUntilStart = enr.DaysUntilStart;

                  // For combo or standard
                  if (enr.isCombo) {
                    // Example: Bronze Combo
                    if (
                      enr.CourseName &&
                      enr.CourseName.includes("Bronze Combo")
                    ) {
                      displayedCourseName = "Bronze Combo";
                      // Maybe find a Bronze Cross enrollment
                      const bronzeCrossEnrollment = batches.find(
                        (course) =>
                          !course.isCombo &&
                          course.CourseName?.includes("Bronze Cross")
                      );
                      if (bronzeCrossEnrollment) {
                        const parsed = parseBronzeClassroom(
                          bronzeCrossEnrollment.Classroom || ""
                        );
                        displayedDates = parsed.date;
                        displayedLocation = parsed.location;
                        displayedDaysUntilStart =
                          bronzeCrossEnrollment.DaysUntilStart;
                      } else {
                        // fallback
                        const parsed = parseBronzeClassroom(
                          enr.Classroom || ""
                        );
                        displayedDates = parsed.date;
                        displayedLocation = parsed.location;
                      }
                    } else {
                      // other combos
                      const parsed = parseCourseName(
                        enr.Registration_Name__c || ""
                      );
                      displayedCourseName =
                        parsed.course || "Untitled Course";
                      displayedDates = parsed.courseDates;
                      displayedLocation = parsed.location;
                    }
                  } else {
                    // standard enrollment
                    const { courseDates, course, location } = parseCourseName(
                      enr.CourseName
                    );
                    displayedCourseName = course || "Untitled Course";
                    displayedDates = courseDates || enr.CourseDates;
                    displayedLocation = location || enr.Location;
                  }

                  // policy details
                  const policyData =
                    policy && getPolicyForCourse(displayedDaysUntilStart, policy);

                  return (
                    <div
                      key={enr.Id}
                      className="card mb-4 p-4 border border-gray-300 rounded-md"
                    >
                      <div className="card-header">
                        <span className="text-[#0070d9] font-bold text-lg">
                          {displayedCourseName}
                        </span>
                      </div>
                      <div className="card-body mt-3">
                        <div className="flex items-center justify-between flex-wrap gap-6 mt-2">
                          <div className="flex items-center gap-6">
                            <div className="flex items-center">
                              <span className="mr-2">📅</span>
                              {displayedDates}
                            </div>
                            <div className="flex items-center">
                              <span className="mr-2">📍</span>
                              {displayedLocation}
                            </div>
                            <div className="flex items-center">
                              <span className="mr-2">⏰</span>
                              {displayedDaysUntilStart < 0
                                ? "Course has passed"
                                : formatDays(displayedDaysUntilStart)}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs">
                            {displayedDaysUntilStart >
                            (policy?.daysBeforeReschedule ?? 0) ? (
                              <>
                                <a
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    // Toggle the enrollment in selectedEnrollments
                                    let newEnrollments = [...selectedEnrollments];
                                    const existingIndex = newEnrollments.findIndex(
                                      (obj) => obj.Id === enr.Id
                                    );
                                    if (existingIndex !== -1) {
                                      newEnrollments = newEnrollments.filter(
                                        (obj) => obj.Id !== enr.Id
                                      );
                                    } else {
                                      newEnrollments.push({ Id: enr.Id });
                                    }
                                    setSelectedEnrollments(newEnrollments);

                                    const courseName =
                                      displayedCourseName ||
                                      enr.CourseName ||
                                      "Unknown course";

                                    router.push(
                                      `/reschedule?oldCourseName=${encodeURIComponent(
                                        courseName
                                      )}&oldCourseId=${
                                        enr.BatchId
                                      }&enrollmentId=${
                                        enr.Id
                                      }&enrollmentIds=${JSON.stringify(
                                        newEnrollments
                                      )}`
                                    );
                                  }}
                                  className="text-blue-500 underline"
                                >
                                  Reschedule ({policyData?.reschedule})
                                </a>
                                <a
                                  href="#"
                                  className="text-blue-500 underline"
                                >
                                  Refund ({policyData?.refund})
                                </a>
                              </>
                            ) : (
                              <>
                                <span className="text-blue-300 underline">
                                  Reschedule ({policyData?.reschedule})
                                </span>
                                <span className="text-blue-300 underline">
                                  Refund ({policyData?.refund})
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-gray-700">
                No course found for this student.
              </p>
            )
          ) : (
            <p className="text-gray-700">
              Please select a student to view past and upcoming courses.
            </p>
          )}
        </div>
      </div>

      {sessionExpired && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-md shadow-md">
            <p className="mb-4 text-lg text-center">
              Your session has expired. Please log in again.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Login Again
            </button>
          </div>
        </div>
      )}
    </>
  );
}