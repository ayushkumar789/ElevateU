import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "");

function safeJson(s) {
    if (!s) return null;
    try { return JSON.parse(s); } catch {}
    const m = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (m) { try { return JSON.parse(m[1]); } catch {} }
    const n = s.match(/\{[\s\S]*\}$/);
    if (n) { try { return JSON.parse(n[0]); } catch {} }
    return null;
}

export async function geminiAtsAnalyze({ resumeText, jobDescription }) {
    if (!process.env.GOOGLE_API_KEY) throw new Error("Missing GOOGLE_API_KEY");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" }); // or "gemini-pro"

    const prompt = `
Return STRICT JSON only with this schema:
{
  "jd_match_percent": number,      // 0-100
  "missing_keywords": string[],    // 0..n
  "profile_summary": string,       // 1-3 sentences
  "found_keywords": string[]       // optional
}

Rules:
- Use conservative scoring based on actual overlap between JD and resume.
- No extra text, no markdown fences unless valid JSON inside.

RESUME:
${(resumeText || "").slice(0, 18000)}

JOB DESCRIPTION:
${(jobDescription || "").slice(0, 8000)}
`.trim();

    const resp = await model.generateContent(prompt);
    const txt = resp.response.text();
    const parsed = safeJson(txt);
    if (!parsed || typeof parsed.jd_match_percent !== "number") {
        throw new Error("Gemini returned invalid JSON");
    }
    return {
        jd_match_percent: Math.max(0, Math.min(100, Math.round(parsed.jd_match_percent))),
        missing_keywords: Array.isArray(parsed.missing_keywords) ? parsed.missing_keywords.slice(0, 50) : [],
        profile_summary: String(parsed.profile_summary || "").slice(0, 800),
        found_keywords: Array.isArray(parsed.found_keywords) ? parsed.found_keywords.slice(0, 100) : []
    };
}
