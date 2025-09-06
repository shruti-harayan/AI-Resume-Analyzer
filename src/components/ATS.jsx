import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function ATS() {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState("");
  const [resumeText, setResumeText] = useState("");

  const handleSaveResume = async () => {
    if (!result) {
      setSaveStatus("Please calculate ATS score before saving.");
      return;
    }

    console.log("Saving resume with payload:", {
      student_email: user.email,
      ats_score: result.score,
      resume_text: resumeText,
      similarity: result.details?.similarity,
      keyword_overlap: result.details?.keyword_overlap,
      strictness_factor_applied: result.details?.strictness_factor_applied,
      matched_skills: result.matched_skills?.join(","),
      missing_skills: result.missing_skills?.join(","),
      file_path: result.file_path
    });

    try {
      const res = await axios.post("http://localhost:8000/resume/save", {
        student_email: user.email,
        ats_score: result.score,
        resume_text: resumeText,
        similarity: result.details?.similarity,
        keyword_overlap: result.details?.keyword_overlap,
        strictness_factor_applied: result.details?.strictness_factor_applied,
        matched_skills: result.matched_skills?.join(","),
        missing_skills: result.missing_skills?.join(","),
        file_path: result.file_path
      });

      if (res.data.message === "Resume saved successfully") {
        setSaveStatus("Resume saved successfully!");
        alert("Resume saved successfully!");
      } else {
        setSaveStatus("Could not save resume.");
      }
    } catch (error) {
      setSaveStatus("Could not save resume.");
    }
  };

  const handleUpload = (e) => {
    setResume(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!resume || !jd) {
      alert("Please upload resume and enter job description");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jd", jd);

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8000/analyze/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setResult(res.data);

      setResumeText(res.data.resume_text || "");
    } catch (err) {
      console.error(err);
      alert("Error analyzing resume");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-6">
          AI Resume Analyzer
        </h1>

        {/* File Upload + JD Input */}
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleUpload}
            className="block w-full text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer focus:outline-none bg-white dark:bg-gray-700"
          />
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            rows="5"
            placeholder="Paste Job Description..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
              Results
            </h2>

            {/* Score Progress Bar */}
            <div>
              <p className="font-semibold">ATS Score: {result.score}%</p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 mt-2">
                <div
                  className={`h-4 rounded-full ${
                    result.score >= 70
                      ? "bg-green-500"
                      : result.score >= 40
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                  style={{ width: `${result.score}%` }}
                ></div>
              </div>
            </div>

            {/* Experience Gap  */}
            {result.experience_gap && (
              <div className="p-6 rounded-xl bg-white dark:bg-gray-800 shadow md:col-span-2">
                <h3 className="font-semibold text-red-600 mb-2">
                  ⚠️ Experience Gap
                </h3>
                <p className="text-gray-700 dark:text-gray-300">
                  {result.experience_gap}
                </p>
              </div>
            )}

            {/* Matched / Missing Skills */}
            <div>
              <p className="font-semibold text-green-600">Matched Skills:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.matched_skills && result.matched_skills.length > 0 ? (
                  result.matched_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-full"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">
                    No matched skills found
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="font-semibold text-red-600">Missing Skills:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.missing_skills?.length > 0 ? (
                  result.missing_skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-full"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500 dark:text-gray-400">None</span>
                )}
              </div>
            </div>

            {/* Explanation */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 rounded">
              <p className="font-semibold text-blue-700 dark:text-blue-300">
                Explanation:
              </p>
              <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">
                {result.explanation}
              </p>
            </div>

            {/* Tips */}
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500 rounded">
              <p className="font-semibold text-yellow-700 dark:text-yellow-300">
                Tips:
              </p>
              <p className="text-gray-700 dark:text-gray-200">{result.tips}</p>
            </div>

            {/* Warnings */}
            {(result.warnings?.length > 0 || result.experience_gap) && (
              <div className="p-6 rounded-xl bg-red-50 dark:bg-red-900 border-l-4 border-red-500 shadow md:col-span-2">
                <h3 className="font-semibold text-red-700 dark:text-red-300 mb-2">
                  ⚠️ Warnings (Critical Issues)
                </h3>
                <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 space-y-1">
                  {result.warnings?.map((warn, idx) => (
                    <li key={idx}>{warn}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Notes */}
            {result.overqualified_gap && (
              <div className="p-6 rounded-xl bg-yellow-50 dark:bg-yellow-800 border-l-4 border-yellow-500 shadow md:col-span-2">
                <h3 className="font-semibold text-yellow-700 dark:text-yellow-200 mb-2">
                  💡 Notes (Additional Observations)
                </h3>
                <p className="text-gray-700 dark:text-gray-200">
                  {result.overqualified_gap}
                </p>
              </div>
            )}

            <button
              onClick={handleSaveResume}
              disabled={!result}
              className={`bg-indigo-600 text-white rounded px-4 py-2 mt-4 hover:bg-indigo-700 ${
                !result ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              Save Resume
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ATS;
