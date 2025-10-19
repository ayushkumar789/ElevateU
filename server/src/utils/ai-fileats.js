// server/src/utils/ai-fileats.js
import { ensureModel } from "./ai.js";
const API_VERSION = process.env.GEMINI_API_VERSION || "v1";
const BASE = `https://generativelanguage.googleapis.com/${API_VERSION}/models`;
const API_KEY = process.env.GEMINI_API_KEY;

async function callGeminiWithFile({ prompt, fileBuffer, mimeType, model }) {
    const url = `${BASE}/${model}:generateContent?key=${API_KEY}`;

    const body = {
        contents: [{
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        data: fileBuffer.toString("base64"),
                        mimeType: mimeType || "application/pdf",
                    }
                }
            ]
        }],
        generationConfig: { temperature: 0.2, topP: 0.95, candidateCount: 1 }
    };

    const r = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error?.message || `HTTP ${r.status}`);
    const text = data?.candidates?.[0]?.content?.parts?.map(p => p.text || "").join("\n").trim();
    if (!text) throw new Error("no text in model response");
    return text;
}

export async function geminiAtsFromPdfBytes({ fileBuffer, mimeType, jobDescription }) {
    // you can reuse your ensureModel() from utils/ai.js; hardcode one here for clarity
    const model = await ensureModel();

    const prompt = `
Return STRICT JSON only with this schema:
{
  "jd_match_percent": number,      // 0..100
  "missing_keywords": string[],    // keywords from JD not found in resume
  "profile_summary": string        // 1-3 sentences
}

If a Job Description is provided, base the score on JD vs resume.
If no JD is provided, score by general ATS heuristics (section completeness,
action verbs, quantifiable impact, skills density, recency, clarity).

JOB DESCRIPTION (may be empty):
${(jobDescription || "").slice(0, 8000)}

The next part is a PDF file containing the resume. Read it fully.
`.trim();

    const raw = await callGeminiWithFile({ prompt, fileBuffer, mimeType, model });

    // robust JSON parse (fenced or plain)
    const m1 = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const jsonStr = m1 ? m1[1] : raw;
    const out = JSON.parse(jsonStr);
    return {
        jd_match_percent: Math.max(0, Math.min(100, Math.round(Number(out.jd_match_percent) || 0))),
        missing_keywords: Array.isArray(out.missing_keywords) ? out.missing_keywords.slice(0, 50) : [],
        profile_summary: String(out.profile_summary || "").slice(0, 800),
    };
}
