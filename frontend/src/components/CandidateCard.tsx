"use client";

import { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { EvaluatedCandidate } from "@/types";
import clsx from "clsx";

interface CandidateCardProps {
  candidate: EvaluatedCandidate;
  index: number;
}

const RECOMMENDATION_CONFIG = {
  Yes: {
    label: "Strong Hire",
    color: "text-accent",
    bg: "bg-accent/10",
    border: "border-accent/25",
    glow: "glow-green",
    dot: "bg-accent",
    icon: CheckCircle2,
  },
  Maybe: {
    label: "Consider",
    color: "text-maybe",
    bg: "bg-maybe/10",
    border: "border-maybe/25",
    glow: "glow-gold",
    dot: "bg-maybe",
    icon: AlertCircle,
  },
  No: {
    label: "Not Suitable",
    color: "text-danger",
    bg: "bg-danger/10",
    border: "border-danger/25",
    glow: "glow-red",
    dot: "bg-danger",
    icon: XCircle,
  },
};

function ScoreRing({ score }: { score: number }) {
  const size = 72;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 70 ? "#6EE7B7" : score >= 45 ? "#FBBF24" : "#F87171";

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.05)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-lg font-display font-bold leading-none"
          style={{ color }}
        >
          {score}
        </span>
        <span className="text-[9px] font-mono text-slate-500 mt-0.5">
          /100
        </span>
      </div>
    </div>
  );
}

export default function CandidateCard({ candidate, index }: CandidateCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = RECOMMENDATION_CONFIG[candidate.recommendation];
  const RecommendIcon = cfg.icon;

  const rankLabel =
    candidate.rank === 1
      ? "🥇"
      : candidate.rank === 2
      ? "🥈"
      : candidate.rank === 3
      ? "🥉"
      : `#${candidate.rank}`;

  return (
    <div
      className={clsx(
        "stagger-card rounded-2xl border overflow-hidden",
        "transition-all duration-300 hover:-translate-y-0.5",
        cfg.border,
        "bg-[#0D1220]"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Card Header */}
      <div
        className="flex items-center gap-4 p-5 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Rank Badge */}
        <div className="flex-shrink-0 w-10 text-center">
          <span className="text-lg leading-none">{rankLabel}</span>
          {candidate.rank > 3 && (
            <div className="text-[10px] font-mono text-slate-600 mt-0.5">
              rank
            </div>
          )}
        </div>

        {/* Score Ring */}
        <div className="flex-shrink-0">
          <ScoreRing score={candidate.score} />
        </div>

        {/* Name + Recommendation */}
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-white text-base leading-tight truncate">
            {candidate.name}
          </h3>
          <div className="flex items-center gap-2 mt-1.5">
            <span
              className={clsx(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium font-mono",
                cfg.bg,
                cfg.color
              )}
            >
              <RecommendIcon size={11} />
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Score bar (desktop) + expand */}
        <div className="hidden sm:flex flex-col items-end gap-2 flex-shrink-0">
          <div className="w-28 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full score-bar"
              style={{
                "--target-width": `${candidate.score}%`,
                width: `${candidate.score}%`,
                background:
                  candidate.score >= 70
                    ? "linear-gradient(90deg, #059669, #6EE7B7)"
                    : candidate.score >= 45
                    ? "linear-gradient(90deg, #D97706, #FBBF24)"
                    : "linear-gradient(90deg, #DC2626, #F87171)",
              } as React.CSSProperties}
            />
          </div>
          <span className="text-xs font-mono text-slate-500">
            {expanded ? "less detail" : "more detail"}
          </span>
        </div>

        <button
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/5 text-slate-500 hover:text-slate-300 transition-all"
          aria-label="Toggle details"
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-white/5 p-5 space-y-4 animate-fade-in">
          {/* Explanation */}
          <div className="flex gap-3">
            <Info size={14} className="text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-slate-300 leading-relaxed">
              {candidate.explanation}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Strengths */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <TrendingUp size={12} className="text-accent" />
                <span className="text-xs font-mono font-medium text-accent uppercase tracking-wider">
                  Strengths
                </span>
              </div>
              <ul className="space-y-1.5">
                {candidate.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent/60 flex-shrink-0 mt-1.5" />
                    <span className="text-sm text-slate-300">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-danger" />
                <span className="text-xs font-mono font-medium text-danger uppercase tracking-wider">
                  Gaps
                </span>
              </div>
              <ul className="space-y-1.5">
                {candidate.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger/60 flex-shrink-0 mt-1.5" />
                    <span className="text-sm text-slate-300">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Why Not Selected */}
          {candidate.recommendation === "No" && candidate.whyNotSelected && (
            <div className="flex gap-3 p-3 rounded-lg bg-danger/5 border border-danger/15">
              <XCircle size={14} className="text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-mono font-medium text-danger uppercase tracking-wider mb-1">
                  Why not selected
                </p>
                <p className="text-sm text-slate-400">{candidate.whyNotSelected}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
