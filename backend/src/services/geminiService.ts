import axios from "axios";
import { Candidate, EvaluatedCandidate, JobRequirements } from "../types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const BATCH_SIZE = 5;

function buildPrompt(job: JobRequirements, candidates: Candidate[]): string {
  const jobDescription = `
Job Title: ${job.title}
Required Skills: ${job.skills.join(", ")}
Required Experience: ${job.experienceYears} years
${job.description ? `Additional Requirements: ${job.description}` : ""}
  `.trim();

  const candidateList = candidates
    .map((c, i) => {
      const skills = Array.isArray(c.skills) ? c.skills.join(", ") : c.skills;
      return `Candidate ${i + 1}: ${c.name} | Skills: ${skills} | Experience: ${c.experience} | Education: ${c.education}`;
    })
    .join("\n");

  return `You are a technical recruiter. Evaluate candidates for this job.

JOB: ${jobDescription}

CANDIDATES:
${candidateList}

RULES:
- strengths: max 2 items, max 8 words each
- weaknesses: max 1 item, max 8 words each
- explanation: max 1 sentence
- Be terse. No fluff.

RETURN JSON ONLY, no markdown:
{"candidates":[{"name":"string","score":number,"rank":number,"strengths":["string"],"weaknesses":["string"],"explanation":"string","recommendation":"Yes"|"Maybe"|"No","whyNotSelected":"string"}]}`;
}

async function callGemini(prompt: string, apiKey: string) {
  return axios.post(
    GEMINI_API_URL,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    },
    {
      headers: { "Content-Type": "application/json" },
      params: { key: apiKey },
      timeout: 60000,
    }
  );
}

async function callGeminiFallback(prompt: string, apiKey: string) {
  return axios.post(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
      },
    },
    {
      headers: { "Content-Type": "application/json" },
      params: { key: apiKey },
      timeout: 60000,
    }
  );
}

async function evaluateBatch(
  job: JobRequirements,
  batch: Candidate[],
  apiKey: string,
  batchIndex: number
): Promise<EvaluatedCandidate[]> {
  const prompt = buildPrompt(job, batch);
  let response;

  try {
    response = await callGemini(prompt, apiKey);
  } catch (error: any) {
    console.error(
      `⚠️ Batch ${batchIndex} primary model failed:`,
      error.response?.data || error.message
    );
    try {
      console.log(`🔁 Batch ${batchIndex} trying fallback model...`);
      response = await callGeminiFallback(prompt, apiKey);
    } catch (fallbackError: any) {
      console.error(
        `❌ Batch ${batchIndex} fallback failed:`,
        fallbackError.response?.data || fallbackError.message
      );
      throw new Error(`Both models failed for batch ${batchIndex}`);
    }
  }

  const rawText: string =
    response.data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!rawText) {
    console.error(`❌ Empty response for batch ${batchIndex}:`, response.data);
    throw new Error(`Empty Gemini response for batch ${batchIndex}`);
  }

  const cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();

  if (!cleaned.endsWith("}")) {
    console.error(
      `❌ Batch ${batchIndex} response truncated. Raw output:`,
      cleaned
    );
    throw new Error(
      `Batch ${batchIndex} was truncated — try reducing BATCH_SIZE`
    );
  }

  let parsed: { candidates: EvaluatedCandidate[] };
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    console.error(
      `❌ JSON parse error in batch ${batchIndex}. Raw output:`,
      cleaned
    );
    throw new Error(`Failed to parse Gemini response for batch ${batchIndex}`);
  }

  if (!parsed.candidates || !Array.isArray(parsed.candidates)) {
    console.error(`❌ Invalid structure in batch ${batchIndex}:`, parsed);
    throw new Error(
      `Gemini response missing candidates array in batch ${batchIndex}`
    );
  }

  return parsed.candidates;
}

export async function evaluateCandidates(
  job: JobRequirements,
  candidates: Candidate[]
): Promise<EvaluatedCandidate[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  // Split into batches
  const batches: Candidate[][] = [];
  for (let i = 0; i < candidates.length; i += BATCH_SIZE) {
    batches.push(candidates.slice(i, i + BATCH_SIZE));
  }

  console.log(
    `📦 Processing ${candidates.length} candidates in ${batches.length} batch(es) of up to ${BATCH_SIZE}...`
  );

  const allEvaluated: EvaluatedCandidate[] = [];

  for (let i = 0; i < batches.length; i++) {
    console.log(
      `🔄 Batch ${i + 1}/${batches.length} — ${batches[i].length} candidates`
    );

    const batchResults = await evaluateBatch(job, batches[i], apiKey, i + 1);
    allEvaluated.push(...batchResults);

    // Delay between batches to avoid rate limiting
    if (i < batches.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  }

  // Globally re-rank all candidates by score, return top 10
  return allEvaluated
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((c, i) => ({
      ...c,
      rank: i + 1,
      score: Math.max(0, Math.min(100, Math.round(c.score))),
    }));
}