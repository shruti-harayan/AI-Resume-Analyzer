import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import jsPDF from "jspdf";

// ── Renders **bold** markdown as real <strong> tags ──
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

// ── Renders LLM output: per-line with markdown ──
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

// ── Score helpers ──
const scoreColor = (s) => s >= 70 ? "text-green-600" : s >= 40 ? "text-yellow-500" : "text-red-500";
const scoreBg    = (s) => s >= 70 ? "bg-green-500"  : s >= 40 ? "bg-yellow-500"  : "bg-red-500";
const scoreLabel = (s) => s >= 70 ? "Strong Match ✅" : s >= 40 ? "Partial Match ⚡" : "Poor Match ❌";

// ── Spinner ──
const Spinner = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
);
const InlineSpinner = ({ color = "#6366f1" }) => (
  <div
    className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin inline-block mr-2"
    style={{ borderColor: `${color}40`, borderTopColor: color }}
  />
);

function ATS() {
  const [resume, setResume]         = useState(null);
  const [jd, setJd]                 = useState("");
  const [result, setResult]         = useState(null);
  const [loading, setLoading]       = useState(false);
  const { user }                    = useAuth();
  const [saveStatus, setSaveStatus] = useState("");
  const [resumeText, setResumeText] = useState("");

  // LLM states
  const [llmFeedback,      setLlmFeedback]      = useState("");
  const [llmLoading,       setLlmLoading]        = useState(false);
  const [coverLetter,      setCoverLetter]       = useState("");
  const [coverLoading,     setCoverLoading]      = useState(false);
  const [interviewQs,      setInterviewQs]       = useState("");
  const [interviewLoading, setInterviewLoading]  = useState(false);

  // Rewriter states
  const [bulletInput,      setBulletInput]       = useState("");
  const [rewriteMode,      setRewriteMode]       = useState("single"); // "single" | "section"
  const [rewriteResult,    setRewriteResult]     = useState("");
  const [rewriteLoading,   setRewriteLoading]    = useState(false);
  const [selectedVersion,  setSelectedVersion]   = useState(null); // which version the user picks
  const [appliedBullets,   setAppliedBullets]    = useState([]);   // saved rewrites

  const [activeTab, setActiveTab] = useState("results");
  const [copied,    setCopied]    = useState("");

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    });
  };

  // ── Payload builder ──
  const buildPayload = () => ({
    student_email:             user.email,
    ats_score:                 result.score,
    similarity:                result.details?.similarity,
    keyword_overlap:           result.details?.keyword_overlap,
    strictness_factor_applied: result.details?.strictness_factor_applied,
    matched_skills:            result.matched_skills?.join(","),
    missing_skills:            result.missing_skills?.join(","),
    file_path:                 result.file_path,
    experience_gap: Array.isArray(result.experience_gap)
      ? result.experience_gap.join("; ")
      : result.experience_gap || "",
    overqualified: Array.isArray(result.overqualified)
      ? result.overqualified.join("; ")
      : result.overqualified || "",
    explanation: result.explanation,
    tips:        result.tips,
    warnings:    Array.isArray(result.warnings) ? result.warnings.join("; ") : "",
  });

  const handleSaveResume = async () => {
    if (!result) return setSaveStatus("Please calculate ATS score before saving.");
    try {
      const res = await axios.post("http://localhost:8000/resume/save", buildPayload());
      setSaveStatus(res.data.message === "Resume saved successfully"
        ? "✅ Resume saved successfully!"
        : "❌ Could not save resume.");
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
      setLlmFeedback(""); setCoverLetter(""); setInterviewQs("");
      setRewriteResult(""); setSelectedVersion(null); setAppliedBullets([]);
      setActiveTab("results"); setSaveStatus("");
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

  // ── LLM calls ──
  const handleGetLLMFeedback = async () => {
    if (!result) return;
    setLlmLoading(true); setLlmFeedback("");
    try {
      const res = await axios.post("http://localhost:8000/llm/feedback", {
        resume_text:    resumeText, jd_text: jd,
        ats_score:      result.score,
        matched_skills: result.matched_skills || [],
        missing_skills: result.missing_skills || [],
      });
      setLlmFeedback(res.data.feedback);
    } catch (err) {
      setLlmFeedback(`⚠️ ${err.response?.data?.detail || "Could not get AI feedback. Check your GROQ_API_KEY."}`);
    } finally { setLlmLoading(false); }
  };

  const handleCoverLetter = async () => {
    if (!result) return;
    setCoverLoading(true); setCoverLetter(""); setActiveTab("cover");
    try {
      const res = await axios.post("http://localhost:8000/llm/cover-letter", {
        resume_text: resumeText, jd_text: jd,
      });
      setCoverLetter(res.data.cover_letter);
    } catch (err) {
      setCoverLetter(`⚠️ ${err.response?.data?.detail || "Could not generate cover letter."}`);
    } finally { setCoverLoading(false); }
  };

  const handleInterviewPrep = async () => {
    if (!result) return;
    setInterviewLoading(true); setInterviewQs(""); setActiveTab("interview");
    try {
      const res = await axios.post("http://localhost:8000/llm/interview-questions", {
        missing_skills: result.missing_skills || [],
        jd_text: jd, ats_score: result.score,
      });
      setInterviewQs(res.data.questions);
    } catch (err) {
      setInterviewQs(`⚠️ ${err.response?.data?.detail || "Could not generate questions."}`);
    } finally { setInterviewLoading(false); }
  };

  // ── Rewriter ──
  const handleRewrite = async () => {
    if (!bulletInput.trim()) return alert("Please paste a bullet point or section to rewrite.");
    if (!result) return alert("Please analyze a resume first so the rewriter has JD context.");
    setRewriteLoading(true); setRewriteResult(""); setSelectedVersion(null);
    const endpoint = rewriteMode === "single" ? "/llm/rewrite-bullet" : "/llm/rewrite-section";
    try {
      const res = await axios.post(`http://localhost:8000${endpoint}`, {
        bullet:      bulletInput,
        jd_text:     jd,
        resume_text: resumeText,
      });
      setRewriteResult(res.data.rewritten);
    } catch (err) {
      setRewriteResult(`⚠️ ${err.response?.data?.detail || "Could not rewrite. Check your GROQ_API_KEY."}`);
    } finally { setRewriteLoading(false); }
  };

  // Parse the 3 versions from LLM output for single-bullet mode
  const parseVersions = (text) => {
    const v1 = text.match(/VERSION 1[^\n]*\n([\s\S]*?)(?=VERSION 2|$)/)?.[1]?.trim();
    const v2 = text.match(/VERSION 2[^\n]*\n([\s\S]*?)(?=VERSION 3|$)/)?.[1]?.trim();
    const v3 = text.match(/VERSION 3[^\n]*\n([\s\S]*?)(?=WHY THESE WORK|$)/)?.[1]?.trim();
    const why = text.match(/WHY THESE WORK:\n([\s\S]*?)$/)?.[1]?.trim();
    return { v1, v2, v3, why };
  };

  const handleApplyVersion = (text, label) => {
    setAppliedBullets((prev) => [...prev, { label, text, id: Date.now() }]);
    setSelectedVersion(label);
  };

  const handleDownloadCSV = () => {
  if (!result) return;

  const p = buildPayload();

  const rows = [
    ["Field", "Value"],
    ["ATS Score", p.ats_score],
    ["Similarity", p.similarity],
    ["Keyword Overlap", p.keyword_overlap],
    ["Matched Skills", p.matched_skills],
    ["Missing Skills", p.missing_skills],
    ["Experience Gap", p.experience_gap],
    ["Warnings", p.warnings],
    ["Explanation", p.explanation],
    ["Tips", p.tips],
  ];

  const csvContent =
    "data:text/csv;charset=utf-8," +
    rows.map((e) => e.map((v) => `"${v || ""}"`).join(",")).join("\n");

  const encodedUri = encodeURI(csvContent);

  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "ATS_Report.csv");
  document.body.appendChild(link);

  link.click();
  document.body.removeChild(link);
};

const cleanText = (text) => {
  if (!text) return "";
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, "")
    .replace(/[^\x00-\x7F]/g, "")
    .replace(/\*\*/g, "")
    .replace(/[^\w\s.,\-:;%()/\\[\]@#&+=!?\'"]/g, "")
    .trim();
};

  // ── Downloads ──
  const handleDownloadPDF = () => {
    if (!result) return;

    const p = buildPayload();
    const doc = new jsPDF();

    let y = 20;
    const LINE_H    = 7;
    const PAGE_H    = 278;
    const MARGIN    = 14;
    const MAX_WIDTH = 182;

    const checkPage = (needed = LINE_H) => {
      if (y + needed > PAGE_H) { doc.addPage(); y = 20; }
    };

    const addTitle = (text) => {
      checkPage(LINE_H + 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(text, MARGIN, y);
      y += LINE_H + 1;
    };

    const addText = (text) => {
      if (!text) return;
      const cleaned = cleanText(String(text));
      if (!cleaned) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(cleaned, MAX_WIDTH);
      lines.forEach((line) => { checkPage(); doc.text(line, MARGIN, y); y += LINE_H; });
    };

    const addSkillsList = (csvString) => {
      if (!csvString) { addText("None"); return; }
      const skills = csvString.split(",").map(s => cleanText(s.trim())).filter(Boolean);
      if (skills.length === 0) { addText("None"); return; }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const cols = 3;
      for (let i = 0; i < skills.length; i += cols) {
        const row = skills.slice(i, i + cols).join("   |   ");
        checkPage();
        doc.text(row, MARGIN + 4, y);
        y += LINE_H;
      }
    };

    const addSection = (title, contentFn) => {
      y += 3;
      addTitle(title);
      contentFn();
      y += 2;
    };

    const addDivider = () => {
      checkPage(4);
      doc.setDrawColor(200, 200, 200);
      doc.line(MARGIN, y, MARGIN + MAX_WIDTH, y);
      y += 5;
    };

    // Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("ATS Resume Analysis Report", MARGIN, y);
    y += 12;
    addDivider();

    // Score
    addSection("ATS Score", () => {
      const scoreColor = p.ats_score >= 70 ? [34,197,94] : p.ats_score >= 40 ? [234,179,8] : [239,68,68];
      doc.setTextColor(...scoreColor);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      checkPage();
      doc.text(`${p.ats_score}%`, MARGIN + 4, y);
      doc.setTextColor(0, 0, 0);
      y += LINE_H + 3;
    });

    addSection("Score Details", () => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      checkPage();
      doc.text(
        `Semantic Similarity: ${Math.round((p.similarity || 0) * 100)}%   |   Keyword Overlap: ${Math.round((p.keyword_overlap || 0) * 100)}%`,
        MARGIN + 4, y
      );
      y += LINE_H;
    });

    addDivider();

    const matchedCount = p.matched_skills ? p.matched_skills.split(",").filter(Boolean).length : 0;
    const missingCount = p.missing_skills ? p.missing_skills.split(",").filter(Boolean).length : 0;
    addSection(`Matched Skills (${matchedCount})`, () => addSkillsList(p.matched_skills));
    addSection(`Missing Skills (${missingCount})`, () => addSkillsList(p.missing_skills));

    addDivider();

    addSection("Experience Gap", () => addText(p.experience_gap || "None detected"));
    addSection("Overqualified", () => addText(p.overqualified || "None"));

    addDivider();

    addSection("Explanation", () => addText(p.explanation));
    addSection("Tips", () => addText(p.tips));

    if (p.warnings) {
      addDivider();
      addSection("Warnings", () => addText(p.warnings));
    }

    if (llmFeedback && !llmFeedback.startsWith("\u26a0\ufe0f")) {
      addDivider();
      addSection("AI-Powered Feedback", () => addText(llmFeedback));
    }

    doc.save("ATS_Report.pdf");
  };;

  
  
  // ── Tab button ──
  const TabBtn = ({ id, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition whitespace-nowrap ${
        activeTab === id
          ? "bg-indigo-600 text-white shadow"
          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
      }`}
    >
      {label}
    </button>
  );

  // ────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center py-10 px-4 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="w-full max-w-3xl bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-indigo-600 dark:text-indigo-400 mb-6">
          AI Resume Analyzer
        </h1>

        {/* Upload + JD */}
        <div className="space-y-4">
          <input
            type="file" onChange={handleUpload}
            className="block w-full text-sm text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-white dark:bg-gray-700 p-1"
          />
          {resume && <p className="text-xs text-green-600 dark:text-green-400">✅ Selected: {resume.name}</p>}
          <textarea
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            rows="5" placeholder="Paste Job Description..."
            value={jd} onChange={(e) => setJd(e.target.value)}
          />
          <button
            onClick={handleSubmit} disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading && <Spinner />}
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>

        {/* Results section */}
        {result && (
          <div className="mt-8 space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">Results</h2>

            {/* Tab bar */}
            <div className="flex gap-2 flex-wrap">
              <TabBtn id="results"   label="📊 Results" />
              <TabBtn id="rewrite"   label="✏️ Resume Rewriter" />
              <TabBtn id="cover"     label="📝 Cover Letter" />
              <TabBtn id="interview" label="🎯 Interview Prep" />
            </div>

            {/* ══════════════ TAB: Results ══════════════ */}
            {activeTab === "results" && (
              <div className="space-y-6">
                {/* Score card */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className={`text-4xl font-extrabold ${scoreColor(result.score)}`}>{result.score}%</div>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${scoreColor(result.score)}`}>{scoreLabel(result.score)}</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mt-2">
                      <div className={`h-3 rounded-full transition-all duration-700 ${scoreBg(result.score)}`}
                        style={{ width: `${result.score}%` }} />
                    </div>
                  </div>
                  <div className="text-right text-xs text-gray-500 dark:text-gray-400 space-y-1">
                    <div>Similarity: <strong>{Math.round((result.details?.similarity || 0) * 100)}%</strong></div>
                    <div>Keyword: <strong>{Math.round((result.details?.keyword_overlap || 0) * 100)}%</strong></div>
                  </div>
                </div>

                {/* Experience Gap */}
                {Array.isArray(result.experience_gap) && result.experience_gap.length > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/30 border-l-4 border-red-500 rounded">
                    <p className="font-semibold text-red-600 mb-1">⚠️ Experience Gap</p>
                    <ul className="text-red-700 dark:text-red-200 text-sm">
                      {result.experience_gap.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}

                {/* Skills grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="font-semibold text-green-600 mb-2">✅ Matched ({result.matched_skills?.length || 0})</p>
                    <div className="flex flex-wrap gap-2">
                      {result.matched_skills?.length > 0
                        ? result.matched_skills.map((s, i) => (
                            <span key={i} className="px-3 py-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded-full font-medium">{s}</span>
                          ))
                        : <span className="text-gray-400 text-sm">None found</span>}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-red-600 mb-2">❌ Missing ({result.missing_skills?.length || 0})</p>
                    <div className="flex flex-wrap gap-2">
                      {result.missing_skills?.length > 0
                        ? result.missing_skills.map((s, i) => (
                            <span key={i} className="px-3 py-1 text-xs bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-full font-medium">{s}</span>
                          ))
                        : <span className="text-gray-400 text-sm">None — great match!</span>}
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
                      {result.overqualified.map((m, i) => <li key={i}>{m}</li>)}
                    </ul>
                  </div>
                )}

                {/* AI Feedback */}
                <div className="border border-indigo-200 dark:border-indigo-700 rounded-xl p-5 bg-indigo-50/30 dark:bg-indigo-900/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold text-indigo-700 dark:text-indigo-300">🤖 AI-Powered Feedback</p>
                      <p className="text-xs text-gray-400 mt-0.5">Powered by Groq · fast · free</p>
                    </div>
                    <div className="flex gap-2">
                      {llmFeedback && !llmFeedback.startsWith("⚠️") && (
                        <button onClick={() => copyToClipboard(llmFeedback, "feedback")}
                          className="px-3 py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200">
                          {copied === "feedback" ? "✅ Copied!" : "📋 Copy"}
                        </button>
                      )}
                      <button onClick={handleGetLLMFeedback} disabled={llmLoading}
                        className="px-4 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition flex items-center gap-2">
                        {llmLoading && <Spinner />}
                        {llmLoading ? "Thinking..." : llmFeedback ? "Regenerate" : "Get Smart Feedback"}
                      </button>
                    </div>
                  </div>
                  {llmLoading && (
                    <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                      <InlineSpinner /> Groq is generating feedback...
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
                    {coverLoading && <Spinner />} 📝 Cover Letter
                  </button>
                  <button onClick={handleInterviewPrep} disabled={interviewLoading}
                    className="bg-orange-500 text-white rounded-lg px-4 py-2 text-sm hover:bg-orange-600 disabled:opacity-50 font-medium flex items-center gap-2">
                    {interviewLoading && <Spinner />} 🎯 Interview Prep
                  </button>
                </div>
                {saveStatus && <p className="text-sm font-medium text-center mt-1">{saveStatus}</p>}
              </div>
            )}

            {/* ══════════════ TAB: Resume Rewriter ══════════════ */}
            {activeTab === "rewrite" && (
              <div className="space-y-5">
                {/* Header */}
                <div>
                  <h3 className="text-lg font-semibold text-violet-700 dark:text-violet-300">
                    ✏️ Resume Bullet Rewriter
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Paste any bullet point (or full section) from your resume. The AI rewrites it
                    with stronger verbs, better structure, and metric prompts — using only what's already in your original.
                  </p>
                </div>

                {/* Mode toggle */}
                <div className="flex gap-2">
                  <button
                    onClick={() => { setRewriteMode("single"); setRewriteResult(""); setSelectedVersion(null); }}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
                      rewriteMode === "single"
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Single Bullet
                  </button>
                  <button
                    onClick={() => { setRewriteMode("section"); setRewriteResult(""); setSelectedVersion(null); }}
                    className={`px-4 py-2 text-sm rounded-lg font-medium transition ${
                      rewriteMode === "section"
                        ? "bg-violet-600 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    Full Section
                  </button>
                </div>

                {/* Instruction hint */}
                <p className="text-xs text-gray-400 dark:text-gray-500 -mt-2">
                  {rewriteMode === "single"
                    ? "Single Bullet: paste one bullet → get 3 rewrite variants to choose from."
                    : "Full Section: paste all bullets from one job/project → get the whole section rewritten at once."}
                </p>

                {/* Missing skills — shown as reference only, not injected */}
                {result.missing_skills?.length > 0 && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 rounded-lg">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
                      📋 Missing keywords from this JD (for your reference only)
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      The rewriter will <strong>not</strong> add these automatically — only use them if you genuinely have that experience.
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.missing_skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full text-xs text-gray-600 dark:text-gray-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {rewriteMode === "single" ? "Paste bullet point:" : "Paste resume section (all bullets):"}
                  </label>
                  <textarea
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-violet-500 focus:outline-none"
                    rows={rewriteMode === "single" ? 3 : 7}
                    placeholder={
                      rewriteMode === "single"
                        ? "e.g. Led backend development for a college enquiry chatbot using FastAPI and PostgreSQL"
                        : "e.g.\n• Led backend development for chatbot using FastAPI\n• Integrated Dialogflow for NLP\n• Reduced manual workload by 60%"
                    }
                    value={bulletInput}
                    onChange={(e) => setBulletInput(e.target.value)}
                  />
                </div>

                <button
                  onClick={handleRewrite}
                  disabled={rewriteLoading || !bulletInput.trim()}
                  className="w-full py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 text-sm"
                >
                  {rewriteLoading && <Spinner />}
                  {rewriteLoading
                    ? "Rewriting..."
                    : rewriteMode === "single"
                    ? "✨ Generate 3 Rewrites"
                    : "✨ Rewrite Full Section"}
                </button>

                {rewriteLoading && (
                  <div className="flex items-center gap-2 text-gray-500 text-sm">
                    <InlineSpinner color="#7c3aed" />
                    Groq is crafting your rewrites...
                  </div>
                )}

                {/* ── Single bullet: 3 version cards ── */}
                {rewriteResult && !rewriteLoading && rewriteMode === "single" && (() => {
                  const { v1, v2, v3, why } = parseVersions(rewriteResult);
                  const versions = [
                    { label: "VERSION 1", tag: "ATS-optimized",  color: "indigo", text: v1 },
                    { label: "VERSION 2", tag: "Impact-focused", color: "green",  text: v2 },
                    { label: "VERSION 3", tag: "Concise",        color: "orange", text: v3 },
                  ];
                  const colorMap = {
                    indigo: "border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
                    green:  "border-green-300  dark:border-green-600  bg-green-50  dark:bg-green-900/20",
                    orange: "border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-900/20",
                  };
                  const btnMap = {
                    indigo: "bg-indigo-600 hover:bg-indigo-700",
                    green:  "bg-green-600  hover:bg-green-700",
                    orange: "bg-orange-500 hover:bg-orange-600",
                  };
                  return (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Choose the version that fits best:
                      </p>

                      {versions.map(({ label, tag, color, text }) =>
                        text ? (
                          <div
                            key={label}
                            className={`rounded-xl border-2 p-4 ${colorMap[color]} ${
                              selectedVersion === label ? "ring-2 ring-violet-500" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                  {label}
                                </span>
                                <span className="ml-2 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full px-2 py-0.5 text-gray-600 dark:text-gray-300">
                                  {tag}
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => copyToClipboard(text, label)}
                                  className="text-xs px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 text-gray-600 dark:text-gray-300"
                                >
                                  {copied === label ? "✅" : "📋"}
                                </button>
                                <button
                                  onClick={() => handleApplyVersion(text, label)}
                                  className={`text-xs px-3 py-1 text-white rounded-lg ${btnMap[color]} ${
                                    selectedVersion === label ? "ring-2 ring-offset-1 ring-violet-400" : ""
                                  }`}
                                >
                                  {selectedVersion === label ? "✅ Saved" : "Use This"}
                                </button>
                              </div>
                            </div>
                            <p className="text-sm text-gray-800 dark:text-gray-100 leading-relaxed">
                              {text}
                            </p>
                          </div>
                        ) : null
                      )}

                      {/* Why these work */}
                      {why && (
                        <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">💡 Why these work:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{why}</p>
                        </div>
                      )}

                      {/* Fallback: show raw output if parsing fails */}
                      {!v1 && !v2 && !v3 && (
                        <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4">
                          <LLMOutput text={rewriteResult} />
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* ── Section mode: plain output ── */}
                {rewriteResult && !rewriteLoading && rewriteMode === "section" && (
                  <div className="space-y-3">
                    <div className="bg-white dark:bg-gray-700 border border-violet-200 dark:border-violet-700 rounded-xl p-5">
                      <LLMOutput text={rewriteResult} />
                    </div>
                    <button
                      onClick={() => copyToClipboard(rewriteResult.replace(/\*\*/g, ""), "section")}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                    >
                      {copied === "section" ? "✅ Copied!" : "📋 Copy All"}
                    </button>
                  </div>
                )}

                {/* ── Saved rewrites ── */}
                {appliedBullets.length > 0 && (
                  <div className="mt-4 p-4 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-violet-700 dark:text-violet-300">
                        📌 Saved Rewrites ({appliedBullets.length})
                      </p>
                      <button
                        onClick={() => copyToClipboard(appliedBullets.map((b) => b.text).join("\n"), "saved")}
                        className="text-xs px-3 py-1 bg-violet-600 text-white rounded-lg hover:bg-violet-700"
                      >
                        {copied === "saved" ? "✅ Copied!" : "📋 Copy All"}
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {appliedBullets.map((b) => (
                        <li key={b.id} className="flex items-start gap-2 text-sm">
                          <span className="mt-0.5 text-violet-400">•</span>
                          <span className="text-gray-700 dark:text-gray-200 flex-1">{b.text}</span>
                          <button
                            onClick={() => setAppliedBullets((prev) => prev.filter((x) => x.id !== b.id))}
                            className="text-gray-400 hover:text-red-500 text-xs shrink-0"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* ══════════════ TAB: Cover Letter ══════════════ */}
            {activeTab === "cover" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-pink-600 dark:text-pink-400">📝 Generated Cover Letter</h3>
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
                    <InlineSpinner color="#ec4899" /> Writing your cover letter...
                  </div>
                )}
                {coverLetter && !coverLoading && (
                  <>
                    <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-6 text-sm leading-relaxed font-serif">
                      <LLMOutput text={coverLetter} />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => copyToClipboard(coverLetter, "cover")}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 text-gray-700 dark:text-gray-200">
                        {copied === "cover" ? "✅ Copied!" : "📋 Copy"}
                      </button>
                      <button onClick={() => {
                          const doc = new jsPDF();
                          doc.setFontSize(12);
                          doc.text(doc.splitTextToSize(coverLetter.replace(/\*\*/g, ""), 180), 14, 20);
                          doc.save("CoverLetter.pdf");
                        }}
                        className="px-4 py-2 text-sm bg-pink-100 dark:bg-pink-900 rounded-lg hover:bg-pink-200 text-pink-700 dark:text-pink-200">
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

            {/* ══════════════ TAB: Interview Prep ══════════════ */}
            {activeTab === "interview" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-600 dark:text-orange-400">🎯 Predicted Interview Questions</h3>
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
                    <InlineSpinner color="#f97316" /> Predicting questions based on your gaps...
                  </div>
                )}
                {interviewQs && !interviewLoading && (
                  <>
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-5">
                      <LLMOutput text={interviewQs} />
                    </div>
                    <button onClick={() => copyToClipboard(interviewQs, "interview")}
                      className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 text-gray-700 dark:text-gray-200">
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
