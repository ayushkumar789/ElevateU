// server/src/utils/ai.js
// Auto-detect a supported Gemini model for your key/project.

const API_VERSION = process.env.GEMINI_API_VERSION || "v1";
const BASE = `https://generativelanguage.googleapis.com/${API_VERSION}/models`;
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



// Preferred order; we’ll pick the first that the project actually exposes.
const PREFERRED = [
    process.env.GEMINI_MODEL,          // whatever you set in .env (optional)
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0-pro",
    "gemini-pro"
].filter(Boolean);

let SELECTED = null;   // cache once we find one

async function listModels() {
    assertKey();
    const url = `${BASE}?key=${getKey()}`;
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = data?.error?.message || `HTTP ${res.status}`;
        const err = new Error(`Gemini ListModels error: ${msg}`);
        err.status = res.status;
        throw err;
    }
    const data = await res.json();
    return Array.isArray(data?.models) ? data.models : [];
}

function supportsGenerateContent(m) {
    const methods = m?.supportedGenerationMethods || [];
    return methods.includes("generateContent");
}

async function ensureModel() {
    if (SELECTED) return SELECTED;

    const models = await listModels();          // array of {name:"models/<id>", ...}
    const names = new Map(
        models.map(m => [String(m.name || "").replace(/^models\//, ""), m])
    );

    // Try preferred in order
    for (const id of PREFERRED) {
        const m = names.get(id);
        if (m && supportsGenerateContent(m)) {
            SELECTED = id;
            return SELECTED;
        }
    }

    // Otherwise pick any model that supports generateContent
    for (const [id, m] of names.entries()) {
        if (supportsGenerateContent(m)) {
            SELECTED = id;
            return SELECTED;
        }
    }

    const err = new Error("No available Gemini model supports generateContent for this key/project.");
    err.status = 400;
    throw err;
}

async function callGeminiJSON(promptText) {
    assertKey();
    const model = await ensureModel();
    const url = `${BASE}/${model}:generateContent?key=${getKey()}`;

    const body = {
        contents: [{ parts: [{ text: promptText }]}],
        generationConfig: {
            temperature: 0.2,
            topP: 0.95,
            candidateCount: 1
            // NOTE: some projects reject response_mime_type; we omit it and parse JSON by prompt.
        }
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
    const text = c?.content?.parts?.map(p => p?.text || "").join("\n").trim();
    if (!text) {
        const safety = data?.promptFeedback?.safetyRatings || c?.safetyRatings;
        const reason = safety ? JSON.stringify(safety) : "no text parts";
        const err = new Error(`Gemini produced no text (${reason})`);
        err.status = 502;
        throw err;
    }

    return text;
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

export async function geminiQuestions({ skillsList, count, category }) {
    const prompt = `
You are an interview question generator. Produce a JSON array with exactly ${count} items.
Each item MUST be an object:
{
  "question": string,
  "skill": string,
  "difficulty": "easy"|"medium"|"hard",
  "category": "tech"|"behavioral"
}
Candidate skills/background: ${skillsList || "general software engineering"}
Focus category: ${category}
Return ONLY JSON.
  `.trim();

    const json = await callGeminiJSON(prompt);
    return parseJSONArray(json);
}

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
${resumeText}
  `.trim();

    const json = await callGeminiJSON(prompt);

    let obj;
    try { obj = JSON.parse(json); }
    catch {
        const m = json.match(/\{[\s\S]*\}$/);
        if (!m) throw new Error("Failed to parse resume JSON");
        obj = JSON.parse(m[0]);
    }
    obj.skills = Array.from(new Set((obj.skills || []).map(s => String(s).trim()).filter(Boolean)));
    obj.keywords = Array.from(new Set((obj.keywords || []).map(s => String(s).trim()).filter(Boolean)));
    obj.education = Array.isArray(obj.education) ? obj.education : [];
    obj.experience = Array.isArray(obj.experience) ? obj.experience : [];
    obj.projects = Array.isArray(obj.projects) ? obj.projects : [];
    obj.certifications = Array.isArray(obj.certifications) ? obj.certifications : [];
    return obj;
}
