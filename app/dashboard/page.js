"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";

// Helper: Parse a classroom string in the format "April 12-13 Bronze Harbord"
// into an object with date and location.
function parseBronzeClassroom(classroomString = "") {
  const parts = classroomString.split(" ");
  if (parts.length >= 4) {
    // Assume the first two parts form the date and the last part is the location.
    const datePart = parts.slice(0, 2).join(" "); // e.g., "April 12-13"
    const locationPart = parts[parts.length - 1];   // e.g., "Harbord"
    return { date: datePart, location: locationPart };
  }
  return { date: classroomString, location: "" };
}

/**
 * Parses a course name in the format:
 * "May 24-25 Standard First Aid with CPR-C (SFA) - TMU"
 * Returns an object with courseDates, course, and location.
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

export default function DashboardPage() {
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [batches, setBatches] = useState([]);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState("");
  const [selectedEnrollments, setSelectedEnrollments] = useState([]);

  const router = useRouter();

  function handleToggleEnrollment(id) {
    console.log("Toggling enrollment", id);
    setSelectedEnrollments((prev) => {
      const existingIndex = prev.findIndex((obj) => obj.Id === id);
      if (existingIndex !== -1) {
        return prev.filter((obj) => obj.Id !== id);
      } else {
        return [...prev, { Id: id }];
      }
    });
  }

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
    fetchPolicy();
    // Refresh the policy every 5 minutes
    const intervalId = setInterval(fetchPolicy, 300000);
    return () => clearInterval(intervalId);
  }, []);

  const handleSelect = (accountId) => {
    const account = accounts.find((a) => a.Id === accountId);
    setSelectedAccount(account);
  };

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

  // Find the Bronze Cross standard enrollment record (if available)
  const bronzeCrossEnrollment = batches.find(
    (en) =>
      !en.isCombo &&
      en.CourseName &&
      en.CourseName.includes("Bronze Cross")
  );

  return (
    <Layout accounts={accounts} onSelectAccount={handleSelect}>
      <div className="p-6">
        {selectedAccount ? (
          <h1 className="text-3xl font-semibold mb-6">
            {selectedAccount.Name}
          </h1>
        ) : (
          <h1 className="text-3xl font-semibold mb-6">
            Please select a student from the left panel
          </h1>
        )}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="flex">
          <div className="flex-1 bg-white shadow p-6 rounded-lg">
            {selectedAccount ? (
              <div>
                {batches.length > 0 ? (
                  <div>
                    {batches.map((enr) => {
                      console.log("Debug each enrollment:", enr);

                      let displayedCourseName = "";
                      let displayedDates = "";
                      let displayedLocation = "";
                      let displayedDaysUntilStart = enr.DaysUntilStart;

                      if (enr.isCombo) {
                        // For combo courses:
                        if (
                          enr.CourseName &&
                          enr.CourseName.includes("Bronze Combo")
                        ) {
                          // Set the course name to default "Bronze Combo"
                          displayedCourseName = "Bronze Combo";
                          if (bronzeCrossEnrollment) {
                            // Use the Bronze Cross enrollment's Classroom field.
                            const parsedClassroom = parseBronzeClassroom(
                              bronzeCrossEnrollment.Classroom || ""
                            );
                            displayedDates = parsedClassroom.date;
                            displayedLocation = parsedClassroom.location;
                            displayedDaysUntilStart = bronzeCrossEnrollment.DaysUntilStart;
                          } else {
                            // Fallback: Use the combo record's Classroom field directly.
                            const parsedClassroom = parseBronzeClassroom(
                              enr.Classroom || ""
                            );
                            displayedDates = parsedClassroom.date;
                            displayedLocation = parsedClassroom.location;
                          }
                        } else {
                          // For other combo enrollments, parse using Registration_Name__c
                          const parsed = parseCourseName(enr.Registration_Name__c || "");
                          displayedCourseName = parsed.course || "Untitled Course";
                          displayedDates = parsed.courseDates;
                          displayedLocation = parsed.location;
                        }
                      } else {
                        // For standard enrollments, use parseCourseName on CourseName
                        const { courseDates, course, location } = parseCourseName(enr.CourseName);
                        displayedCourseName = course || "Untitled Course";
                        displayedDates = courseDates || enr.CourseDates;
                        displayedLocation = location || enr.Location;
                      }

                      const policyData = policy && getPolicyForCourse(displayedDaysUntilStart, policy);

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
                                  <span className="mr-2">📍 </span>
                                  {displayedLocation}
                                </div>
                                <div className="flex items-center">
                                  <span className="mr-2">⏰ </span>
                                  {displayedDaysUntilStart < 0 ? (
                                    "Course has passed"
                                  ) : (
                                    <span>{formatDays(displayedDaysUntilStart)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                {displayedDaysUntilStart >
                                (policy && policy.daysBeforeReschedule) ? (
                                  <>
                                    <a
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        console.log("Manually building a new enrollments array for:", enr.Id);
                                        let newEnrollments = [...selectedEnrollments];
                                        const existingIndex = newEnrollments.findIndex((obj) => obj.Id === enr.Id);
                                        if (existingIndex !== -1) {
                                          newEnrollments = newEnrollments.filter((obj) => obj.Id !== enr.Id);
                                        } else {
                                          newEnrollments.push({ Id: enr.Id });
                                        }
                                        setSelectedEnrollments(newEnrollments);

                                        const courseName = displayedCourseName || enr.CourseName || "Unknown course";
                                        console.log("Navigating to reschedule with updated enrollments:", {
                                          oldCourseName: courseName,
                                          oldCourseId: enr.BatchId,
                                          newEnrollments,
                                        });
                                        router.push(
                                          `/reschedule?oldCourseName=${encodeURIComponent(courseName)}&oldCourseId=${enr.BatchId}&enrollmentId=${enr.Id}&enrollmentIds=${JSON.stringify(newEnrollments)}`
                                        );
                                      }}
                                      className="text-blue-500 underline"
                                    >
                                      Reschedule ({policyData?.reschedule})
                                    </a>
                                    <a href="#" className="text-blue-500 underline">
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
    </Layout>
  );
}