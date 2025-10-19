// server/src/utils/ai.js
// Single REST helper for Google Gemini with model auto-detection.
// Works both for interview questions, resume extraction, and ATS analysis.

const API_VERSION = process.env.GEMINI_API_VERSION || "v1";
const BASE = `https://generativelanguage.googleapis.com/${API_VERSION}/models`;

/* ------------------------------------------------------------------ */
/* Basics                                                             */
/* ------------------------------------------------------------------ */
function assertKey() {
    const k = process.env.GEMINI_API_KEY;
    if (!k) {
        const err = new Error("GEMINI_API_KEY is not set");
        err.status = 500;
        throw err;
    }
}
function getKey() {
    assertKey();
    return process.env.GEMINI_API_KEY;
}

/* Preferred order; we’ll pick the first your project actually exposes. */
const PREFERRED = [
    process.env.GEMINI_MODEL, // optional override from .env
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro",
    "gemini-pro",
].filter(Boolean);

let SELECTED = null; // cache the first working model

async function listModels() {
    assertKey();
    const url = `${BASE}?key=${getKey()}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        const err = new Error(`Gemini ListModels error: ${msg}`);
        err.status = res.status;
        throw err;
    }
    return Array.isArray(data?.models) ? data.models : [];
}
function supportsGenerateContent(m) {
    const methods = m?.supportedGenerationMethods || [];
    return methods.includes("generateContent");
}
async function ensureModel() {
    if (SELECTED) return SELECTED;
    const models = await listModels(); // [{name:"models/<id>", ...}]
    const byId = new Map(
        models.map((m) => [String(m.name || "").replace(/^models\//, ""), m])
    );
    for (const id of PREFERRED) {
        const m = byId.get(id);
        if (m && supportsGenerateContent(m)) {
            SELECTED = id;
            return SELECTED;
        }
    }
    for (const [id, m] of byId.entries()) {
        if (supportsGenerateContent(m)) {
            SELECTED = id;
            return SELECTED;
        }
    }
    const err = new Error(
        "No available Gemini model supports generateContent for this key/project."
    );
    err.status = 400;
    throw err;
}

/* Core caller that returns raw text from Gemini. */
async function callGeminiRAW(promptText) {
    assertKey();
    const model = await ensureModel();
    const url = `${BASE}/${model}:generateContent?key=${getKey()}`;

    const body = {
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            candidateCount: 1,
            // Do not set response_mime_type; some projects reject it on REST.
        },
    };

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        const err = new Error(`Gemini API error: ${msg}`);
        err.status = res.status;
        throw err;
    }

    const c = data?.candidates?.[0];
    const text = c?.content?.parts?.map((p) => p?.text || "").join("\n").trim();
    if (!text) {
        const safety = data?.promptFeedback?.safetyRatings || c?.safetyRatings;
        const reason = safety ? JSON.stringify(safety) : "no text parts";
        const err = new Error(`Gemini produced no text (${reason})`);
        err.status = 502;
        throw err;
    }

    return { text, model };
}

/* JSON helpers (robust to fences/prose) */
function parseJSONObject(jsonLike) {
    if (!jsonLike) throw new Error("Empty JSON");
    try {
        const obj = JSON.parse(jsonLike);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    } catch {}
    const fence = String(jsonLike).match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) {
        const s = fence[1];
        const obj = JSON.parse(s);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    }
    const curly = String(jsonLike).match(/\{[\s\S]*\}$/);
    if (curly) {
        const obj = JSON.parse(curly[0]);
        if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj;
    }
    throw new Error("Failed to parse JSON object from model output");
}
function parseJSONArray(jsonLike) {
    try {
        const parsed = JSON.parse(jsonLike);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed?.items)) return parsed.items;
    } catch {}
    const m = String(jsonLike).match(/\[[\s\S]*\]/);
    if (!m) throw new Error("Failed to parse JSON array from model output");
    return JSON.parse(m[0]);
}

/* Wrapper that expects JSON output explicitly */
async function callGeminiJSON(promptText) {
    const { text } = await callGeminiRAW(promptText);
    return text;
}

/* ------------------------------------------------------------------ */
/* Public APIs                                                         */
/* ------------------------------------------------------------------ */

/** Interview questions */
export async function geminiQuestions({ skillsList, count, category }) {
    const prompt = `
You are an interview question generator. Produce a JSON array with exactly ${count} items.
Each item MUST be an object with this schema:
{
  "question": string,
  "skill": string,
  "difficulty": "easy" | "medium" | "hard",
  "category": "tech" | "behavioral"
}
Candidate skills/background: ${skillsList || "general software engineering"}
Focus category: ${category || "tech"}
Return ONLY JSON.
  `.trim();

    const json = await callGeminiJSON(prompt);
    return parseJSONArray(json);
}

/** Resume extractor (summary, skills, experience etc.) */
export async function geminiExtractResume(resumeText) {
    const prompt = `
You are a resume parser. Input is a full resume as plain text.
Return ONLY a JSON object with this exact shape:
{
  "summary": string,
  "skills": string[],
  "keywords": string[],
  "education": [{ "degree": string, "school": string, "year": string }],
  "experience": [{ "title": string, "company": string, "start": string, "end": string, "highlights": string[] }],
  "projects": [{ "name": string, "highlights": string[] }],
  "certifications": string[]
}
Resume:
${(resumeText || "").slice(0, 18000)}
  `.trim();

    const json = await callGeminiJSON(prompt);

    let obj = parseJSONObject(json);
    // Normalize
    obj.skills = Array.from(new Set((obj.skills || []).map((s) => String(s).trim()).filter(Boolean)));
    obj.keywords = Array.from(new Set((obj.keywords || []).map((s) => String(s).trim()).filter(Boolean)));
    obj.education = Array.isArray(obj.education) ? obj.education : [];
    obj.experience = Array.isArray(obj.experience) ? obj.experience : [];
    obj.projects = Array.isArray(obj.projects) ? obj.projects : [];
    obj.certifications = Array.isArray(obj.certifications) ? obj.certifications : [];
    return obj;
}

/** NEW: LLM-based ATS comparison (JD match %, missing keywords, summary) */
export async function geminiAtsAnalyze({ resumeText, jobDescription }) {
    const prompt = `
Return STRICT JSON only with this schema:
{
  "jd_match_percent": number,      // 0..100
  "missing_keywords": string[],    // keywords/skills from JD not found in resume
  "profile_summary": string,       // 1-3 sentences tailored to the JD
  "found_keywords": string[]       // JD keywords detected in the resume
}

Rules:
- Base scoring on overlap between JD and resume content.
- Be conservative; do not invent facts.
- No extra commentary; return JSON only.

RESUME:
${(resumeText || "").slice(0, 18000)}

JOB DESCRIPTION:
${(jobDescription || "").slice(0, 8000)}
  `.trim();

    const json = await callGeminiJSON(prompt);
    const raw = parseJSONObject(json);

    // Normalize & clamp
    const pct = Math.max(0, Math.min(100, Math.round(Number(raw.jd_match_percent) || 0)));
    const missing = Array.isArray(raw.missing_keywords) ? raw.missing_keywords.slice(0, 50) : [];
    const found = Array.isArray(raw.found_keywords) ? raw.found_keywords.slice(0, 100) : [];
    const summary = String(raw.profile_summary || "").slice(0, 800);

    return {
        jd_match_percent: pct,
        missing_keywords: missing,
        found_keywords: found,
        profile_summary: summary,
    };
}

/* Export internals that are sometimes useful for debugging */
export { ensureModel, listModels, parseJSONArray };
