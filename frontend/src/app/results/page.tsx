"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultsList from "@/components/ResultsList";
import { AnalysisResult } from "@/types";
import {
  Brain,
  ArrowLeft,
  Calendar,
  Briefcase,
  Download,
  RotateCcw,
} from "lucide-react";

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<AnalysisResult | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("analysisResult");
    if (!stored) {
      router.replace("/");
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      router.replace("/");
    }
  }, [router]);

  const handleExportCSV = () => {
    if (!result) return;
    const headers = [
      "rank",
      "name",
      "score",
      "recommendation",
      "strengths",
      "weaknesses",
      "explanation",
    ];
    const rows = result.results.map((c) => [
      c.rank,
      `"${c.name}"`,
      c.score,
      c.recommendation,
      `"${c.strengths.join("; ")}"`,
      `"${c.weaknesses.join("; ")}"`,
      `"${c.explanation}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${result.jobTitle.replace(/\s+/g, "-").toLowerCase()}-results.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080C14]">
        <div className="flex items-center gap-3 text-slate-400 font-mono text-sm">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          Loading results...
        </div>
      </div>
    );
  }

  const formattedDate = new Date(result.analyzedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen grid-bg noise-overlay">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#080C14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors font-mono"
            >
              <ArrowLeft size={14} />
              Back
            </button>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-accent/20 flex items-center justify-center">
                <Brain size={12} className="text-accent" />
              </div>
              <span className="font-display font-bold text-white text-sm tracking-tight">
                TalentSift
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-border text-xs font-mono text-slate-400 hover:text-white hover:border-white/20 transition-all"
            >
              <Download size={12} />
              Export CSV
            </button>
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/25 text-xs font-mono text-accent hover:bg-accent/20 transition-all"
            >
              <RotateCcw size={12} />
              New Analysis
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Page heading */}
        <div className="mb-8 animate-fade-up">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-mono text-accent uppercase tracking-widest">
                  Analysis Complete
                </span>
                <span className="w-1 h-1 rounded-full bg-accent/60" />
                <span className="text-xs font-mono text-slate-600">
                  Top {result.results.length} candidates shown
                </span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
                {result.jobTitle}
              </h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                  <Briefcase size={11} />
                  {result.totalCandidates} candidates analyzed
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500">
                  <Calendar size={11} />
                  {formattedDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="animate-fade-up animate-delay-200">
          <ResultsList result={result} />
        </div>

        <footer className="text-center mt-12 text-xs font-mono text-slate-700">
          TalentSift · AI Recruiter · Results powered by Gemini
        </footer>
      </main>
    </div>
  );
}
