"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * RescheduleModal
 *
 * Props:
 * - courseType: string (the old course name or type)
 * - onClose: function to close the modal
 */
export default function RescheduleModal({ courseType, onClose }) {
  // step 1: show future courses, step 2: confirm old vs. new
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // futureCourses fetched from an endpoint, e.g. /api/futureCourses?courseType=...
  const [futureCourses, setFutureCourses] = useState([]);
  // the user’s selected new course
  const [selectedNewCourse, setSelectedNewCourse] = useState(null);

  // sample data about old course (you might pass more info if needed)
  // you could pass the entire enrollment or course object from the parent
  const oldCourse = courseType || "Unknown course";

  // step 2: Fees
  const [rescheduleFee, setRescheduleFee] = useState("$50"); // for example

  // 1) fetch future courses
  useEffect(() => {
    const fetchFutureCourses = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await axios.get(`/api/futureCourses?courseType=${encodeURIComponent(courseType)}`);
        if (res.data.success) {
          setFutureCourses(res.data.courses);
        } else {
          setError(res.data.message || "Error fetching future courses");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (courseType) {
      fetchFutureCourses();
    }
  }, [courseType]);

  // 2) handle selecting a course
  const handleSelectCourse = (course) => {
    setSelectedNewCourse(course);
  };

  // 3) handle Next button
  const handleNext = () => {
    if (!selectedNewCourse) {
      alert("Please select a course first");
      return;
    }
    setStep(2);
  };

  // 4) handle Confirm
  const handleConfirm = () => {
    // TODO: in real code, do the actual Salesforce API call
    console.log("Confirmed reschedule from old course:", oldCourse, "to new course:", selectedNewCourse);
    console.log("Reschedule Fee will be charged:", rescheduleFee);
    // once done, close modal or do other logic
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      {/* The modal container */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        {/* Close (X) button in top-right */}
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          onClick={onClose}
        >
          X
        </button>

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold mb-4">
              Reschedule Your Course: {oldCourse}
            </h2>
            <p className="text-gray-700 mb-4">
              Please select one of the future courses to reschedule into:
            </p>

            {loading && <p className="text-gray-500">Loading future courses...</p>}
            {error && <p className="text-red-600 mb-4">{error}</p>}

            <div className="space-y-4 max-h-72 overflow-y-auto">
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
                  <p className="text-sm text-gray-600">Start: {course.Start_date_time__c}</p>
                  <p className="text-sm text-gray-600">Location: {course.Location__c}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleNext}
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold mb-4">Confirm Reschedule</h2>
            <div className="mb-4">
              <p className="mb-2">
                <strong>Old Course:</strong> {oldCourse}
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
                className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-100"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                onClick={handleConfirm}
              >
                Confirm
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}