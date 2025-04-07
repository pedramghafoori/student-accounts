"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Layout from "@/components/Layout";

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

  /**
   * Example input: "May 24-25 Standard First Aid with CPR-C (SFA) - TMU"
   * Returns:
   *   {
   *     courseDates: "May 24-25",
   *     course: "Standard First Aid with CPR-C (SFA)",
   *     location: "TMU"
   *   }
   */
  function parseCourseName(fullName = "") {
    let splitted = fullName.split(" - ");
    let location = "";
    let courseDates = "";
    let course = fullName;

    if (splitted.length >= 3) {
      // e.g. ["May 24-25 Standard First Aid with CPR-C (SFA)", "TMU"]
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
      // e.g. ["May 24-25 Standard First Aid with CPR-C (SFA)", "TMU"]
      location = splitted[1];

      const re = /^([A-Za-z]+\s+\d+-\d+)(\s+.*)?$/;
      const match = splitted[0].match(re);
      if (match) {
        // match[1] = "May 24-25"
        // match[2] = " Standard First Aid with CPR-C (SFA)"
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

  return (
    <Layout accounts={accounts} onSelectAccount={handleSelect}>
      <div className="container mx-auto py-10 px-6">
        <h1 className="text-3xl font-semibold mb-6">{selectedAccount.Name}</h1>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <div className="flex">
          <div className="flex-1 ml-6 bg-white shadow p-6 rounded-lg">
            {selectedAccount ? (
              <div>
                
                {batches.length > 0 ? (
                  <div>
                   
                    {batches.map((enr) => {
                      console.log("Debug each enrollment:", enr);

                      const { courseDates, course, location } = parseCourseName(
                        enr.CourseName
                      );
                      const policyData =
                        policy &&
                        getPolicyForCourse(enr.DaysUntilStart, policy);

                      return (
                        <div
                          key={enr.Id}
                          className="card mb-4 p-4 border border-gray-300 rounded-md"
                        >
                          <div className="card-header">
                            {/* Course Title in bold + #0070d9 */}
                            <span className="text-[#0070d9] font-bold">
                              {course || "Untitled Course"}
                            </span>
                          </div>
                          <div className="card-body">
                            {/* Single row for date, location, days, and links */}
                            <div className="flex items-center justify-between flex-wrap gap-6 mt-2">
                              {/* Left side: Date/Location/Days */}
                              <div className="flex items-center gap-6">
                                {/* Course Dates */}
                                <div className="flex items-center">
                                  <span className="mr-2">📅</span>
                                  {courseDates || enr.CourseDates}
                                </div>
                                {/* Location */}
                                <div className="flex items-center">
                                  <span className="mr-2">📍 </span>
                                  {location || enr.Location}
                                </div>
                                {/* Days Until */}
                                <div className="flex items-center">
                                  <span className="mr-2">⏰ </span>
                                  {enr.DaysUntilStart < 0 ? (
                                    "Course has passed"
                                  ) : (
                                    <span>
                                      Days Until: {enr.DaysUntilStart}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right side: Reschedule/Refund links (smaller font) */}
                              <div className="flex items-center gap-4 text-xs">
                                {enr.DaysUntilStart >
                                (policy && policy.daysBeforeReschedule) ? (
                                  <>
                                    <a
                                      href="#"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        console.log(
                                          "Manually building a new enrollments array for:",
                                          enr.Id
                                        );

                                        let newEnrollments = [
                                          ...selectedEnrollments,
                                        ];
                                        const existingIndex =
                                          newEnrollments.findIndex(
                                            (obj) => obj.Id === enr.Id
                                          );
                                        if (existingIndex !== -1) {
                                          newEnrollments =
                                            newEnrollments.filter(
                                              (obj) => obj.Id !== enr.Id
                                            );
                                        } else {
                                          newEnrollments.push({ Id: enr.Id });
                                        }

                                        setSelectedEnrollments(newEnrollments);

                                        const courseName =
                                          course ||
                                          enr.CourseName ||
                                          "Unknown course";
                                        console.log(
                                          "Navigating to reschedule with updated enrollments:",
                                          {
                                            oldCourseName: courseName,
                                            oldCourseId: enr.BatchId,
                                            newEnrollments,
                                          }
                                        );

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