// ScoreHistory.jsx — Fixed version
// Place at: src/components/ScoreHistory.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

function ScoreHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    axios
      .get("http://localhost:8000/resume/list")
      .then((res) => {
        const mine = res.data
          .filter((r) => r.student_email === user.email)
          .sort((a, b) => new Date(a.upload_time) - new Date(b.upload_time))
          .slice(-10);
        setHistory(mine);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.email]);

  if (loading || history.length < 2) return null;

  // ── Smart label: if any two entries share the same date, add time ──
  const rawDates = history.map((r) => {
    const iso = r.upload_time + (r.upload_time.endsWith("Z") ? "" : "Z");
    return new Date(iso);
  });
  const dateStrings = rawDates.map((d) =>
    d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
  );
  const hasDuplicate = dateStrings.some((d, i) => dateStrings.indexOf(d) !== i);

  const labels = rawDates.map((d) => {
    const datePart = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
    if (hasDuplicate) {
      const timePart = d.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return [datePart, timePart]; // two-line label
    }
    return [datePart];
  });

  // ── Chart dimensions ──
  const W = 580, H = 150, padL = 40, padB = 44, padT = 22;
  const innerW = W - padL - 10;
  const innerH = H - padB - padT;

  const scores = history.map((r) => Math.round(r.ats_score));
  const points = scores.map((score, i) => ({
    x: padL + (history.length === 1 ? innerW / 2 : (i / (history.length - 1)) * innerW),
    y: padT + innerH - (score / 100) * innerH,
    score,
    lines: labels[i],
  }));

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = [
    `${points[0].x},${padT + innerH}`,
    polyline,
    `${points[points.length - 1].x},${padT + innerH}`,
  ].join(" ");

  const latest = scores[scores.length - 1];
  const first = scores[0];
  const best = Math.max(...scores);
  const lineColor = latest >= 70 ? "#22c55e" : latest >= 40 ? "#eab308" : "#ef4444";
  const trendLabel = latest > first ? "📈 Improving" : latest < first ? "📉 Declining" : "➡️ Stable";
  const trendColor = latest > first ? "#22c55e" : latest < first ? "#ef4444" : "#6b7280";

  return (
    <div className="mt-2 mb-6 bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-indigo-700 dark:text-indigo-300">
          📈 Your Score History
        </h3>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Last {history.length} submission{history.length !== 1 ? "s" : ""}
        </span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: "visible" }}>
        {/* Y-axis grid */}
        {[25, 50, 75, 100].map((v) => {
          const y = padT + innerH - (v / 100) * innerH;
          return (
            <g key={v}>
              <line x1={padL} y1={y} x2={W - 10} y2={y}
                stroke="#e5e7eb" strokeWidth="0.6" strokeDasharray="3,3" />
              <text x={padL - 5} y={y + 4} textAnchor="end" fontSize="9" fill="#9ca3af">
                {v}%
              </text>
            </g>
          );
        })}

        {/* Area */}
        <polygon points={areaPoints} fill={lineColor} fillOpacity="0.08" />

        {/* Line */}
        <polyline points={polyline} fill="none" stroke={lineColor}
          strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

        {/* Points */}
        {points.map((p, i) => (
          <g key={i}>
            <text x={p.x} y={p.y - 10} textAnchor="middle"
              fontSize="11" fill={lineColor} fontWeight="600">
              {p.score}%
            </text>
            <circle cx={p.x} cy={p.y} r="5" fill={lineColor} stroke="#fff" strokeWidth="2" />
            {/* Multi-line date label */}
            {p.lines.map((line, li) => (
              <text key={li} x={p.x} y={H - padB + 14 + li * 12}
                textAnchor="middle" fontSize="9" fill="#9ca3af">
                {line}
              </text>
            ))}
          </g>
        ))}
      </svg>

      <div className="flex gap-5 mt-1 text-xs">
        <span className="text-gray-500 dark:text-gray-400">
          Best: <strong className="text-green-600">{best}%</strong>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Latest: <strong style={{ color: lineColor }}>{latest}%</strong>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Trend: <strong style={{ color: trendColor }}>{trendLabel}</strong>
        </span>
      </div>
    </div>
  );
}

export default ScoreHistory;
