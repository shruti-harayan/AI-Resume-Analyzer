import React, { useEffect, useState } from "react";
import axios from "axios";

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
  const filteredResumes = resumes.filter(resume => {
    const skillsMatch =
      skillFilter === "" ||
      (resume.matched_skills?.toLowerCase().includes(skillFilter.toLowerCase()));
    const scoreMatch =
      scoreFilter === "" ||
      (resume.ats_score >= parseFloat(scoreFilter));
    const jdMatch =
      jdFilter === "" ||
      (resume.resume_text?.toLowerCase().includes(jdFilter.toLowerCase()));
    return skillsMatch && scoreMatch && jdMatch;
  });

  // Download handler
  function downloadResume(resumeText, filename = "resume.txt") {
    const element = document.createElement("a");
    const file = new Blob([resumeText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  if (loading) return <div>Loading resumes...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Saved Resumes</h1>

      {/* Filter Controls */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by skill"
          value={skillFilter}
          onChange={e => setSkillFilter(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="number"
          placeholder="Min ATS score"
          value={scoreFilter}
          onChange={e => setScoreFilter(e.target.value)}
          className="border rounded px-2 py-1"
        />
        <input
          type="text"
          placeholder="Job Desc. keyword"
          value={jdFilter}
          onChange={e => setJdFilter(e.target.value)}
          className="border rounded px-2 py-1"
        />
      </div>

      {filteredResumes.length === 0 ? (
        <p>No resumes saved yet.</p>
      ) : (
        <table className="min-w-full table-auto border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-2 py-1">Student Email</th>
              <th className="border border-gray-300 px-2 py-1">ATS Score</th>
              <th className="border border-gray-300 px-2 py-1">Upload Time</th>
              <th className="border border-gray-300 px-2 py-1">Matched Skills</th>
              <th className="border border-gray-300 px-2 py-1">Missing Skills</th>
              <th className="border border-gray-300 px-2 py-1">Resume Text</th>
              <th className="border border-gray-300 px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredResumes.map((resume) => (
              <tr key={resume.id}>
                <td className="border border-gray-300 px-2 py-1">{resume.student_email}</td>
                <td className="border border-gray-300 px-2 py-1">
                  {resume.ats_score.toFixed(2)}%
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {/* Ensure proper UTC to local conversion */}
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
                <td className="border border-gray-300 px-2 py-1">
                  {resume.matched_skills || "N/A"}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  {resume.missing_skills || "N/A"}
                </td>
                <td className="border border-gray-300 px-2 py-1 max-w-xs truncate">
                  {resume.resume_text
                    ? resume.resume_text.substring(0, 40) + "..."
                    : "N/A"}
                </td>
                <td className="border border-gray-300 px-2 py-1">
                  <button
                    className="bg-indigo-600 text-white rounded px-3 py-1 mr-2"
                    onClick={() => setModalResume(resume.resume_text)}
                  >
                    View
                  </button>
                  <button
                    className="bg-green-600 text-white rounded px-3 py-1"
                    onClick={() =>
                      downloadResume(
                        resume.resume_text,
                        `resume-${resume.student_email}.txt`
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
      )}

      {/* View Full Resume Modal */}
      {modalResume && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-4 max-w-lg rounded shadow">
            <h2 className="text-lg font-bold mb-2">Full Resume</h2>
            <pre className="overflow-auto whitespace-pre-wrap max-h-96">{modalResume}</pre>
            <button
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded"
              onClick={() => setModalResume(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RecruiterDashboard;
