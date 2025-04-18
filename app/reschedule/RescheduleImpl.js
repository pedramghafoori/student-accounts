"use client";

export const dynamic = "force-dynamic";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";
import Header from "../../components/Header";

function parseDateFromCourseName(fullName = "") {
  const match = fullName.match(/^([A-Za-z]+\s+\d{1,2}\s*-\s*(?:[A-Za-z]+\s+)?\d{1,2})/);
  if (match) {
    return match[1];
  }
  return fullName;
}

export function RescheduleImpl() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [futureCourses, setFutureCourses] = useState([]);
  const [selectedNewCourse, setSelectedNewCourse] = useState(null);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [rescheduleFee, setRescheduleFee] = useState("$50"); // example fee

  const router = useRouter();
  const searchParams = useSearchParams();
  const oldCourseName = searchParams.get("oldCourseName") || "";
  const oldCourseId = searchParams.get("oldCourseId");
  const enrollmentId = searchParams.get("enrollmentId");
  const oldCourseLocation = searchParams.get("oldCourseLocation");
  const oldCourseStartDate = searchParams.get("oldCourseStartDate");

  const enrollmentIdsParam = searchParams.get("enrollmentIds");
  let parsedEnrollmentIds = [];
  if (enrollmentIdsParam) {
    try {
      parsedEnrollmentIds = JSON.parse(enrollmentIdsParam);
      console.log("Parsed enrollment IDs:", parsedEnrollmentIds);
    } catch (err) {
      console.error("Failed to parse enrollmentIds:", err);
    }
  }

  useEffect(() => {
    if (!oldCourseName) {
      setError("Course type not provided in URL.");
      return;
    }
    async function fetchFutureCourses() {
      try {
        setLoading(true);
        setError("");
        console.log("Fetching future courses for:", oldCourseName);
        const res = await axios.get(
          `/api/futureCourses?courseType=${encodeURIComponent(oldCourseName)}`
        );
        console.log("Response data:", res.data);
        if (res.data.success) {
          setFutureCourses(res.data.courses);
        } else {
          setError(res.data.message || "Error fetching future courses");
        }
      } catch (err) {
        console.error("Error fetching future courses:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchFutureCourses();
  }, [oldCourseName]);

  const uniqueLocations = useMemo(() => {
    const locsSet = new Set();
    futureCourses.forEach((course) => {
      const locationName = course.Location__r?.Name || course.Location__c;
      if (locationName) {
        locsSet.add(locationName);
      }
    });
    return Array.from(locsSet).map((loc) => ({ id: loc, name: loc }));
  }, [futureCourses]);

  const filteredCourses = useMemo(() => {
    if (selectedLocations.length === 0) {
      return futureCourses;
    }
    return futureCourses.filter((course) => {
      const locationName = course.Location__r?.Name || course.Location__c;
      return selectedLocations.includes(locationName);
    });
  }, [futureCourses, selectedLocations]);

  function toggleLocation(location) {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((loc) => loc !== location)
        : [...prev, location]
    );
  }

  function handleSelectCourse(course) {
    if (selectedNewCourse && selectedNewCourse.Id === course.Id) {
      setSelectedNewCourse(null);
    } else {
      setSelectedNewCourse(course);
    }
  }

  function getDaysUntil(startDate) {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  async function handleConfirm() {
    const payload = {
      varOldEnrollmentId: enrollmentId,
      varNewCourseId: selectedNewCourse?.Id,
      varSelectedEnrollments: parsedEnrollmentIds,
      singleEnrollmentId: enrollmentId,
    };
    console.log("[ReschedulePage] handleConfirm payload:", payload);
    try {
      console.log("Sending reschedule request:", payload);
      await axios.post("/api/reschedule", payload);
      setStep(3);
    } catch (err) {
      console.error("Error rescheduling:", err);
      setError(err?.response?.data?.message || "Error rescheduling course.");
    }
  }

  function handleKeepCurrent() {
    console.log("Keeping current course, no reschedule.");
    router.push("/courses");
  }

  function handleRescheduleClick(course) {
    setSelectedNewCourse(course);
    setStep(2);
  }

  return (
    <>
      <Header
        headerTagline="Reschedule Course"
        selectedAccount={null}
        accounts={[]}
        showAccountDropdown={false}
        setShowAccountDropdown={() => {}}
        handleSelect={() => {}}
        handleLogout={() => router.push("/login")}
        courseName={oldCourseName}
        showBackButton={true}
      />
      
      <div className="max-w-3xl mx-auto py-8 px-4 pb-28">
        {step === 1 && (
          <>
            {/* Current Course Card */}
            <div className="mb-6 p-4 border-2 border-blue-600 bg-blue-50 rounded-lg shadow-xl">
              <h2 className="text-xl font-bold text-blue-800">Current Course</h2>
              <p className="mt-2 text-lg">
                {oldCourseName || "No current course available"}
              </p>
              <div className="flex items-center gap-6 mt-2 text-gray-600">
                <div className="flex items-center">
                  <span className="mr-2">📍</span>
                  {oldCourseLocation || "Location N/A"}
                </div>
                <div className="flex items-center">
                  <span className="mr-2">⏰</span>
                  {oldCourseStartDate ? (
                    getDaysUntil(oldCourseStartDate) < 0 ? (
                      <span className="text-red-500">Course has passed</span>
                    ) : (
                      <span>Days Until: {getDaysUntil(oldCourseStartDate)}</span>
                    )
                  ) : (
                    "Start date N/A"
                  )}
                </div>
              </div>
            </div>

            {/* Future Courses Section */}
            <h1 className="text-2xl mb-4">
              Reschedule Your Course: {oldCourseName || "Unknown"}
            </h1>

            {/* Location Filter */}
            <div className="mb-4">
              <p className="text-gray-700 mb-2">Filter by Location:</p>
              <div className="flex flex-wrap gap-2">
                {uniqueLocations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => toggleLocation(loc.id)}
                    className={`px-3 py-1 border rounded text-sm ${
                      selectedLocations.includes(loc.id)
                        ? "border-blue-500 text-blue-500"
                        : "border-gray-300 text-gray-600"
                    }`}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
              <hr className="mt-4 border-gray-300" />
            </div>

            <p className="text-gray-700 mb-4">
              Please select one of the future courses to reschedule into:
            </p>
            {loading && <p className="text-gray-500">Loading future courses...</p>}
            {error && <p className="text-red-600 mb-4">{error}</p>}

            <div className="space-y-4 max-h-72 overflow-y-auto border border-gray-200 p-4 rounded">
              {filteredCourses.map((course) => {
                const hasPassed = course.DaysUntilStart < 0;
                return (
                  <div
                    key={course.Id}
                    onClick={() => handleSelectCourse(course)}
                    className={`card mb-2 p-4 border rounded-md cursor-pointer ${
                      selectedNewCourse?.Id === course.Id
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    <div className="card-header">
                      <span className="text-[#0070d9] text-lg">
                        {parseDateFromCourseName(course.Name || "Untitled Course")}
                      </span>
                    </div>
                    <div className="card-body mt-0">
                      <div className="flex items-center justify-between gap-6 mt-2 text-gray-600 h-auto">
                        <div className="flex items-center gap-6">
                          <div className="flex items-center">
                            <span className="mr-2">📍</span>
                            {course.Location__r?.Name || course.Location__c}
                          </div>
                          <div className="flex items-center">
                            <span className="mr-2">⏰</span>
                            {hasPassed ? (
                              <span className="text-red-500">Course has passed</span>
                            ) : (
                              <span>
                                Days Until: {getDaysUntil(course.Start_date_time__c)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col text-sm self-start">
                          <button
                            onClick={() => handleRescheduleClick(course)}
                            className="px-3 py-1 border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
                          >
                            Reschedule into this course
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold mb-4">Confirm Reschedule</h1>
            <div className="mb-4">
              <p className="mb-2">
                <strong>Old Course:</strong> {oldCourseName} (ID: {oldCourseId})
              </p>
              <p className="mb-2">
                <strong>New Course:</strong> {selectedNewCourse?.Name}
              </p>
              <p className="mb-2">
                <strong>Reschedule Fee:</strong> {rescheduleFee}
              </p>
            </div>
            <p className="text-gray-700 mb-4">
              By confirming, you agree to pay the additional fee (if any) and move
              your enrollment to the new course.
            </p>
            {error && <p className="text-red-600 mb-4">{error}</p>}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setStep(1)}
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Reschedule Confirmed</h1>
            <p className="mb-4">Your enrollment has been rescheduled to:</p>
            <div className="p-4 border border-blue-500 rounded">
              <h2 className="text-xl font-bold">{selectedNewCourse?.Name}</h2>
              <p>
                <span>📍 </span>
                {selectedNewCourse?.Location__r?.Name || selectedNewCourse?.Location__c || "Location N/A"}
              </p>
              <p>
                <span>⏰ </span>
                {selectedNewCourse?.Start_date_time__c ? (
                  getDaysUntil(selectedNewCourse.Start_date_time__c) < 0 ? (
                    <span className="text-red-500">Course has passed</span>
                  ) : (
                    `Days Until: ${getDaysUntil(selectedNewCourse.Start_date_time__c)}`
                  )
                ) : (
                  "Start date N/A"
                )}
              </p>
            </div>
            <button
              onClick={() => router.push('/courses')}
              className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Courses
            </button>
          </div>
        )}
      </div>
    </>
  );
}
