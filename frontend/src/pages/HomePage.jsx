import React from "react";
import { Link, useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans">
      {/* Hero */}
      <section className="text-center py-20 px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 dark:text-indigo-400">
          CVisionary
        </h1>
        <h3 className="text-2xl md:text-3xl mt-5 font-semibold text-gray-800 dark:text-gray-100">
          Turn Resumes into Offers 🚀
        </h3>
        <p className="mt-6 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
          Unlocking smarter job matches and deeper resume insights for students
          and recruiters.
        </p>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-2xl max-w-5xl mx-auto p-10 mt-10 border border-gray-200 dark:border-gray-700">
        <h2 className="text-3xl font-bold text-center mb-10 bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent dark:from-indigo-300 dark:to-teal-400">
          Why Choose Us?
        </h2>
        <ul className="space-y-6 text-gray-700 dark:text-gray-300 text-lg">
          <li>
            <strong className="text-indigo-600 dark:text-indigo-400">
              📌 Actionable & Personalized Feedback:
            </strong>{" "}
            Our analyzer gives detailed, role-specific suggestions based on
            industry standards—not just simple grammar checks.
          </li>
          <li>
            <strong className="text-teal-600 dark:text-teal-400">
              🤝 Fairness & Blind Review:
            </strong>{" "}
            No bias—analyzes content, not personal details, offering suggestions
            for anonymized, skills-first resumes.
          </li>
          <li>
            <strong className="text-purple-600 dark:text-purple-400">
              ⚡ Recruiter Tooling:
            </strong>{" "}
            Advanced analytics to compare applicant skills with job
            requirements, saving time and increasing quality-of-hire.
          </li>
          <li>
            <strong className="text-pink-600 dark:text-pink-400">
              🎯 Student Advantage:
            </strong>{" "}
            ATS-optimization and personalized tips to help your resume stand out
            and land more interviews.
          </li>
        </ul>
      </section>

      {/* Trust Banner */}
      <div className="bg-white dark:bg-gray-800 shadow-lg border-l-4 border-indigo-500 p-10 rounded-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-6 mt-14 max-w-5xl mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
            🔍 Transparent Scoring You Can Trust
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mt-3 leading-relaxed">
            Unlike other ATS calculators, CVisionary explains exactly how your
            score is calculated — with semantic AI, recruiter-style tips, and
            ATS-unfriendly content checks.
          </p>
        </div>
        <div>
          <Link
            to="/scoring-transparency"
            className="inline-block px-7 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md transition-transform transform hover:scale-105"
          >
            See How Scoring Works →
          </Link>
        </div>
      </div>

      {/* Role Selector */}
      <section className="text-center mt-20 mb-12">
        <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100 mb-8">
          Continue as:
        </h3>
        <div className="flex justify-center gap-8">
          <button
            onClick={() => navigate("/student")}
            className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-lg transition-transform transform hover:scale-105"
          >
            Student
          </button>
          <button
            onClick={() => navigate("/recruiter")}
            className="px-10 py-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl shadow-lg transition-transform transform hover:scale-105"
          >
            Recruiter
          </button>
        </div>
      </section>
    </div>
  );
}
export default HomePage;
