import React, { useEffect, useState } from "react";
import axios from "axios";

function RecruiterDashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [jdFilter, setJdFilter] = useState("");

  // When JD changes, fetch matched resumes from backend
  const handleJDMatch = async () => {
    if (!jdFilter.trim()) {
      // If no JD, optionally fetch all resumes or clear list
      setResumes([]);
      return;
    }
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8000/resume/jd_match", {
        jd_text: jdFilter,
      });
      console.log("JD match response", res.data);
      setResumes(res.data.matches);
      setError(""); // Clear previous errors on success
    } catch (e) {
      console.error("JD match fetch error:", e);
      if (e.response) {
        setError(
          `Error ${e.response.status}: ${e.response.data.detail || e.message}`
        );
      } else {
        setError("Failed fetching JD match");
      }
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:8000/resume/list");
        setResumes(res.data);
      } catch (err) {
        setError("Failed to load resumes");
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  // Download handler
  function downloadResume(resumeText, filename = "resume.txt") {
    const element = document.createElement("a");
    const file = new Blob([resumeText], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg text-gray-600">Loading resumes...</p>
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold text-indigo-700 dark:text-indigo-400 mb-6">
        📂 Recruiter Dashboard
      </h1>

     {/* Filter + Job Description Section */}
<div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
  <h2 className="text-xl font-semibold text-indigo-700 dark:text-indigo-400 mb-4">
    🎯 Resume Filters
  </h2>

  <div className="flex flex-col md:flex-row gap-4 w-full">
    

    {/* Job Description Textarea */}
    <textarea
      id="job-description"
      value={jdFilter}
      onChange={(e) => setJdFilter(e.target.value)}
      placeholder="Paste Job Description here"
      className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm 
                 focus:ring-2 focus:ring-indigo-500 focus:outline-none 
                 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
      rows={4}
    />

    {/* Buttons */}
    <div className="flex flex-col gap-2 md:flex-row md:items-start">
      {/* Match Button */}
      <button
        onClick={handleJDMatch}
        disabled={!jdFilter.trim() || loading}
        className={`px-6 py-2 font-medium rounded-lg shadow-md focus:outline-none 
          focus:ring-2 focus:ring-indigo-500 transition
          ${
            !jdFilter.trim() || loading
              ? "bg-gray-400 text-gray-200 cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-indigo-700"
          }`}
      >
        {loading ? "Matching..." : "Match Resumes"}
      </button>

      {/* Reset Button (only shows when filters are active) */}
      {( jdFilter.trim()) && (
        <button
          onClick={() => {
            setJdFilter("");           
          }}
          className="px-6 py-2 font-medium rounded-lg shadow-md focus:outline-none 
                     focus:ring-2 focus:ring-red-500 bg-red-500 text-white hover:bg-red-600 
                     transition"
        >
          Reset Filters
        </button>
      )}
    </div>
  </div>
</div>

{/* Resume Results Section */}
{resumes.length === 0 ? (
  <p className="text-gray-500 italic dark:text-gray-400">
    No resumes match your filters.
  </p>
) : (
  <div>
    {/* Resume Count Badge */}
    <div className="flex items-center mb-4">
      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200 
                       px-3 py-1 rounded-full text-sm font-medium shadow-sm">
        📄 {resumes.length} {resumes.length === 1 ? "resume" : "resumes"} found
      </span>
    </div>

    {/* Resume Table */}
    <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 dark:border-gray-600">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg">
        <thead className="bg-indigo-600 text-white uppercase text-sm tracking-wider dark:bg-indigo-700">
          <tr>
            <th className="px-4 py-3 text-left">Student Email</th>
            <th className="px-4 py-3 text-left">ATS Score</th>
            <th className="px-4 py-3 text-left">Upload Time</th>
            <th className="px-4 py-3 text-left">Matched Skills</th>
            <th className="px-4 py-3 text-left">Missing Skills</th>
            <th className="px-4 py-3 text-left">Experience Level</th>
            <th className="px-4 py-3 text-left">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {resumes.map((resume) => (
            <tr
              key={resume.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                {resume.student_email}
              </td>
              <td className="px-4 py-2 font-semibold text-indigo-600 dark:text-indigo-400">
                {resume.ats_score.toFixed(2)}%
              </td>
              <td className="px-4 py-2 text-gray-700 dark:text-gray-300">
                {(() => {
                  let t = resume.upload_time;
                  if (typeof t === "string" && !t.endsWith("Z") && !t.includes("+")) t += "Z";
                  return new Date(t).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  });
                })()}
              </td>
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">
                {resume.matched_skills || "N/A"}
              </td>
              <td className="px-4 py-2 text-red-500 font-medium">
                {resume.missing_skills || "N/A"}
              </td>
              <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200">
                {resume.experience_level || "N/A"}
              </td>
              <td className="px-4 py-2">
                <button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white rounded px-3 py-1 transition"
                  onClick={() =>
                    window.open(
                      `http://localhost:8000/resume/download/${resume.id}`,
                      "_blank"
                    )
                  }
                >
                  Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)}

    </div>
  );
}

export default RecruiterDashboard;
