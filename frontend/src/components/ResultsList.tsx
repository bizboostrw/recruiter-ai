"use client";

import { useState } from "react";
import { AnalysisResult, EvaluatedCandidate } from "@/types";
import CandidateCard from "./CandidateCard";
import { Filter, Users, CheckCircle2, AlertCircle, XCircle, BarChart3 } from "lucide-react";
import clsx from "clsx";

interface ResultsListProps {
  result: AnalysisResult;
}

type FilterType = "all" | "Yes" | "Maybe" | "No";

export default function ResultsList({ result }: ResultsListProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const yes = result.results.filter((c) => c.recommendation === "Yes");
  const maybe = result.results.filter((c) => c.recommendation === "Maybe");
  const no = result.results.filter((c) => c.recommendation === "No");

  const filtered: EvaluatedCandidate[] =
    filter === "all" ? result.results : result.results.filter((c) => c.recommendation === filter);

  const avgScore =
    result.results.length > 0
      ? Math.round(
          result.results.reduce((sum, c) => sum + c.score, 0) /
            result.results.length
        )
      : 0;

  const FILTERS: { key: FilterType; label: string; count: number; icon: React.ElementType; color: string }[] = [
    { key: "all", label: "All", count: result.results.length, icon: Users, color: "text-slate-400" },
    { key: "Yes", label: "Strong Hire", count: yes.length, icon: CheckCircle2, color: "text-accent" },
    { key: "Maybe", label: "Consider", count: maybe.length, icon: AlertCircle, color: "text-maybe" },
    { key: "No", label: "Not Suitable", count: no.length, icon: XCircle, color: "text-danger" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-display font-bold text-white">
            {result.totalCandidates}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider">
            Total Analyzed
          </div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-display font-bold text-accent">
            {yes.length}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider">
            Strong Hires
          </div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-display font-bold text-maybe">
            {maybe.length}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider">
            To Consider
          </div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div
            className={clsx(
              "text-2xl font-display font-bold",
              avgScore >= 70
                ? "text-accent"
                : avgScore >= 45
                ? "text-maybe"
                : "text-danger"
            )}
          >
            {avgScore}
          </div>
          <div className="text-xs font-mono text-slate-500 mt-1 uppercase tracking-wider flex items-center justify-center gap-1">
            <BarChart3 size={10} /> Avg Score
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-slate-500 flex-shrink-0" />
        {FILTERS.map(({ key, label, count, icon: Icon, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={clsx(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all",
              filter === key
                ? `${color} bg-white/10 border border-white/10`
                : "text-slate-500 hover:text-slate-300 border border-transparent hover:bg-white/5"
            )}
          >
            <Icon size={11} />
            {label}
            <span
              className={clsx(
                "px-1.5 py-0.5 rounded-md text-[10px]",
                filter === key ? "bg-white/10" : "bg-white/5"
              )}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Candidate cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-mono text-sm">
          No candidates in this category
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((candidate, i) => (
            <CandidateCard key={candidate.name} candidate={candidate} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
