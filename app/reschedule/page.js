"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function ReschedulePage() {
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

  // 1) Fetch future courses
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

  // Compute unique locations from the fetched courses
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

  // Filter courses based on selected locations.
  const filteredCourses = useMemo(() => {
    if (selectedLocations.length === 0) {
      return futureCourses;
    }
    return futureCourses.filter((course) => {
      const locationName = course.Location__r?.Name || course.Location__c;
      return selectedLocations.includes(locationName);
    });
  }, [futureCourses, selectedLocations]);

  // Toggle a location in the filter
  const toggleLocation = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((loc) => loc !== location)
        : [...prev, location]
    );
  };

  // Toggle course selection: unselect if same course is clicked again
  const handleSelectCourse = (course) => {
    if (selectedNewCourse && selectedNewCourse.Id === course.Id) {
      setSelectedNewCourse(null);
    } else {
      setSelectedNewCourse(course);
    }
  };

  // Helper function to calculate days until the course start date
  const getDaysUntil = (startDate) => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = start.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // 3) Next step (disabled if no course selected)
  const handleNext = () => {
    if (!selectedNewCourse) {
      alert("Please select a course first.");
      return;
    }
    setStep(2);
  };

  // 4) Confirm reschedule
  const handleConfirm = () => {
    console.log("Rescheduling from:", oldCourseName, "to:", selectedNewCourse);
    router.push("/dashboard"); // placeholder navigation
  };

  // 5) Handle "Nevermind, keep my current course"
  const handleKeepCurrent = () => {
    console.log("Keeping current course, no reschedule.");
    router.push("/dashboard");
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold mb-4">
            Reschedule Your Course: {oldCourseName || "Unknown"}
          </h1>
          {/* Location Filter Bar */}
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
                  className={`p-4 border rounded cursor-pointer ${
                    selectedNewCourse?.Id === course.Id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  <h3 className="font-semibold">{course.Name}</h3>
                  <p className="text-sm text-gray-600">
                    Start: {course.Start_date_time__c}
                  </p>
                  <p className="text-sm text-gray-600">
                    Location:{" "}
                    {course.Location__r && course.Location__r.Name
                      ? course.Location__r.Name
                      : course.Location__c}
                  </p>
                  <p className="text-sm text-gray-600">
                    {/* Days until snippet */}
                    {hasPassed ? (
                      <span className="text-red-500">Course has passed</span>
                    ) : (
                      <span>
                        <strong>Days Until:</strong>{" "}
                        {getDaysUntil(course.Start_date_time__c)}
                      </span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end space-x-4">
            <button
              onClick={handleKeepCurrent}
              className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
            >
              Nevermind, keep my current course
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedNewCourse}
              className={`px-4 py-2 rounded text-white ${
                selectedNewCourse
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-400 cursor-not-allowed"
              }`}
            >
              Next
            </button>
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
    </div>
  );
}