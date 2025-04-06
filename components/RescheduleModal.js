// components/RescheduleModal.js
import React from "react";

export default function RescheduleModal({ courseType, onClose, onSelectCourse }) {
  return (
    <div className="modal">
      <h2>Reschedule for {courseType}</h2>
      {/* Your modal content here */}
      <button onClick={onClose}>Close</button>
    </div>
  );
}