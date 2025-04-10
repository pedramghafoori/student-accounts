"use client";

import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppContext } from "../context/appcontext";
import Header from "../../components/Header";

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
  
  // Local state declarations
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [batches, setBatches] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);
  
  // Destructure context values
  const { selectedAccount: globalAccount, updateGlobalSelectedAccount } = useContext(AppContext);
  
  useEffect(() => {
    // If there's no globalAccount, show the dropdown so the user can pick one
    if (!globalAccount) {
      setShowAccountDropdown(true);
    }
  }, [globalAccount]);
  
  // Effect to set local selectedAccount from context if not already set
  useEffect(() => {
    if (!selectedAccount && globalAccount) {
      setSelectedAccount(globalAccount);
    }
  }, [globalAccount, selectedAccount]);

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
    updateGlobalSelectedAccount(found || null);
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
      <Header
        headerTagline="Courses for"     //  <--- dynamic tagline
        selectedAccount={selectedAccount}
        accounts={accounts}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        handleSelect={handleSelect}
        handleLogout={handleLogout}
      />
      {/** WAVE-SHAPE HEADER (includes Switch Accounts logic) */}
      <header className="header-wave-parent relative bg-blue-500 text-white overflow-hidden">
        <div
          className="my-header absolute inset-0 p-6 flex items-center justify-between"
          style={{ zIndex: 10 }}
        >
          {/* LEFT: portal title + selected account’s name */}
          <div>
            <h1 className="text-lg font-thin">Student</h1>
            {selectedAccount && (
            <p className="text-4xl font-bold">{selectedAccount.Name}</p>
            )}
          </div>

          {/* RIGHT: Switch Accounts button if multiple accounts exist */}
          {accounts.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                className="flex items-center px-3 py-2 rounded"
                style={{ zIndex: 10 }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8 text-white fill-current"
                  shapeRendering="geometricPrecision"
                  textRendering="geometricPrecision"
                  imageRendering="optimizeQuality"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  viewBox="0 0 512 315.77">
                <path
                  fillRule="nonzero"
                  d="M205.68 177.81h76.12c-4.7 4.48-9.38 9.05-13.97 13.69l-1.73 1.76h-60.42c-4.7 0-8.98 1.93-12.08 5.03-3.11 3.11-5.03 7.39-5.03 12.09v72.81c0 4.55 1.79 8.69 4.7 11.77l.33.31c3.11 3.11 7.39 5.04 12.08 5.04h13.35v.03h44.12l.02-.03h43.15c4.69 0 8.97-1.93 12.08-5.03 3.1-3.11 5.03-7.39 5.03-12.09V218.7c4.76-5.64 9.56-11.22 14.36-16.72.72 2.68 1.1 5.5 1.1 8.4v72.81c0 8.93-3.67 17.07-9.57 22.97l-.03.03c-5.91 5.9-14.05 9.58-22.97 9.58H205.68c-8.95 0-17.1-3.67-23.01-9.58l-.43-.47c-5.64-5.86-9.13-13.81-9.13-22.53v-72.81c0-8.97 3.66-17.12 9.56-23.01 5.9-5.9 14.04-9.56 23.01-9.56zM45.12 77.77c-2.81-4.47-8.07-10.54-8.07-15.78 0-2.96 2.33-6.82 5.67-7.68-.27-4.43-.44-8.93-.44-13.38 0-2.63.05-5.29.15-7.9.14-1.65.45-3.29.89-4.88 2.05-6.7 6.53-12.39 12.55-15.96 2.14-1.34 4.45-2.39 6.82-3.25C67.01 7.36 64.92.1 69.65.01c11.05-.29 29.23 9.83 36.32 17.5a28.07 28.07 0 0 1 7.24 18.18l-.45 19.36c1.97.48 4.16 2.01 4.65 3.98 1.51 6.11-4.83 13.72-7.78 18.58-1.71 2.82-6.47 9.63-9.75 14.3-2.18 3.1-4.41 4.1-2.43 7.06 16.13 22.17 56.98 6.33 56.98 50.42H0c0-44.12 40.86-28.25 56.98-50.42 2.17-3.19.36-3.58-2.11-7.13-3.62-5.22-9.04-12.95-9.75-14.07zm357.57 0c-2.81-4.47-8.07-10.54-8.07-15.78 0-2.96 2.33-6.82 5.67-7.68-.27-4.43-.44-8.93-.44-13.38 0-2.63.05-5.29.15-7.9.14-1.65.45-3.29.89-4.88 2.05-6.7 6.53-12.39 12.56-15.96 2.13-1.34 4.44-2.39 6.82-3.25 4.31-1.58 2.22-8.84 6.95-8.93 11.06-.29 29.23 9.83 36.32 17.5a28.019 28.019 0 0 1 7.24 18.18l-.45 19.36c1.97.48 4.17 2.01 4.65 3.98 1.51 6.11-4.83 13.72-7.78 18.58-1.71 2.82-6.47 9.63-9.75 14.3-2.18 3.1-4.41 4.1-2.43 7.06 16.13 22.17 56.98 6.33 56.98 50.42H357.57c0-44.12 40.87-28.25 56.98-50.42 2.17-3.19.36-3.58-2.11-7.13-3.62-5.22-9.04-12.95-9.75-14.07zm-178.79 0c-2.8-4.47-8.07-10.54-8.07-15.78 0-2.96 2.34-6.82 5.67-7.68-.26-4.43-.43-8.93-.43-13.38 0-2.63.05-5.29.14-7.9.15-1.65.45-3.29.89-4.88 2.05-6.7 6.54-12.39 12.56-15.96 2.14-1.34 4.45-2.39 6.82-3.25 4.31-1.58 2.22-8.84 6.95-8.93 11.06-.29 29.23 9.83 36.32 17.5A28.03 28.03 0 0 1 292 35.69l-.45 19.36c1.97.48 4.16 2.01 4.65 3.98 1.51 6.11-4.83 13.72-7.78 18.58-1.72 2.82-6.47 9.63-9.76 14.3-2.18 3.1-4.4 4.1-2.43 7.06 16.13 22.17 56.98 6.33 56.98 50.42H178.79c0-44.12 40.86-28.25 56.98-50.42 2.16-3.19.36-3.58-2.11-7.13-3.62-5.22-9.05-12.95-9.76-14.07zM36.14 177.81h82.14c8.94 0 17.08 3.67 22.99 9.58 5.92 5.89 9.59 14.04 9.59 22.99v72.81c0 8.95-3.68 17.09-9.59 23l-.47.43c-5.88 5.65-13.83 9.15-22.52 9.15H36.14c-8.91 0-17.07-3.68-22.98-9.59-5.92-5.88-9.59-14.03-9.59-22.99v-72.81c0-8.97 3.66-17.12 9.56-23.01 5.9-5.9 14.05-9.56 23.01-9.56zm82.14 15.45H36.14c-4.7 0-8.98 1.93-12.08 5.03-3.1 3.11-5.03 7.39-5.03 12.09v72.81c0 4.69 1.94 8.97 5.04 12.07v.03c3.09 3.1 7.37 5.02 12.07 5.02h82.14c4.54 0 8.68-1.8 11.75-4.71l.32-.34c3.11-3.11 5.05-7.39 5.05-12.07v-72.81c0-4.69-1.94-8.97-5.05-12.08v-.03a17.053 17.053 0 0 0-12.07-5.01zm275.44-15.45h82.14c8.94 0 17.07 3.67 22.98 9.58 5.92 5.89 9.59 14.04 9.59 22.99v72.81c0 8.95-3.68 17.09-9.58 23l-.48.43c-5.87 5.65-13.83 9.15-22.51 9.15h-82.14c-8.93 0-17.07-3.67-22.98-9.58h-.03c-5.89-5.89-9.57-14.04-9.57-23v-72.81c0-8.97 3.67-17.12 9.57-23.01l.47-.44c5.86-5.64 13.81-9.12 22.54-9.12zm82.14 15.45h-82.14c-4.55 0-8.7 1.8-11.78 4.71l-.31.32c-3.1 3.11-5.03 7.39-5.03 12.09v72.81c0 4.69 1.94 8.97 5.04 12.07 3.1 3.12 7.38 5.05 12.08 5.05h82.14c4.53 0 8.68-1.8 11.74-4.71l.32-.34c3.11-3.11 5.05-7.39 5.05-12.07v-72.81c0-4.69-1.93-8.97-5.04-12.08v-.03c-3.09-3.08-7.36-5.01-12.07-5.01zm-241.65 34.18c7.49 4.31 12.37 7.9 18.18 14.31 15.07-24.26 32.08-38.35 53.35-57.43l2.08-.8h23.28c-31.21 34.66-54.41 62.34-77.73 104.13-14.01-23.62-23.45-38.83-43.82-54.64l24.66-5.57z"
                />
              </svg>
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