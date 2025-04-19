"use client";

import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { AppContext } from "../context/appcontext";
import Header from "../../components/Header";
import { motion, AnimatePresence } from "framer-motion";
import "./courses.css";

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

export default function CoursesPage() {
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
  const [tab, setTab] = useState("active"); // Default to active tab
  
  // Destructure context values
  const { selectedAccount: globalAccount, updateGlobalSelectedAccount } = useContext(AppContext);

  // Animation variants
  const pageTransition = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

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
    // First try to get the account from the session
    axios
      .get("/api/salesforce/account")
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
      .catch((err) => {
        console.error("Error fetching account:", err);
        setError(err.message);
      });
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
  
  console.log('DashboardPage state:', {
    accounts,
    selectedAccount,
    showAccountDropdown,
    error,
  });
  const upcomingCourses = batches.filter((enr) => enr.DaysUntilStart >= 0);
  const pastCourses = batches.filter((enr) => enr.DaysUntilStart < 0);

  // If there's a Bronze Cross standard enrollment
  const bronzeCrossEnrollment = batches.find(
    (en) =>
      !en.isCombo &&
      en.CourseName &&
      en.CourseName.includes("Bronze Cross")
  );

  // Function to determine the default tab based on courses
  const determineDefaultTab = (courses) => {
    console.log("[CoursesPage] Determining default tab");
    const now = new Date();
    
    const hasActiveCourses = courses.some(course => {
      const startDate = new Date(course.StartDateTime);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (course.Duration || 1)); // Assuming 1 day if no duration
      return startDate <= now && endDate >= now;
    });
    
    const hasUpcomingCourses = courses.some(course => {
      const startDate = new Date(course.StartDateTime);
      return startDate > now;
    });
    
    console.log("[CoursesPage] Course analysis:", {
      hasActiveCourses,
      hasUpcomingCourses,
      totalCourses: courses.length
    });

    if (hasActiveCourses) return "active";
    if (hasUpcomingCourses) return "upcoming";
    return "past";
  };

  // Effect to set the default tab when courses load
  useEffect(() => {
    if (batches.length > 0) {
      const defaultTab = determineDefaultTab(batches);
      console.log("[CoursesPage] Setting default tab to:", defaultTab);
      setTab(defaultTab);
    }
  }, [batches]);

  // Filter courses based on tab
  const filterCourses = () => {
    console.log("[CoursesPage] Filtering courses for tab:", tab);
    const now = new Date();
    
    return batches.filter(course => {
      const startDate = new Date(course.StartDateTime);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + (course.Duration || 1));
      
      switch (tab) {
        case "active":
          return startDate <= now && endDate >= now;
        case "upcoming":
          return startDate > now;
        case "past":
          return endDate < now;
        default:
          return false;
      }
    });
  };

  const filteredCourses = filterCourses();
  console.log("[CoursesPage] Filtered courses:", filteredCourses.length);

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageTransition}
      transition={{ duration: 0.3 }}
    >
      <Header
        headerTagline="Courses"
        selectedAccount={selectedAccount}
        accounts={accounts}
        showAccountDropdown={showAccountDropdown}
        setShowAccountDropdown={setShowAccountDropdown}
        handleSelect={handleSelect}
        handleLogout={handleLogout}
      />

      <div className="p-4">
        {error && <div className="text-red-600 mb-4">Error: {error}</div>}

        {/* Slim Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-lg p-1 text-sm font-medium">
            <button
              onClick={() => setTab("upcoming")}
              className={`px-4 py-1.5 rounded-lg transition-all duration-200 ${
                tab === "upcoming"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Future
            </button>
            <button
              onClick={() => setTab("active")}
              className={`px-4 py-1.5 rounded-lg transition-all duration-200 ${
                tab === "active"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setTab("past")}
              className={`px-4 py-1.5 rounded-lg transition-all duration-200 ${
                tab === "past"
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Past
            </button>
          </div>
        </div>

        {/* Course List with Animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 flex flex-col items-center"
          >
            {filteredCourses.map((enrollment) => {
              let displayedCourseName = "";
              let displayedDates = "";
              let displayedLocation = "";
              let displayedDaysUntilStart = enrollment.DaysUntilStart;

              // For combo or standard
              if (enrollment.isCombo) {
                // Example: Bronze Combo
                if (
                  enrollment.CourseName &&
                  enrollment.CourseName.includes("Bronze Combo")
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
                      enrollment.Classroom || ""
                    );
                    displayedDates = parsed.date;
                    displayedLocation = parsed.location;
                  }
                } else {
                  // other combos
                  const parsed = parseCourseName(
                    enrollment.Registration_Name__c || ""
                  );
                  displayedCourseName =
                    parsed.course || "Untitled Course";
                  displayedDates = parsed.courseDates;
                  displayedLocation = parsed.location;
                }
              } else {
                // standard enrollment
                const { courseDates, course, location } = parseCourseName(
                  enrollment.CourseName
                );
                displayedCourseName = course || "Untitled Course";
                displayedDates = courseDates || enrollment.CourseDates;
                displayedLocation = location || enrollment.Location;
              }

              // policy details
              const policyData =
                policy && getPolicyForCourse(displayedDaysUntilStart, policy);

              return (
                <div
                  key={enrollment.Id}
                  className="card mb-4 p-4 border border-gray-300 rounded-md bg-white shadow-sm w-full max-w-2xl"
                >
                  {/* Header Row: Title and Time */}
                  <div className="flex justify-between items-center mb-3">
                    {/* Course Title */}
                    <span className="text-[#0070d9] font-bold text-lg truncate mr-4">
                      {displayedCourseName}
                    </span>
                    {/* Time Info (Moved Up) */}
                    <div className="flex items-center text-sm text-gray-600 flex-shrink-0">
                      <span className="mr-1.5">⏰</span>
                      {displayedDaysUntilStart < 0
                        ? "Course has passed"
                        : formatDays(displayedDaysUntilStart)}
                    </div>
                  </div>

                  {/* Body Row: Date/Location and Actions */}
                  <div className="mt-2"> 
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      {/* Date & Location Group (Moved Down) */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <span className="mr-1.5">📅</span>
                          {displayedDates}
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1.5">📍</span>
                          {displayedLocation}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 text-xs">
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
                                  (obj) => obj.Id === enrollment.Id
                                );
                                if (existingIndex !== -1) {
                                  newEnrollments = newEnrollments.filter(
                                    (obj) => obj.Id !== enrollment.Id
                                  );
                                } else {
                                  newEnrollments.push({ Id: enrollment.Id });
                                }
                                setSelectedEnrollments(newEnrollments);

                                const courseName =
                                  displayedCourseName ||
                                  enrollment.CourseName ||
                                  "Unknown course";

                                router.push(
                                  `/reschedule?courseType=${encodeURIComponent(courseName)}&oldCourseName=${encodeURIComponent(courseName)}&oldCourseId=${encodeURIComponent(enrollment.BatchId)}&enrollmentId=${encodeURIComponent(enrollment.Id)}&enrollmentIds=${encodeURIComponent(JSON.stringify(newEnrollments))}&oldCourseDates=${encodeURIComponent(displayedDates || "")}&oldCourseLocation=${encodeURIComponent(displayedLocation)}&oldCourseStartDate=${encodeURIComponent(enrollment.StartDateTime || "")}`
                                );
                              }}
                              className="text-blue-500 underline"
                            >
                              Reschedule ({policyData?.reschedule})
                            </a>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(`/add-ons?enrollmentId=${enrollment.Id}`);
                              }}
                              className="text-blue-500 underline"
                            >
                              Add Course Material
                            </a>
                          </>
                        ) : (
                          <>
                            <span className="text-blue-300 underline">
                              Reschedule ({policyData?.reschedule})
                            </span>
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(`/add-ons?enrollmentId=${enrollment.Id}`);
                              }}
                              className="text-blue-500 underline"
                            >
                              Add Course Material
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>
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
    </motion.div>
  );
}