export interface JobRequirements {
  title: string;
  skills: string[];
  experienceYears: number;
  description?: string;
}

export interface Candidate {
  name: string;
  skills: string;
  experience: string;
  education: string;
  [key: string]: string;
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

export interface AnalyzeRequest {
  job: JobRequirements;
  candidates: Candidate[];
}

export interface AnalyzeResponse {
  jobId: string;
  jobTitle: string;
  totalCandidates: number;
  analyzedAt: string;
  results: EvaluatedCandidate[];
}

export interface GeminiResponse {
  candidates: EvaluatedCandidate[];
}
