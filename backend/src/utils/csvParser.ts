import { parse } from "csv-parse/sync";
import { Candidate } from "../types";

export function parseCSV(csvContent: string): Candidate[] {
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    cast: false,
  }) as Record<string, string>[];

  if (!records || records.length === 0) {
    throw new Error("CSV file is empty or has no valid rows");
  }

  // Normalize column headers to lowercase
  const normalized = records.map((record) => {
    const normalizedRecord: Record<string, string> = {};
    for (const [key, value] of Object.entries(record)) {
      normalizedRecord[key.toLowerCase().trim()] = value;
    }
    return normalizedRecord;
  });

  // Validate required fields
  const requiredFields = ["name"];
  for (const record of normalized) {
    for (const field of requiredFields) {
      if (!record[field]) {
        throw new Error(
          `CSV is missing required column: "${field}". Ensure your CSV has at least: name, skills, experience, education`
        );
      }
    }
  }

  return normalized.map((record) => ({
    name: record["name"] || "Unknown",
    skills: record["skills"] || record["skill"] || "Not specified",
    experience:
      record["experience"] ||
      record["years_experience"] ||
      record["years of experience"] ||
      "Not specified",
    education:
      record["education"] ||
      record["degree"] ||
      record["qualification"] ||
      "Not specified",
    ...record,
  }));
}

export function validateCSVColumns(headers: string[]): boolean {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  return normalized.includes("name");
}
