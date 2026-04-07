"use client";

import { useCallback, useState } from "react";
import {
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  FileSpreadsheet,
  FileScan,
  UserPlus,
  Users,
} from "lucide-react";
import clsx from "clsx";
import * as XLSX from "xlsx";

export interface CandidateRow {
  name: string;
  skills: string;
  experience: string;
  education: string;
}

interface CandidateInputSectionProps {
  onCandidatesChange: (candidates: CandidateRow[], file: File | null) => void;
}

type InputMode = "manual" | "csv" | "excel" | "pdf";

const EMPTY_CANDIDATE: CandidateRow = {
  name: "",
  skills: "",
  experience: "",
  education: "",
};

const MODE_CONFIG: Record<
  InputMode,
  { label: string; icon: React.ReactNode; desc: string }
> = {
  manual: {
    label: "Manual Entry",
    icon: <UserPlus size={14} />,
    desc: "Add candidates one by one",
  },
  csv: {
    label: "CSV Upload",
    icon: <FileText size={14} />,
    desc: "Bulk import from .csv",
  },
  excel: {
    label: "Excel Upload",
    icon: <FileSpreadsheet size={14} />,
    desc: "Bulk import from .xlsx",
  },
  pdf: {
    label: "PDF / CV",
    icon: <FileScan size={14} />,
    desc: "Parse resumes directly",
  },
};

