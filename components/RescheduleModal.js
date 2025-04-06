"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";

export default function RescheduleModal({ courseType, onClose }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [futureCourses, setFutureCourses] = useState([]);
  const [selectedNewCourse, setSelectedNewCourse] = useState(null);
  const [rescheduleFee, setRescheduleFee] = useState("$50"); // Example fee
  const oldCourse = courseType || "Unknown course";

  // 1) fetch future courses from your /api/futureCourses?courseType=...
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

  // handle selecting a course
  const handleSelectCourse = (course) => {
    setSelectedNewCourse(course);
  };

  // step 1 => step 2
  const handleNext = () => {
    if (!selectedNewCourse) {
      alert("Please select a course first.");
      return;
    }
    setStep(2);
  };

  // final confirm
  const handleConfirm = () => {
    console.log("Confirm reschedule from old course:", oldCourse);
    console.log("to new course:", selectedNewCourse);
    console.log("Fee to be charged:", rescheduleFee);
    // TODO: call your Salesforce API here to finalize rescheduling
    onClose();
  };

  // The actual modal content
  const modalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex items-center justify-center">
      {/* Container for the modal box */}
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
        {/* Close (X) in top right corner */}
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
              Select a future course to reschedule into:
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

  // Use a portal to ensure the modal is rendered at the top level (document.body)
  return createPortal(modalContent, document.body);
};