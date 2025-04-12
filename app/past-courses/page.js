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

export default function PastCoursesPage() {
  const router = useRouter();

  // Local state declarations
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [batches, setBatches] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [sessionExpired, setSessionExpired] = useState(false);

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

  /** 5) If you need a logout, define it here */
  function handleLogout() {
    // Example: remove cookie, redirect to login, etc.
    document.cookie = "userToken=; path=/; max-age=0;";
    router.push("/login");
  }

  console.log("PastCoursesPage state:", {
    accounts,
    selectedAccount,
    showAccountDropdown,
    error,
  });

  // Filter out only the past courses
  const pastCourses = batches.filter((enr) => {
    return enr.DaysUntilStart < 0;
  });

  return (
    <>
      <Header
        headerTagline="Past Courses for"
        selectedAccount={selectedAccount}
        accounts={accounts}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        handleSelect={handleSelect}
        handleLogout={handleLogout}
      />

      {/* MAIN CONTENT */}
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
            pastCourses.length > 0 ? (
              <>
                {pastCourses.map((enr) => {
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
                      // For combos, parse date/location if needed
                      const parsed = parseBronzeClassroom(
                        enr.Classroom || ""
                      );
                      displayedDates = parsed.date;
                      displayedLocation = parsed.location;
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
                              Course has passed
                            </div>
                          </div>
                          {/* For past courses, we no longer show reschedule/refund links */}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-gray-700">
                No past courses found.
              </p>
            )
          ) : (
            <p className="text-gray-700">
              Please select a student to view past courses.
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