export default function CandidateInputSection({
  onCandidatesChange,
}: CandidateInputSectionProps) {
  const [mode, setMode] = useState<InputMode>("manual");

  // Manual state
  const [manualRows, setManualRows] = useState<CandidateRow[]>([
    { ...EMPTY_CANDIDATE },
  ]);

  // File state (csv / excel / pdf)
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedCount, setParsedCount] = useState<number | null>(null);

  // PDF state
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);

  // ─── Manual helpers ───────────────────────────────────────────────
  const updateRow = (idx: number, field: keyof CandidateRow, val: string) => {
    const updated = manualRows.map((r, i) =>
      i === idx ? { ...r, [field]: val } : r
    );
    setManualRows(updated);
    const valid = updated.filter((r) => r.name.trim());
    onCandidatesChange(valid, null);
  };

  const addRow = () => {
    setManualRows((prev) => [...prev, { ...EMPTY_CANDIDATE }]);
  };

  const removeRow = (idx: number) => {
    const updated = manualRows.filter((_, i) => i !== idx);
    setManualRows(updated.length ? updated : [{ ...EMPTY_CANDIDATE }]);
    const valid = updated.filter((r) => r.name.trim());
    onCandidatesChange(valid, null);
  };

  // ─── CSV / Excel helpers ──────────────────────────────────────────
  const parseCSVText = (text: string): CandidateRow[] => {
    const lines = text.split("\n").filter((l) => l.trim());
    if (lines.length < 2)
      throw new Error("CSV must have a header row and at least one candidate");

    const headers = lines[0]
      .toLowerCase()
      .split(",")
      .map((h) => h.trim().replace(/"/g, ""));
    const nameIdx = headers.findIndex((h) => h.includes("name"));
    const skillsIdx = headers.findIndex((h) => h.includes("skill"));
    const expIdx = headers.findIndex((h) => h.includes("exp"));
    const eduIdx = headers.findIndex((h) => h.includes("edu"));

    if (nameIdx === -1) throw new Error("CSV must have a 'name' column");

    return lines
      .slice(1)
      .map((line) => {
        const cols = line.split(",").map((c) => c.trim().replace(/"/g, ""));
        return {
          name: cols[nameIdx] || "",
          skills: skillsIdx >= 0 ? cols[skillsIdx] || "" : "",
          experience: expIdx >= 0 ? cols[expIdx] || "" : "",
          education: eduIdx >= 0 ? cols[eduIdx] || "" : "",
        };
      })
      .filter((r) => r.name);
  };

  const parseExcel = (buffer: ArrayBuffer): CandidateRow[] => {
    const wb = XLSX.read(buffer, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const raw = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
      defval: "",
    });

    return raw
      .map((row) => {
        const get = (hint: string) => {
          const k = Object.keys(row).find((k) =>
            k.toLowerCase().includes(hint)
          );
          return k ? String(row[k]) : "";
        };
        return {
          name: get("name"),
          skills: get("skill"),
          experience: get("exp"),
          education: get("edu"),
        };
      })
      .filter((r) => r.name);
  };

  const handleFileSelect = async (f: File) => {
    setFileError(null);
    setParsedCount(null);
    setFile(null);

    if (f.size > 5 * 1024 * 1024) {
      setFileError("File too large (max 5MB)");
      return;
    }

    try {
      if (mode === "csv") {
        if (!f.name.endsWith(".csv")) {
          setFileError("Please upload a .csv file");
          return;
        }
        const text = await f.text();
        const rows = parseCSVText(text);
        if (!rows.length) throw new Error("No valid candidates found in CSV");
        setParsedCount(rows.length);
        setFile(f);
        onCandidatesChange(rows, f);
      } else if (mode === "excel") {
        if (!f.name.match(/\.xlsx?$/)) {
          setFileError("Please upload a .xlsx or .xls file");
          return;
        }
        const buffer = await f.arrayBuffer();
        const rows = parseExcel(buffer);
        if (!rows.length)
          throw new Error("No valid candidates found in spreadsheet");
        setParsedCount(rows.length);
        setFile(f);
        // Convert Excel rows to CSV blob for backend (backend only accepts CSV)
        const header = "name,skills,experience,education";
        const csvRows = rows.map(
          (r) => `"${r.name}","${r.skills}","${r.experience}","${r.education}"`
        );
        const csvBlob = new File(
          [[header, ...csvRows].join("\n")],
          f.name.replace(/\.xlsx?$/, ".csv"),
          { type: "text/csv" }
        );
        onCandidatesChange(rows, csvBlob);
      }
    } catch (e: unknown) {
      setFileError(
        e instanceof Error ? e.message : "Failed to parse file"
      );
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) handleFileSelect(dropped);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode]
  );

  // ─── PDF helpers ──────────────────────────────────────────────────
  const handlePdfSelect = (files: FileList) => {
    const pdfs = Array.from(files).filter((f) => f.name.endsWith(".pdf"));
    if (!pdfs.length) return;
    const updated = [...pdfFiles, ...pdfs].slice(0, 20);
    setPdfFiles(updated);
    const rows: CandidateRow[] = updated.map((f) => ({
      name: f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
      skills: "",
      experience: "",
      education: "",
    }));
    onCandidatesChange(rows, updated[0]);
  };

  const removePdf = (idx: number) => {
    const updated = pdfFiles.filter((_, i) => i !== idx);
    setPdfFiles(updated);
    if (!updated.length) {
      onCandidatesChange([], null);
    } else {
      const rows: CandidateRow[] = updated.map((f) => ({
        name: f.name.replace(/\.pdf$/i, "").replace(/[-_]/g, " "),
        skills: "",
        experience: "",
        education: "",
      }));
      onCandidatesChange(rows, updated[0]);
    }
  };

  // ─── Mode switch ──────────────────────────────────────────────────
  const switchMode = (m: InputMode) => {
    setMode(m);
    setFile(null);
    setFileError(null);
    setParsedCount(null);
    setPdfFiles([]);
    setManualRows([{ ...EMPTY_CANDIDATE }]);
    onCandidatesChange([], null);
  };

  const formatBytes = (b: number) =>
    b < 1024
      ? `${b} B`
      : b < 1024 * 1024
      ? `${(b / 1024).toFixed(1)} KB`
      : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const acceptMap: Record<InputMode, string> = {
    manual: "",
    csv: ".csv",
    excel: ".xlsx,.xls",
    pdf: ".pdf",
  };

  return (
    <div className="space-y-5">
      {/* Mode tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 rounded-xl bg-[#080C14] border border-surface-border">
        {(Object.keys(MODE_CONFIG) as InputMode[]).map((m) => {
          const cfg = MODE_CONFIG[m];
          const active = mode === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              className={clsx(
                "flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg text-center transition-all duration-150",
                active
                  ? "bg-accent/15 border border-accent/30 text-accent"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
              )}
            >
              <span className={active ? "text-accent" : "text-slate-500"}>
                {cfg.icon}
              </span>
              <span className="text-xs font-mono font-medium leading-none">
                {cfg.label}
              </span>
              <span
                className={clsx(
                  "text-[10px] font-mono leading-none",
                  active ? "text-accent/70" : "text-slate-700"
                )}
              >
                {cfg.desc}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Manual Entry ── */}
      {mode === "manual" && (
        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_1.5fr_1fr_1fr_auto] gap-2 px-1">
            {["Name *", "Skills", "Experience", "Education", ""].map((h) => (
              <span
                key={h}
                className="text-[10px] font-mono text-slate-600 uppercase tracking-wider"
              >
                {h}
              </span>
            ))}
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {manualRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[1fr_1.5fr_1fr_1fr_auto] gap-2 items-center"
              >
                {(
                  ["name", "skills", "experience", "education"] as const
                ).map((field) => (
                  <input
                    key={field}
                    type="text"
                    value={row[field]}
                    onChange={(e) => updateRow(idx, field, e.target.value)}
                    placeholder={
                      field === "name"
                        ? "Jane Doe"
                        : field === "skills"
                        ? "React, Node.js"
                        : field === "experience"
                        ? "3 years"
                        : "BSc CS"
                    }
                    className={clsx(
                      "w-full px-2.5 py-2 rounded-lg text-xs font-mono",
                      "bg-[#0D1220] border border-surface-border",
                      "text-white placeholder:text-slate-700",
                      "focus:outline-none focus:border-accent/40 transition-all",
                      field === "name" && !row.name && "border-slate-700"
                    )}
                  />
                ))}
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  disabled={manualRows.length === 1}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-danger hover:bg-danger/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-surface-border text-slate-500 hover:border-accent/30 hover:text-accent text-xs font-mono transition-all"
          >
            <Plus size={12} />
            Add candidate row
          </button>

          {manualRows.filter((r) => r.name.trim()).length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-accent/70">
              <Users size={11} />
              {manualRows.filter((r) => r.name.trim()).length} candidate
              {manualRows.filter((r) => r.name.trim()).length !== 1
                ? "s"
                : ""}{" "}
              ready
            </div>
          )}
        </div>
      )}

      {/* ── CSV / Excel Upload ── */}
      {(mode === "csv" || mode === "excel") && (
        <div className="space-y-3">
          {file ? (
            <div className="flex items-center gap-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
              <div className="w-10 h-10 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
                {mode === "csv" ? (
                  <FileText size={18} className="text-accent" />
                ) : (
                  <FileSpreadsheet size={18} className="text-accent" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate font-mono">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {formatBytes(file.size)} ·{" "}
                  <span className="text-accent">
                    {parsedCount} candidates parsed
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-accent flex-shrink-0" />
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setParsedCount(null);
                    onCandidatesChange([], null);
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ) : (
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={clsx(
                "flex flex-col items-center justify-center gap-3",
                "p-8 rounded-xl border-2 border-dashed cursor-pointer",
                "transition-all duration-200",
                isDragging
                  ? "border-accent/60 bg-accent/5 scale-[1.01]"
                  : "border-surface-border hover:border-accent/30 hover:bg-white/[0.02]"
              )}
            >
              <input
                type="file"
                accept={acceptMap[mode]}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileSelect(f);
                  e.target.value = "";
                }}
                className="sr-only"
              />
              <div
                className={clsx(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                  isDragging ? "bg-accent/20" : "bg-[#0D1220]"
                )}
              >
                {mode === "csv" ? (
                  <FileText
                    size={20}
                    className={isDragging ? "text-accent" : "text-slate-500"}
                  />
                ) : (
                  <FileSpreadsheet
                    size={20}
                    className={isDragging ? "text-accent" : "text-slate-500"}
                  />
                )}
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-slate-300">
                  {isDragging
                    ? "Drop it here"
                    : `Drop your ${
                        mode === "csv" ? "CSV" : "Excel file"
                      } here`}
                </p>
                <p className="text-xs text-slate-600 mt-1 font-mono">
                  or click to browse · max 5MB ·{" "}
                  {mode === "csv" ? ".csv" : ".xlsx / .xls"}
                </p>
              </div>
            </label>
          )}

          {fileError && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-danger/10 border border-danger/20">
              <AlertCircle size={14} className="text-danger flex-shrink-0" />
              <p className="text-xs text-danger font-mono">{fileError}</p>
            </div>
          )}

          {/* Format hint */}
          <div className="p-3 rounded-lg bg-[#0D1220] border border-surface-border">
            <p className="text-[10px] font-mono text-slate-600 mb-1.5 uppercase tracking-wider">
              Expected columns
            </p>
            <div className="font-mono text-xs flex flex-wrap gap-x-1 gap-y-0.5">
              {["name", "skills", "experience", "education"].map((col, i) => (
                <span key={col}>
                  <span
                    className={clsx(
                      i === 0
                        ? "text-accent"
                        : i === 1
                        ? "text-blue-400"
                        : i === 2
                        ? "text-purple-400"
                        : "text-yellow-400"
                    )}
                  >
                    {col}
                  </span>
                  {i < 3 && <span className="text-slate-700">,</span>}
                </span>
              ))}
            </div>
            <p className="font-mono text-[10px] text-slate-600 mt-1">
              Alice Kim, React TypeScript, 5 years, BSc CS
            </p>
          </div>
        </div>
      )}

      {/* ── PDF / CV Upload ── */}
      {mode === "pdf" && (
        <div className="space-y-3">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handlePdfSelect(e.dataTransfer.files);
            }}
            className={clsx(
              "flex flex-col items-center justify-center gap-3",
              "p-6 rounded-xl border-2 border-dashed cursor-pointer",
              "transition-all duration-200",
              isDragging
                ? "border-accent/60 bg-accent/5"
                : "border-surface-border hover:border-accent/30 hover:bg-white/[0.02]"
            )}
          >
            <input
              type="file"
              accept=".pdf"
              multiple
              onChange={(e) => {
                if (e.target.files) handlePdfSelect(e.target.files);
                e.target.value = "";
              }}
              className="sr-only"
            />
            <div
              className={clsx(
                "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                isDragging ? "bg-accent/20" : "bg-[#0D1220]"
              )}
            >
              <FileScan
                size={18}
                className={isDragging ? "text-accent" : "text-slate-500"}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-300">
                {pdfFiles.length ? "Drop more CVs to add" : "Drop PDF resumes here"}
              </p>
              <p className="text-xs text-slate-600 mt-0.5 font-mono">
                Multiple files supported · max 20 CVs · .pdf only
              </p>
            </div>
          </label>

          {pdfFiles.length > 0 && (
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {pdfFiles.map((f, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0D1220] border border-surface-border group"
                >
                  <FileScan size={13} className="text-accent flex-shrink-0" />
                  <span className="flex-1 text-xs font-mono text-slate-300 truncate">
                    {f.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-600">
                    {formatBytes(f.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePdf(idx)}
                    className="p-1 rounded text-slate-600 hover:text-danger hover:bg-danger/10 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pdfFiles.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs font-mono text-accent/70">
              <Users size={11} />
              {pdfFiles.length} CV{pdfFiles.length !== 1 ? "s" : ""} uploaded
              — AI will extract candidate details
            </div>
          )}

          <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/15">
            <AlertCircle
              size={13}
              className="text-amber-500/70 flex-shrink-0 mt-0.5"
            />
            <p className="text-[11px] font-mono text-amber-500/70 leading-relaxed">
              PDF parsing is handled server-side. Each PDF is sent to the
              backend where text is extracted and parsed into candidate data.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}