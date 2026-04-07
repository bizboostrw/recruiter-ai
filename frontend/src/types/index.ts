export interface JobFormData {
  title: string;
  skills: string[];
  experienceYears: number;
  description: string;
}

export interface EvaluatedCandidate {
  name: string;
  score: number;
  rank: number;
  strengths: string[];
  weaknesses: string[];
  explanation: string;
  recommendation: "Yes" | "Maybe" | "No";
  whyNotSelected?: string;
}

export interface AnalysisResult {
  jobId: string;
  jobTitle: string;
  totalCandidates: number;
  analyzedAt: string;
  results: EvaluatedCandidate[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}
