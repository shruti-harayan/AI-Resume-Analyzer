import React, { useEffect, useState } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";

function RecruiterDashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [skillFilter, setSkillFilter] = useState("");
  const [scoreFilter, setScoreFilter] = useState("");
  const [jdFilter, setJdFilter] = useState("");
  const [modalResume, setModalResume] = useState(null);

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

  // Filter logic
  const filteredResumes = resumes.filter((resume) => {
    const skillsMatch =
      skillFilter === "" ||
      resume.matched_skills?.toLowerCase().includes(skillFilter.toLowerCase());
    const scoreMatch =
      scoreFilter === "" || resume.ats_score >= parseFloat(scoreFilter);
    const jdMatch =
      jdFilter === "" ||
      resume.resume_text?.toLowerCase().includes(jdFilter.toLowerCase());
    return skillsMatch && scoreMatch && jdMatch;
  });

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

  {/* Filter Controls */}
  <div className="flex flex-col md:flex-row gap-4 mb-6">
    <input
      type="text"
      placeholder="Filter by skill"
      value={skillFilter}
      onChange={(e) => setSkillFilter(e.target.value)}
      className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
    />
    <input
      type="number"
      placeholder="Min ATS score"
      value={scoreFilter}
      onChange={(e) => setScoreFilter(e.target.value)}
      className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
    />
    <input
      type="text"
      placeholder="Job Desc. keyword"
      value={jdFilter}
      onChange={(e) => setJdFilter(e.target.value)}
      className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
    />
  </div>

  {filteredResumes.length === 0 ? (
    <p className="text-gray-500 italic dark:text-gray-400">No resumes match your filters.</p>
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
            <tr key={resume.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{resume.student_email}</td>
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
              <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{resume.matched_skills || "N/A"}</td>
              <td className="px-4 py-2 text-red-500 font-medium">{resume.missing_skills || "N/A"}</td>
              <td className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200">{resume.experience_level || "N/A"}</td>
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
