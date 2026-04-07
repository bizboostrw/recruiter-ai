"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import JobForm from "@/components/JobForm";
import CandidateInputSection, {
  CandidateRow,
} from "@/components/CandidateInputSection";
import { analyzeJob } from "@/lib/api";
import { JobFormData } from "@/types";
import {
  Sparkles,
  ArrowRight,
  Brain,
  Loader2,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import clsx from "clsx";

const DEFAULT_JOB: JobFormData = {
  title: "",
  skills: [],
  experienceYears: 3,
  description: "",
};

export default function HomePage() {
  const router = useRouter();
  const [job, setJob] = useState<JobFormData>(DEFAULT_JOB);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [candidateFile, setCandidateFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"idle" | "uploading" | "analyzing">("idle");

  const hasCandidates = candidates.length > 0;
  const canSubmit =
    !!job.title.trim() && job.skills.length > 0 && hasCandidates && !loading;

  const handleCandidatesChange = (rows: CandidateRow[], file: File | null) => {
    setCandidates(rows);
    setCandidateFile(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError(null);
    setLoading(true);
    setStep("uploading");

    try {
      await new Promise((r) => setTimeout(r, 400));
      setStep("analyzing");

      let fileToSend: File;

      if (candidateFile) {
        // CSV, Excel (already converted to CSV blob), or PDF
        fileToSend = candidateFile;
      } else {
        // Manual entry — serialize rows to CSV blob
        const header = "name,skills,experience,education";
        const rows = candidates.map(
          (c) =>
            `"${c.name}","${c.skills}","${c.experience}","${c.education}"`
        );
        const csv = [header, ...rows].join("\n");
        fileToSend = new File([csv], "candidates.csv", { type: "text/csv" });
      }

      const result = await analyzeJob(job, fileToSend);
      sessionStorage.setItem("analysisResult", JSON.stringify(result));
      router.push("/results");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as Error)?.message ||
        "Analysis failed. Please try again.";
      setError(msg);
      setStep("idle");
    } finally {
      setLoading(false);
    }
  };

  const hintMessage = !job.title
    ? "Add a job title to continue"
    : job.skills.length === 0
    ? "Add at least one required skill"
    : !hasCandidates
    ? "Add at least one candidate to continue"
    : "";

  return (
    <div className="min-h-screen grid-bg noise-overlay">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#080C14]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent/20 flex items-center justify-center">
              <Brain size={14} className="text-accent" />
            </div>
            <span className="font-display font-bold text-white tracking-tight">
              HireMindRW
            </span>
            <span className="hidden sm:block text-xs font-mono text-slate-600 border border-slate-800 rounded px-1.5 py-0.5">
              AI Recruiter
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs font-mono text-slate-600">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
            Powered by Gemini
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero */}
        <div className="text-center mb-14 space-y-4 animate-fade-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-mono mb-2">
            <Sparkles size={11} />
            AI-Powered Candidate Screening
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-tight">
            Screen smarter,{" "}
            <span className="text-gradient-green">hire faster</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto leading-relaxed">
            Add candidates your way — manually, via CSV, Excel, or PDF — and
            let AI rank, score, and explain every applicant in seconds.
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10 animate-fade-up animate-delay-200">
          {[
            { n: "01", label: "Define Role" },
            { n: "02", label: "Add Candidates" },
            { n: "03", label: "Get Results" },
          ].map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0D1220] border border-surface-border">
                <span className="text-xs font-mono text-accent">{s.n}</span>
                <span className="text-xs text-slate-400">{s.label}</span>
              </div>
              {i < 2 && <ChevronRight size={12} className="text-slate-700" />}
            </div>
          ))}
        </div>

        {/* Main Card */}
        <div className="glass rounded-2xl overflow-hidden animate-fade-up animate-delay-300">
          <div className="grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-white/5">
            {/* Left: Job Form */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-white text-lg">
                    Job Requirements
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Tell us what you&apos;re looking for
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-600 bg-white/5 px-2 py-1 rounded">
                  Step 01
                </span>
              </div>
              <JobForm value={job} onChange={setJob} />
            </div>

            {/* Right: Candidate Input */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display font-semibold text-white text-lg">
                    Candidate Pool
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Choose how to add candidates
                  </p>
                </div>
                <span className="text-xs font-mono text-slate-600 bg-white/5 px-2 py-1 rounded">
                  Step 02
                </span>
              </div>

              <CandidateInputSection
                onCandidatesChange={handleCandidatesChange}
              />

              {/* Divider */}
              <div className="border-t border-white/5 pt-6">
                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-danger/10 border border-danger/20 mb-4">
                    <AlertCircle
                      size={14}
                      className="text-danger flex-shrink-0 mt-0.5"
                    />
                    <p className="text-xs text-danger font-mono leading-relaxed">
                      {error}
                    </p>
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  className={clsx(
                    "w-full flex items-center justify-center gap-2.5",
                    "py-4 px-6 rounded-xl font-display font-semibold text-sm",
                    "transition-all duration-200",
                    canSubmit
                      ? "bg-accent text-ink hover:bg-accent-bright shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:scale-[1.01] active:scale-[0.99]"
                      : "bg-white/5 text-slate-600 cursor-not-allowed"
                  )}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {step === "uploading"
                        ? "Uploading candidates..."
                        : "Analyzing with AI..."}
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Analyze Candidates
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {!canSubmit && !loading && hintMessage && (
                  <p className="text-center text-xs text-slate-600 font-mono mt-3">
                    {hintMessage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div className="fixed inset-0 bg-[#080C14]/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="glass-elevated rounded-2xl p-8 text-center space-y-4 max-w-sm mx-6 animate-fade-up">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto animate-pulse-glow">
                <Brain size={24} className="text-accent" />
              </div>
              <div>
                <p className="font-display font-semibold text-white text-lg">
                  {step === "uploading"
                    ? "Uploading data..."
                    : "AI is analyzing..."}
                </p>
                <p className="text-sm text-slate-400 mt-1 font-mono">
                  {step === "uploading"
                    ? "Sending candidates to server"
                    : "Gemini is evaluating each candidate"}
                </p>
              </div>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-accent"
                    style={{
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="text-center mt-12 text-xs font-mono text-slate-700">
          HireMindRW · AI Recruiter · Built with Next.js + Gemini
        </footer>
      </main>
    </div>
  );
}