"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus, Briefcase, Zap, Clock } from "lucide-react";
import { JobFormData } from "@/types";
import clsx from "clsx";

interface JobFormProps {
  value: JobFormData;
  onChange: (data: JobFormData) => void;
}

export default function JobForm({ value, onChange }: JobFormProps) {
  const [skillInput, setSkillInput] = useState("");

  const update = (field: keyof JobFormData, val: unknown) => {
    onChange({ ...value, [field]: val });
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !value.skills.includes(trimmed)) {
      update("skills", [...value.skills, trimmed]);
      setSkillInput("");
    }
  };

  const removeSkill = (skill: string) => {
    update(
      "skills",
      value.skills.filter((s) => s !== skill)
    );
  };

  const handleSkillKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  return (
    <div className="space-y-6">
      {/* Job Title */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-mono font-medium text-slate-400 uppercase tracking-widest">
          <Briefcase size={12} className="text-accent" />
          Job Title
          <span className="text-accent">*</span>
        </label>
        <input
          type="text"
          value={value.title}
          onChange={(e) => update("title", e.target.value)}
          placeholder="e.g. Senior Full-Stack Engineer"
          className={clsx(
            "w-full px-4 py-3 rounded-xl font-body text-sm",
            "bg-[#0D1220] border border-surface-border",
            "text-white placeholder:text-slate-600",
            "focus:outline-none focus:border-accent/50 focus:bg-[#0D1525]",
            "transition-all duration-200"
          )}
        />
      </div>

      {/* Skills */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-mono font-medium text-slate-400 uppercase tracking-widest">
          <Zap size={12} className="text-accent" />
          Required Skills
          <span className="text-accent">*</span>
        </label>
        <div
          className={clsx(
            "min-h-[52px] px-3 py-2.5 rounded-xl",
            "bg-[#0D1220] border border-surface-border",
            "focus-within:border-accent/50 focus-within:bg-[#0D1525]",
            "transition-all duration-200"
          )}
        >
          <div className="flex flex-wrap gap-2 mb-2">
            {value.skills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-xs font-medium font-mono"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="hover:text-white transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={handleSkillKeyDown}
              placeholder={
                value.skills.length === 0
                  ? "Type a skill and press Enter..."
                  : "Add more skills..."
              }
              className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-600 focus:outline-none"
            />
            <button
              type="button"
              onClick={addSkill}
              disabled={!skillInput.trim()}
              className="p-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <Plus size={12} />
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-600 font-mono">
          Press Enter or comma to add each skill
        </p>
      </div>

      {/* Experience */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-mono font-medium text-slate-400 uppercase tracking-widest">
          <Clock size={12} className="text-accent" />
          Minimum Experience (years)
          <span className="text-accent">*</span>
        </label>
        <div className="flex items-center gap-3">
          {[0, 1, 2, 3, 5, 7, 10].map((yr) => (
            <button
              key={yr}
              type="button"
              onClick={() => update("experienceYears", yr)}
              className={clsx(
                "px-3 py-2 rounded-lg text-sm font-mono font-medium transition-all duration-150",
                value.experienceYears === yr
                  ? "bg-accent text-ink font-bold shadow-lg shadow-accent/20"
                  : "bg-[#0D1220] border border-surface-border text-slate-400 hover:border-accent/40 hover:text-accent"
              )}
            >
              {yr === 0 ? "Any" : `${yr}+`}
            </button>
          ))}
          <input
            type="number"
            min={0}
            max={30}
            value={value.experienceYears}
            onChange={(e) =>
              update("experienceYears", Number(e.target.value) || 0)
            }
            className="w-16 px-3 py-2 rounded-lg bg-[#0D1220] border border-surface-border text-sm text-white font-mono text-center focus:outline-none focus:border-accent/50 transition-all"
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-xs font-mono font-medium text-slate-400 uppercase tracking-widest">
          Additional Requirements
          <span className="text-slate-600 font-normal">(optional)</span>
        </label>
        <textarea
          value={value.description}
          onChange={(e) => update("description", e.target.value)}
          placeholder="e.g. Must have experience with distributed systems, remote work friendly..."
          rows={3}
          className={clsx(
            "w-full px-4 py-3 rounded-xl font-body text-sm resize-none",
            "bg-[#0D1220] border border-surface-border",
            "text-white placeholder:text-slate-600",
            "focus:outline-none focus:border-accent/50 focus:bg-[#0D1525]",
            "transition-all duration-200"
          )}
        />
      </div>
    </div>
  );
}
