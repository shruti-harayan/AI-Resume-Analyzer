import React, { useEffect, useState } from "react";
import axios from "axios";

function RecruiterDashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
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

  // Filter by skills on top of matched resumes
  const filteredResumes = resumes.filter((resume) => {
    if (!resume.matched_skills) return skillFilter === "";
    return (
      skillFilter === "" ||
      resume.matched_skills.toLowerCase().includes(skillFilter.toLowerCase())
    );
  });

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
        📂 Recruiter Dashboard – Saved Resumes
      </h1>

      <div className="flex flex-col md:flex-row gap-4 w-full mb-6">
        {/* Skill Filter Input */}
        <input
          type="text"
          value={skillFilter}
          onChange={(e) => setSkillFilter(e.target.value)}
          placeholder="Filter by skill"
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
        />

        {/* Job Description Textarea */}
        <textarea
          id="job-description"
          value={jdFilter}
          onChange={(e) => setJdFilter(e.target.value)}
          placeholder="Paste Job Description here"
          className="w-full md:w-2/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
          rows={4}
        />

        {/* Match Button */}
        <button
          onClick={handleJDMatch}
          disabled={!jdFilter.trim() || loading}
          className={`px-6 py-2 font-medium rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500
      ${
        !jdFilter.trim() || loading
          ? "bg-gray-400 text-gray-200 cursor-not-allowed"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      }`}
        >
          {loading ? "Matching..." : "Match Resumes"}
        </button>
      </div>

      {filteredResumes.length === 0 ? (
        <p className="text-gray-500 italic dark:text-gray-400">
          No resumes match your filters.
        </p>
      ) : (
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
              {filteredResumes.map((resume) => (
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
                      if (
                        typeof t === "string" &&
                        !t.endsWith("Z") &&
                        !t.includes("+")
                      )
                        t += "Z";
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
      )}
    </div>
  );
}

export default RecruiterDashboard;
