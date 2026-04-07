import * as pdfParseLib from "pdf-parse";
import { Candidate } from "../types";

// pdf-parse uses a CJS default export; this handles both ESM and CJS environments
const pdfParse = (pdfParseLib as any).default ?? pdfParseLib;

/**
 * Extracts raw text from a PDF buffer using pdf-parse,
 * then does best-effort regex extraction into candidate fields.
 */
export async function parsePDFToCandidate(
  buffer: Buffer,
  filename: string
): Promise<Candidate> {
  let text = "";

  try {
    const data = await pdfParse(buffer);
    text = data.text || "";
  } catch {
    // If pdf-parse fails, fall back to filename-based stub
    text = "";
  }

  const name = extractName(text, filename);
  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const education = extractEducation(text);

  return { name, skills, experience, education };
}

// ─── Extraction helpers ───────────────────────────────────────────────────────

function extractName(text: string, filename: string): string {
  const firstLine = text
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 2 && l.length < 60 && /^[A-Za-z\s\-']+$/.test(l));

  if (firstLine) return firstLine;

  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractSkills(text: string): string {
  const lower = text.toLowerCase();

  const skillsSectionMatch = lower.match(
    /skills?[:\s\n]+([\s\S]{10,400}?)(?:\n{2,}|\b(?:experience|education|work|projects|certif))/
  );
  if (skillsSectionMatch) {
    return skillsSectionMatch[1]
      .replace(/\n/g, ", ")
      .replace(/\s{2,}/g, " ")
      .replace(/[•·▪◦\-]/g, "")
      .trim()
      .slice(0, 300);
  }

  const techKeywords = [
    "JavaScript", "TypeScript", "Python", "Java", "C#", "C++", "Go", "Rust",
    "React", "Angular", "Vue", "Next.js", "Node.js", "Express", "Django",
    "Spring", "Laravel", "Rails", "Flutter", "Swift", "Kotlin",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
    "AWS", "GCP", "Azure", "Docker", "Kubernetes", "Terraform",
    "GraphQL", "REST", "gRPC", "Kafka", "RabbitMQ",
    "Git", "CI/CD", "Linux", "Agile", "Scrum",
  ];

  const found = techKeywords.filter((kw) =>
    text.toLowerCase().includes(kw.toLowerCase())
  );
  return found.length ? found.join(", ") : "Not specified";
}

function extractExperience(text: string): string {
  const yearsMatch = text.match(
    /(\d+)\+?\s*years?\s*(?:of\s*)?(?:professional\s*)?experience/i
  );
  if (yearsMatch) return `${yearsMatch[1]} years`;

  const dateRanges = text.match(
    /(?:19|20)\d{2}\s*[-–—]\s*(?:(?:19|20)\d{2}|present|current)/gi
  );
  if (dateRanges && dateRanges.length >= 1) {
    return `${dateRanges.length} role${dateRanges.length > 1 ? "s" : ""}`;
  }

  return "Not specified";
}

function extractEducation(text: string): string {
  const degrees: Record<string, string> = {
    "ph.d": "PhD",
    "phd": "PhD",
    "doctor": "PhD",
    "master": "Master's",
    "m.sc": "MSc",
    "msc": "MSc",
    "m.eng": "MEng",
    "mba": "MBA",
    "bachelor": "Bachelor's",
    "b.sc": "BSc",
    "bsc": "BSc",
    "b.eng": "BEng",
    "b.a.": "BA",
    " ba ": "BA",
    "associate": "Associate's",
    "diploma": "Diploma",
    "bootcamp": "Bootcamp",
    "self-taught": "Self-taught",
  };

  const lower = text.toLowerCase();
  for (const [pattern, label] of Object.entries(degrees)) {
    if (lower.includes(pattern)) {
      const fieldMatch = text.match(
        new RegExp(
          `${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^\\n]{0,60}`,
          "i"
        )
      );
      if (fieldMatch) {
        return fieldMatch[0].replace(/\n/g, " ").trim().slice(0, 80);
      }
      return label;
    }
  }

  return "Not specified";
}