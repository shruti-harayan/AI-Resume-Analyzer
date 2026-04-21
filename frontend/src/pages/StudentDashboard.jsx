import React from "react";
import ATS from "../components/ATS";
import ScoreHistory from "../components/ScoreHistory";   // NEW

function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-6 py-10">
      {/* Header */}
      <h1 className="text-3xl md:text-4xl font-extrabold text-center mb-10">
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          🎓 Student Dashboard
        </span>
      </h1>

      {/* Score History chart — only shows when student has 2+ saved submissions */}
      <div className="max-w-5xl mx-auto mb-4">
        <ScoreHistory />
      </div>

      {/* Main Card for ATS Analyzer */}
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-6 md:p-10">
        <ATS />
      </div>
    </div>
  );
}

export default StudentDashboard;
