import React from "react";
import ATS from "../components/ATS";

function StudentDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mb-6">
        🎓 Student Dashboard
      </h1>

      {/* ATS Resume Analyzer Component */}
      <ATS />
    </div>
  );
}

export default StudentDashboard;
