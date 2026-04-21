import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";

// ── Renders **bold** markdown in LLM output as real <strong> tags ──
function MarkdownText({ text }) {
  if (!text) return null;
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ── Renders a full LLM block: splits on newlines, applies MarkdownText per line ──
function LLMOutput({ text }) {
  if (!text) return null;
  return (
    <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed space-y-1">
      {text.split("\n").map((line, i) => (
        <p key={i} className={line.trim() === "" ? "mt-2" : ""}>
          <MarkdownText text={line} />
        </p>
      ))}
    </div>
  );
}

// ── Score color helper ──
function scoreColor(score) {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-500";
  return "text-red-500";
}
function scoreBg(score) {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-yellow-500";
  return "bg-red-500";
}
function scoreLabel(score) {
  if (score >= 70) return "Strong Match ✅";
  if (score >= 40) return "Partial Match ⚡";
  return "Poor Match ❌";
}

function ATS() {
  const [resume, setResume] = useState(null);
  const [jd, setJd] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [saveStatus, setSaveStatus] = useState("");
  const [resumeText, setResumeText] = useState("");

  // LLM states
  const [llmFeedback, setLlmFeedback] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [coverLoading, setCoverLoading] = useState(false);
  const [interviewQs, setInterviewQs] = useState("");
  const [interviewLoading, setInterviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("results");

  // Copy feedback state
  const [copied, setCopied] = useState("");
  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  const buildPayload = () => ({
    student_email: user.email,
    ats_score: result.score,
    similarity: result.details?.similarity,
    keyword_overlap: result.details?.keyword_overlap,
    strictness_factor_applied: result.details?.strictness_factor_applied,
    matched_skills: result.matched_skills?.join(","),
    missing_skills: result.missing_skills?.join(","),
    file_path: result.file_path,
    experience_gap: Array.isArray(result.experience_gap)
      ? result.experience_gap.join("; ")
      : typeof result.experience_gap === "string"
      ? result.experience_gap
      : "",
    overqualified: Array.isArray(result.overqualified)
      ? result.overqualified.join("; ")
      : typeof result.overqualified === "string"
      ? result.overqualified
      : "",
    explanation: result.explanation,
    tips: result.tips,
    warnings: Array.isArray(result.warnings) ? result.warnings.join("; ") : "",
  });

  const handleSaveResume = async () => {
    if (!result) return setSaveStatus("Please calculate ATS score before saving.");
    try {
      const res = await axios.post("http://localhost:8000/resume/save", buildPayload());
      setSaveStatus(
        res.data.message === "Resume saved successfully"
          ? "✅ Resume saved successfully!"
          : "❌ Could not save resume."
      );
    } catch {
      setSaveStatus("❌ Could not save resume.");
    }
  };

  const handleUpload = (e) => setResume(e.target.files[0]);

  const handleSubmit = async () => {
    if (!resume || !jd) return alert("Please upload resume and enter job description");
    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("jd", jd);
    try {
      setLoading(true);
      setLlmFeedback("");
      setCoverLetter("");
      setInterviewQs("");
      setActiveTab("results");
      setSaveStatus("");
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

  const handleGetLLMFeedback = async () => {
    if (!result) return;
    setLlmLoading(true);
    setLlmFeedback("");
    try {
      const res = await axios.post("http://localhost:8000/llm/feedback", {
        resume_text: resumeText,
        jd_text: jd,
        ats_score: result.score,
        matched_skills: result.matched_skills || [],
        missing_skills: result.missing_skills || [],
      });
      setLlmFeedback(res.data.feedback);
    } catch (err) {
      setLlmFeedback(`⚠️ ${err.response?.data?.detail || "Could not get AI feedback. Check your GROQ_API_KEY."}`);
    } finally {
      setLlmLoading(false);
    }
  };

  const handleCoverLetter = async () => {
    if (!result) return;
    setCoverLoading(true);
    setCoverLetter("");
    setActiveTab("cover");
    try {
      const res = await axios.post("http://localhost:8000/llm/cover-letter", {
        resume_text: resumeText,
        jd_text: jd,
      });
      setCoverLetter(res.data.cover_letter);
    } catch (err) {
      setCoverLetter(`⚠️ ${err.response?.data?.detail || "Could not generate cover letter."}`);
    } finally {
      setCoverLoading(false);
    }
  };

  const handleInterviewPrep = async () => {
    if (!result) return;
    setInterviewLoading(true);
    setInterviewQs("");
    setActiveTab("interview");
    try {
      const res = await axios.post("http://localhost:8000/llm/interview-questions", {
        missing_skills: result.missing_skills || [],
        jd_text: jd,
        ats_score: result.score,
      });
      setInterviewQs(res.data.questions);
    } catch (err) {
      setInterviewQs(`⚠️ ${err.response?.data?.detail || "Could not generate questions."}`);
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    if (!result) return;
    const p = buildPayload();
    const rows = [
      ["Field", "Value"],
      ["ATS Score", `${p.ats_score}%`],
      ["Similarity", p.similarity],
      ["Keyword Overlap", p.keyword_overlap],
      ["Strictness Applied", p.strictness_factor_applied],
      ["Matched Skills", p.matched_skills || "None"],
      ["Missing Skills", p.missing_skills || "None"],
      ["Experience Gap", p.experience_gap || "None"],
      ["Overqualified", p.overqualified || "None"],
      ["Warnings", p.warnings || "None"],
      ["Explanation", p.explanation || "-"],
      ["Tips", p.tips || "-"],
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.setAttribute("download", "ATS_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    const p = buildPayload();
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text("ATS Resume Analysis Report", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(0);
    const rows = [
      `ATS Score: ${p.ats_score}%`,
      `Similarity: ${p.similarity}`,
      `Keyword Overlap: ${p.keyword_overlap}`,
      `Matched Skills: ${p.matched_skills || "None"}`,
      `Missing Skills: ${p.missing_skills || "None"}`,
      `Experience Gap: ${p.experience_gap || "None"}`,
      `Overqualified: ${p.overqualified || "None"}`,
      `Warnings: ${p.warnings || "None"}`,
      `Explanation: ${p.explanation || "-"}`,
      `Tips: ${p.tips || "-"}`,
    ];
    if (llmFeedback && !llmFeedback.startsWith("⚠️")) {
      rows.push("", "── AI Feedback ──", llmFeedback.replace(/\*\*/g, ""));
    }
    let y = 35;
    rows.forEach((line) => {
      const wrapped = doc.splitTextToSize(line, 180);
      doc.text(wrapped, 14, y);
      y += wrapped.length * 7;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save("ATS_Report.pdf");
  };

  // ── UI helpers ──
  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
        activeTab === id
          ? "bg-indigo-600 text-white shadow"
          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );

  const Spinner = () => (
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
  );

  const InlineSpinner = ({ color = "#6366f1" }) => (
    <div
      className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin inline-block mr-2"
      style={{ borderColor: `${color}40`, borderTopColor: color }}
    />
  );

  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-6">
          AI Resume Analyzer
        </h1>

        {/* Upload + JD */}
        <div className="space-y-4">
          <input
            type="file"
            onChange={handleUpload}
            className="block w-full text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700 p-1"
          />
          {resume && (
            <p className="text-xs text-green-600 dark:text-green-400">
              ✅ Selected: {resume.name}
            </p>
          )}
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            rows="5"
            placeholder="Paste Job Description..."
            value={jd}
            onChange={(e) => setJd(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* ─── Results ─── */}
        {result && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Results</h2>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
              <TabBtn id="results"   label="📊 Results" />
              <TabBtn id="cover"     label="📝 Cover Letter" />
              <TabBtn id="interview" label="🎯 Interview Prep" />
            </div>

            {/* ════════════════ TAB: Results ════════════════ */}
            {activeTab === "results" && (
              <div className="space-y-6">

                {/* Score card */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className={`text-4xl font-extrabold ${scoreColor(result.score)}`}>
                    {result.score}%
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${scoreColor(result.score)}`}>
                      {scoreLabel(result.score)}
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2">
                      <div
                        className={`h-3 rounded-full transition-all duration-700 ${scoreBg(result.score)}`}
                        style={{ width: `${result.score}%` }}
                      />
                    </div>
                  </div>
                  {/* Mini stats */}
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Similarity: <strong>{Math.round((result.details?.similarity || 0) * 100)}%</strong></div>
                    <div>Keyword: <strong>{Math.round((result.details?.keyword_overlap || 0) * 100)}%</strong></div>
                  </div>
                </div>

                {/* Experience Gap */}
                {Array.isArray(result.experience_gap) && result.experience_gap.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded">
                    <p className="font-semibold text-red-600 mb-1">⚠️ Experience Gap</p>
                    <ul className="text-red-700 dark:text-red-200 text-sm space-y-0.5">
                      {result.experience_gap.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                  </div>
                )}

                {/* Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-green-600 mb-2">
                      ✅ Matched Skills ({result.matched_skills?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_skills?.length > 0 ? (
                        result.matched_skills.map((s, i) => (
                          <span key={i} className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-full font-medium">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">None found</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600 mb-2">
                      ❌ Missing Skills ({result.missing_skills?.length || 0})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_skills?.length > 0 ? (
                        result.missing_skills.map((s, i) => (
                          <span key={i} className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-full font-medium">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-400 text-sm">None — great match!</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Explanation */}
                <div className="p-4 bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-500 rounded">
                  <p className="font-semibold text-blue-700 dark:text-blue-300 mb-1">Explanation:</p>
                  <p className="text-gray-700 dark:text-gray-200 text-sm whitespace-pre-line">{result.explanation}</p>
                </div>

                {/* Tips */}
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/40 border-l-4 border-yellow-500 rounded">
                  <p className="font-semibold text-yellow-700 dark:text-yellow-300 mb-1">💡 Tips:</p>
                  <p className="text-gray-700 dark:text-gray-200 text-sm">{result.tips}</p>
                </div>

                {/* Warnings */}
                {result.warnings?.length > 0 && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/40 border-l-4 border-red-500 rounded">
                    <p className="font-semibold text-red-700 dark:text-red-300 mb-1">⚠️ Warnings</p>
                    <ul className="list-disc list-inside text-gray-700 dark:text-gray-200 text-sm space-y-1">
                      {result.warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                {/* Overqualified */}
                {Array.isArray(result.overqualified) && result.overqualified.length > 0 && (
                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 rounded">
                    <p className="font-semibold text-yellow-600 mb-1">⚠️ Overqualified Warning</p>
                    <ul className="text-yellow-700 dark:text-yellow-200 text-sm">
                      {result.overqualified.map((msg, i) => <li key={i}>{msg}</li>)}
                    </ul>
                  </div>
                )}

                {/* ── AI Feedback box ── */}
                <div className="border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 bg-indigo-50/30 dark:bg-indigo-900/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-indigo-700 dark:text-indigo-300">
                        🤖 AI-Powered Feedback
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        Powered by Groq · fast · free
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {llmFeedback && !llmFeedback.startsWith("⚠️") && (
                        <button
                          onClick={() => copyToClipboard(llmFeedback, "feedback")}
                          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                        >
                          {copied === "feedback" ? "✅ Copied!" : "📋 Copy"}
                        </button>
                      )}
                      <button
                        onClick={handleGetLLMFeedback}
                        disabled={llmLoading}
                        className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-2"
                      >
                        {llmLoading && <Spinner />}
                        {llmLoading ? "Thinking..." : llmFeedback ? "Regenerate" : "Get Smart Feedback"}
                      </button>
                    </div>
                  </div>

                  {llmLoading && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                      <InlineSpinner />
                      Groq is generating feedback...
                    </div>
                  )}

                  {llmFeedback && !llmLoading && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-indigo-100 dark:border-indigo-800">
                      <LLMOutput text={llmFeedback} />
                    </div>
                  )}

                  {!llmFeedback && !llmLoading && (
                    <p className="text-sm text-gray-400 dark:text-gray-500">
                      Get personalized, context-aware feedback on your resume for this specific role.
                    </p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 mt-2">
                  <button onClick={handleSaveResume}
                    className="bg-indigo-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-indigo-700 font-medium">
                    💾 Save Resume
                  </button>
                  <button onClick={handleDownloadCSV}
                    className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-green-700 font-medium">
                    ⬇️ CSV
                  </button>
                  <button onClick={handleDownloadPDF}
                    className="bg-purple-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-purple-700 font-medium">
                    ⬇️ PDF
                  </button>
                  <button onClick={handleCoverLetter} disabled={coverLoading}
                    className="bg-pink-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-pink-700 disabled:opacity-50 font-medium flex items-center gap-2">
                    {coverLoading && <Spinner />}
                    📝 Cover Letter
                  </button>
                  <button onClick={handleInterviewPrep} disabled={interviewLoading}
                    className="bg-orange-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-orange-600 disabled:opacity-50 font-medium flex items-center gap-2">
                    {interviewLoading && <Spinner />}
                    🎯 Interview Prep
                  </button>
                </div>

                {saveStatus && (
                  <p className="text-sm font-medium text-center mt-1">{saveStatus}</p>
                )}
              </div>
            )}

            {/* ════════════════ TAB: Cover Letter ════════════════ */}
            {activeTab === "cover" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-pink-600 dark:text-pink-400">
                      📝 Generated Cover Letter
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Tailored to your resume + this JD</p>
                  </div>
                  <button onClick={handleCoverLetter} disabled={coverLoading}
                    className="px-4 py-1.5 text-sm bg-pink-600 hover:bg-pink-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
                    {coverLoading && <Spinner />}
                    {coverLoading ? "Writing..." : "Regenerate"}
                  </button>
                </div>

                {coverLoading && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                    <InlineSpinner color="#ec4899" />
                    Writing your cover letter...
                  </div>
                )}

                {coverLetter && !coverLoading && (
                  <>
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-sm leading-relaxed font-serif">
                      <LLMOutput text={coverLetter} />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => copyToClipboard(coverLetter, "cover")}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                      >
                        {copied === "cover" ? "✅ Copied!" : "📋 Copy to Clipboard"}
                      </button>
                      <button
                        onClick={() => {
                          const doc = new jsPDF();
                          doc.setFontSize(12);
                          // Strip markdown asterisks for clean PDF
                          const clean = coverLetter.replace(/\*\*/g, "");
                          const lines = doc.splitTextToSize(clean, 180);
                          doc.text(lines, 14, 20);
                          doc.save("CoverLetter.pdf");
                        }}
                        className="px-4 py-2 text-sm bg-pink-100 dark:bg-pink-900 rounded-lg hover:bg-pink-200 text-pink-700 dark:text-pink-200"
                      >
                        ⬇️ Download PDF
                      </button>
                    </div>
                  </>
                )}

                {!coverLetter && !coverLoading && (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    Click "📝 Cover Letter" on the Results tab, or "Regenerate" above.
                  </p>
                )}
              </div>
            )}

            {/* ════════════════ TAB: Interview Prep ════════════════ */}
            {activeTab === "interview" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">
                      🎯 Predicted Interview Questions
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Based on your skill gaps for this role</p>
                  </div>
                  <button onClick={handleInterviewPrep} disabled={interviewLoading}
                    className="px-4 py-1.5 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
                    {interviewLoading && <Spinner />}
                    {interviewLoading ? "Generating..." : "Regenerate"}
                  </button>
                </div>

                {interviewLoading && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
                    <InlineSpinner color="#f97316" />
                    Predicting questions based on your gaps...
                  </div>
                )}

                {interviewQs && !interviewLoading && (
                  <>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-5">
                      <LLMOutput text={interviewQs} />
                    </div>
                    <button
                      onClick={() => copyToClipboard(interviewQs, "interview")}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      {copied === "interview" ? "✅ Copied!" : "📋 Copy Questions"}
                    </button>
                  </>
                )}

                {!interviewQs && !interviewLoading && (
                  <p className="text-gray-400 text-sm py-4 text-center">
                    Click "🎯 Interview Prep" on the Results tab to generate role-specific questions.
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ATS;
