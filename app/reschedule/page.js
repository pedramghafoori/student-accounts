"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function ReschedulePage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [futureCourses, setFutureCourses] = useState([]);
  const [selectedNewCourse, setSelectedNewCourse] = useState(null);
  const [rescheduleFee, setRescheduleFee] = useState("$50"); // example fee

  const router = useRouter();
  const searchParams = useSearchParams();
  
  // We use 'oldCourseName' here to match the URL parameter
  const oldCourseName = searchParams.get("oldCourseName") || "";
  const oldCourseId = searchParams.get("oldCourseId"); // if needed for display

  // 1) fetch future courses
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
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchFutureCourses();
  }, [oldCourseName]);

  // 2) handle selecting a future course
  const handleSelectCourse = (course) => {
    setSelectedNewCourse(course);
  };

  // 3) next step
  const handleNext = () => {
    if (!selectedNewCourse) {
      alert("Please select a course first.");
      return;
    }
    setStep(2);
  };

  // 4) confirm
  const handleConfirm = () => {
    console.log("Rescheduling from:", oldCourseName, "to:", selectedNewCourse);
    // e.g. call an endpoint: /api/reschedule
    // then navigate away or show success
    router.push("/dashboard"); // placeholder
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {step === 1 && (
        <>
          <h1 className="text-2xl font-bold mb-4">
            Reschedule Your Course: {oldCourseName || "Unknown"}
          </h1>
          <p className="text-gray-700 mb-4">
            Please select one of the future courses to reschedule into:
          </p>
          {loading && <p className="text-gray-500">Loading future courses...</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <div className="space-y-4 max-h-72 overflow-y-auto border border-gray-200 p-4 rounded">
            {futureCourses.map((course) => (
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
                  Location: {course.Location__c}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleNext}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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
            By confirming, you agree to pay the additional fee (if any) and
            move your enrollment to the new course.
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