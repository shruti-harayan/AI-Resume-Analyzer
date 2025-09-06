import React, { useEffect, useState } from "react";
import axios from "axios";

function RecruiterDashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <div>Loading resumes...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>Saved Resumes</h1>
      {resumes.length === 0 ? (
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
            </tr>
          </thead>
          <tbody>
            {resumes.map((resume) => (
              <tr key={resume.id}>
                <td className="border border-gray-300 px-2 py-1">{resume.student_email}</td>
                <td className="border border-gray-300 px-2 py-1">{resume.ats_score.toFixed(2)}%</td>
                <td className="border border-gray-300 px-2 py-1">{(() => {let t = resume.upload_time;
                if (typeof t === "string" && !t.endsWith('Z') && !t.includes('+')) t += "Z";
                  return new Date(t).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });})()}</td>
                <td className="border border-gray-300 px-2 py-1">{resume.matched_skills || "N/A"}</td>
                <td className="border border-gray-300 px-2 py-1">{resume.missing_skills || "N/A"}</td>
                <td className="border border-gray-300 px-2 py-1 max-w-xs truncate">{resume.resume_text || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default RecruiterDashboard;
