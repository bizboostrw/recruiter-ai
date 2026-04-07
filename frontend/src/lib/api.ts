import axios from "axios";
import { AnalysisResult, ApiResponse, JobFormData } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 120000,
});

export async function analyzeJob(
  job: JobFormData,
  fileOrFiles: File | File[]
): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append("job", JSON.stringify(job));

  const files = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
  const isPdf = files[0]?.name.endsWith(".pdf");

  if (isPdf) {
    // Send each PDF under the "pdfFiles" field
    files.forEach((f) => formData.append("pdfFiles", f));
  } else {
    // Single CSV/Excel file (Excel is already converted to CSV blob by frontend)
    formData.append("csvFile", files[0]);
  }

  const response = await apiClient.post<ApiResponse<AnalysisResult>>(
    "/api/analyze",
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  if (!response.data.success) {
    throw new Error(response.data.error || "Analysis failed");
  }

  return response.data.data;
}