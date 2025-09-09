import React from "react";

function ScoringTransparency() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 py-16 px-6 font-sans transition-colors duration-300">
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <h1 className="text-5xl md:text-6xl font-extrabold text-center tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-400 dark:to-purple-300 mb-14">
          How CVisionary Calculates Your ATS Score
        </h1>

        {/* Why Transparency Section */}
        <div className="mb-16 text-lg leading-relaxed text-center max-w-3xl mx-auto">
          <p>
            At{" "}
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              CVisionary
            </span>
            , we believe in{" "}
            <span className="font-semibold">trust and fairness</span>. Unlike
            other ATS checkers that only look for keywords, our scoring method
            is a transparent, hybrid approach that blends{" "}
            <span className="font-semibold text-teal-600 dark:text-teal-400">
              semantic AI
            </span>{" "}
            with{" "}
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              job-specific skills
            </span>
            . Here’s how it works:
          </p>
        </div>

        {/* Strengths List */}
        <section className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-2xl p-10 mb-16 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent dark:from-indigo-300 dark:to-teal-400">
            ✅ Strengths of CVisionary’s ATS Calculator
          </h2>
          <ul className="list-disc list-inside space-y-3 text-lg text-gray-700 dark:text-gray-300">
            <li>
              <b>Dynamic JD skill extraction</b> – no hardcoding, always adapts
              to the job posting.
            </li>
            <li>
              <b>Skill aliases</b> – maps “c plus plus” → “C++” automatically.
            </li>
            <li>
              <b>Strictness penalty</b> – prevents generic resumes from scoring
              high if no skills match.
            </li>
            <li>
              <b>Balanced scoring</b> – 50% semantic similarity + 50% keyword
              overlap.
            </li>
            <li>
              <b>Readable explanations</b> – you see exactly <i>why</i> you got
              the score.
            </li>
            <li>
              <b>Recruiter-style recommendations</b> – tips tailored to missing
              skills & content gaps.
            </li>
            <li>
              <b>ATS-unfriendly content warnings</b> – detects tables, graphics,
              HTML tags.
            </li>
            <li>
              <b>Experience gap detection</b> – flags underqualified (e.g., JD
              10+ YOE vs resume 1 year) and overqualified candidates.
            </li>
            <li>
              <b>Work timeline parsing</b> – extracts experience from employment
              dates like "Aug 2018 – Present".
            </li>
            <li>
              <b>Fairness protections</b> – freshers cannot game senior roles,
              ensuring realistic matches.
            </li>
          </ul>
        </section>

        {/* Formula Breakdown */}
        <section className="bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-10 mb-16 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold mb-8 text-indigo-600 dark:text-indigo-400">
            📊 How the Final Score is Calculated
          </h2>
          <p className="mb-6 text-lg">
            Your final score is calculated in our{" "}
            <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded text-sm font-mono">
              ats_score_dynamic()
            </code>{" "}
            function using:
          </p>
          <pre className="bg-gray-100 dark:bg-gray-900 p-5 rounded-xl text-sm overflow-x-auto mb-6 border border-gray-200 dark:border-gray-700">
            {`Final Score = (sim_weight × semantic_similarity) 
             + (key_weight × keyword_overlap)

semantic_similarity = SBERT cosine similarity between resume & JD text (0–1).
keyword_overlap     = Matched skills ÷ JD skills (0–1).
Weights             = sim_weight = 0.5, key_weight = 0.5.

Strictness factor:
If keyword_overlap == 0 → semantic_similarity × 0.5

Experience gap penalty:
If resume YOE < JD requirement → score × 0.6 (40% reduction)`}
          </pre>

          <p className="mb-4 font-semibold text-lg">Example:</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Semantic similarity = 0.60 (60%)</li>
            <li>Keyword overlap = 0.25 (25%)</li>
            <li>
              Final Score = (0.5 × 0.60) + (0.5 × 0.25) ={" "}
              <b className="text-indigo-600 dark:text-indigo-400">42.5%</b>
            </li>
            <li>
              If no skills match → penalty applied →{" "}
              <b className="text-red-500">15%</b>
            </li>
            <li>
              If JD requires 10+ YOE but resume shows 2 years → score reduced by{" "}
              <b className="text-red-500">40%</b>.
            </li>
          </ul>
        </section>

        {/* Comparison with Other Tools */}
        <section className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-lg rounded-2xl p-10 mb-16 border border-gray-200 dark:border-gray-700">
          <h2 className="text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-purple-400">
            ⚖️ CVisionary vs Other ATS Calculators
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-6 border rounded-xl border-gray-300 dark:border-gray-700 hover:shadow-lg transition bg-gray-50 dark:bg-gray-900">
              <h3 className="font-semibold text-red-500 mb-3">
                Other ATS Tools
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Only check for keyword presence.</li>
                <li>No semantic/contextual understanding.</li>
                <li>No strictness → generic resumes score high.</li>
                <li>No experience gap detection.</li>
                <li>No parsing of work timelines.</li>
                <li>Little to no explanations.</li>
                <li>Don’t detect ATS parsing issues.</li>
              </ul>
            </div>
            <div className="p-6 border rounded-xl border-gray-300 dark:border-gray-700 bg-indigo-50 dark:bg-indigo-900 hover:shadow-lg transition">
              <h3 className="font-semibold text-indigo-600 dark:text-indigo-300 mb-3">
                CVisionary
              </h3>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <li>Hybrid: semantic similarity + keyword overlap.</li>
                <li>Strictness penalty reduces false positives.</li>
                <li>Experience gap detection (underqualified/overqualified).</li>
                <li>Employment date parsing for accurate YOE.</li>
                <li>Actionable recruiter-style recommendations.</li>
                <li>Transparent formula & open explanations.</li>
                <li>Skills coverage: matched vs missing skills view.</li>
                <li>ATS-unfriendly formatting warnings.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Bottom line */}
        <section className="text-center">
          <p className="text-2xl font-semibold leading-relaxed text-gray-800 dark:text-gray-200">
            🚀 With CVisionary, you don’t just get a score – you get{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-teal-500 bg-clip-text text-transparent dark:from-indigo-400 dark:to-teal-400">
              insight, fairness, and real recruiter-style feedback.
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}

export default ScoringTransparency;
