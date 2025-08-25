import React from "react";
import { Link, useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16 px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-indigo-700 dark:text-indigo-400">
          CVisionary
        </h1>
        <h3 className="text-xl md:text-2xl mt-3 font-semibold">
          Turn Resumes into Offers 🚀
        </h3>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Unlocking smarter job matches and deeper resume insights for students
          and recruiters.
        </p>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white dark:bg-gray-800 shadow rounded-xl max-w-4xl mx-auto p-8 mt-8">
        <h2 className="text-2xl font-bold text-center mb-6 text-indigo-600 dark:text-indigo-300">
          Why Choose Us?
        </h2>
        <ul className="space-y-4 text-gray-700 dark:text-gray-300">
          <li><strong>📌 Actionable & Personalized Feedback: </strong>Our analyzer
              gives detailed, role-specific suggestions based on industry
              standards—not just simple grammar checks.</li>
          <li><strong>🤝 Fairness & Blind Review: </strong> No bias—analyzes
              content, not personal details, offering suggestions for
              anonymized, skills-first resumes.</li>
          <li><strong>⚡ Recruiter Tooling: </strong> Advanced analytics to compare
              applicant skills with job requirements, saving time and increasing
              quality-of-hire.</li>
          <li><strong>🎯 Student Advantage: </strong> ATS-optimization and
              personalized tips to help your resume stand out and land more
              interviews.</li>
        </ul>
      </section>

      {/* Trust Banner */}
      <div className="bg-white dark:bg-gray-800 shadow-md border-l-4 border-indigo-500 p-6 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4 mt-10 max-w-4xl mx-auto">
        <div>
          <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">
            🔍 Transparent Scoring You Can Trust
          </h2>
          <p className="text-gray-700 dark:text-gray-300 mt-2">
            Unlike other ATS calculators, CVisionary explains exactly how your score 
            is calculated — with semantic AI, recruiter-style tips, and 
            ATS-unfriendly content checks.
          </p>
        </div>
        <div>
          <Link
            to="/scoring-transparency"
            className="mt-4 md:mt-0 inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition"
          >
            See How Scoring Works →
          </Link>
        </div>
      </div>

      {/* Role Selector */}
      <section className="text-center mt-12">
        <h3 className="text-xl font-semibold mb-4">Continue as:</h3>
        <div className="flex justify-center gap-6">
          <button
            onClick={() => navigate("/student")}  
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow transition"
          >
            Student
          </button>
          <button
            onClick={() => navigate("/recruiter")} 
            className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg shadow transition"
          >
            Recruiter
          </button>
        </div>
      </section>
    </div>
  );
}

export default HomePage;