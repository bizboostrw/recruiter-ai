import mongoose, { Document, Schema } from "mongoose";

export interface IAnalysisResult extends Document {
  jobTitle: string;
  jobSkills: string[];
  jobExperience: number;
  jobDescription?: string;
  totalCandidates: number;
  results: {
    name: string;
    score: number;
    rank: number;
    strengths: string[];
    weaknesses: string[];
    explanation: string;
    recommendation: string;
    whyNotSelected?: string;
  }[];
  analyzedAt: Date;
}

const CandidateResultSchema = new Schema({
  name: { type: String, required: true },
  score: { type: Number, required: true },
  rank: { type: Number, required: true },
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  explanation: { type: String, required: true },
  recommendation: { type: String, enum: ["Yes", "Maybe", "No"], required: true },
  whyNotSelected: { type: String },
});

const AnalysisResultSchema = new Schema<IAnalysisResult>(
  {
    jobTitle: { type: String, required: true },
    jobSkills: [{ type: String }],
    jobExperience: { type: Number, required: true },
    jobDescription: { type: String },
    totalCandidates: { type: Number, required: true },
    results: [CandidateResultSchema],
    analyzedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const AnalysisResult = mongoose.model<IAnalysisResult>(
  "AnalysisResult",
  AnalysisResultSchema
);
