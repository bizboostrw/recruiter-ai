import { Router, Request, Response, NextFunction } from "express";
import multer from "multer";
import { parseCSV } from "../utils/csvParser";
import { parsePDFToCandidate } from "../utils/pdfParser";
import { evaluateCandidates } from "../services/geminiService";
import { AnalysisResult } from "../models/AnalysisResult";
import { AnalyzeRequest, Candidate } from "../types";
import { createError } from "../middleware/errorHandler";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB to support multiple PDFs
  fileFilter: (_req, file, cb) => {
    const allowed =
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/pdf" ||
      file.originalname.endsWith(".csv") ||
      file.originalname.endsWith(".xlsx") ||
      file.originalname.endsWith(".xls") ||
      file.originalname.endsWith(".pdf");

    if (allowed) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV, Excel, or PDF files are allowed"));
    }
  },
});

// Accept either a single csvFile OR multiple pdfFiles
const uploadFields = upload.fields([
  { name: "csvFile", maxCount: 1 },
  { name: "pdfFiles", maxCount: 20 },
]);

// POST /api/analyze
router.post(
  "/",
  uploadFields,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // ── Parse job ──────────────────────────────────────────────────
      let job: AnalyzeRequest["job"];
      try {
        const jobData =
          typeof req.body.job === "string"
            ? JSON.parse(req.body.job)
            : req.body.job;

        if (!jobData?.title) throw createError("Job title is required", 400);
        if (!jobData?.skills || !Array.isArray(jobData.skills))
          throw createError("Job skills must be an array", 400);

        job = {
          title: jobData.title,
          skills: jobData.skills,
          experienceYears: Number(jobData.experienceYears) || 0,
          description: jobData.description || "",
        };
      } catch (e) {
        if ((e as any).isOperational) throw e;
        throw createError("Invalid job data format", 400);
      }

      // ── Resolve uploaded files ─────────────────────────────────────
      const files = req.files as
        | { csvFile?: Express.Multer.File[]; pdfFiles?: Express.Multer.File[] }
        | undefined;

      const csvFile = files?.csvFile?.[0];
      const pdfFiles = files?.pdfFiles ?? [];

      if (!csvFile && pdfFiles.length === 0) {
        throw createError(
          "Please upload a CSV file, Excel file, or at least one PDF resume",
          400
        );
      }

      // ── Parse candidates ───────────────────────────────────────────
      let candidates: Candidate[] = [];

      if (csvFile) {
        // Handles both CSV and Excel-converted-to-CSV (frontend converts Excel → CSV blob)
        const csvContent = csvFile.buffer.toString("utf-8");
        try {
          candidates = parseCSV(csvContent);
        } catch (e) {
          throw createError(`File parsing error: ${(e as Error).message}`, 400);
        }

        if (candidates.length === 0)
          throw createError("No candidates found in file", 400);
        if (candidates.length > 100)
          throw createError("Maximum 100 candidates allowed per analysis", 400);
      } else if (pdfFiles.length > 0) {
        // Parse each PDF resume in parallel
        console.log(`📄 Parsing ${pdfFiles.length} PDF resume(s)...`);
        try {
          candidates = await Promise.all(
            pdfFiles.map((f) => parsePDFToCandidate(f.buffer, f.originalname))
          );
        } catch (e) {
          throw createError(
            `PDF parsing error: ${(e as Error).message}`,
            400
          );
        }

        if (candidates.length === 0)
          throw createError("No candidates could be extracted from PDFs", 400);
      }

      // ── AI evaluation ──────────────────────────────────────────────
      let results;
      try {
        results = await evaluateCandidates(job, candidates);
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes("API key"))
          throw createError("Gemini API key is invalid or missing", 500);
        throw createError(`AI evaluation failed: ${msg}`, 500);
      }

      // ── Save to MongoDB ────────────────────────────────────────────
      let savedAnalysis;
      try {
        savedAnalysis = await AnalysisResult.create({
          jobTitle: job.title,
          jobSkills: job.skills,
          jobExperience: job.experienceYears,
          jobDescription: job.description,
          totalCandidates: candidates.length,
          results,
          analyzedAt: new Date(),
        });
      } catch (e) {
        console.error("MongoDB save error:", e);
      }

      res.json({
        success: true,
        data: {
          jobId: savedAnalysis?._id?.toString() || "unsaved",
          jobTitle: job.title,
          totalCandidates: candidates.length,
          analyzedAt: new Date().toISOString(),
          results,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/analyze/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analysis = await AnalysisResult.findById(req.params.id);
    if (!analysis) throw createError("Analysis not found", 404);
    res.json({ success: true, data: analysis });
  } catch (err) {
    next(err);
  }
});

// GET /api/analyze
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const analyses = await AnalysisResult.find()
      .sort({ analyzedAt: -1 })
      .limit(20)
      .select("jobTitle totalCandidates analyzedAt _id");
    res.json({ success: true, data: analyses });
  } catch (err) {
    next(err);
  }
});

export default router;