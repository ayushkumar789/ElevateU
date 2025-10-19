// Minimal helper that uses the same JSON-safe calling style as our ai.js

const API_VERSION = process.env.GEMINI_API_VERSION || "v1";
const BASE = `https://generativelanguage.googleapis.com/${API_VERSION}/models`;

function getKey(){
    const k = process.env.GEMINI_API_KEY;
    if (!k) { const e=new Error("GEMINI_API_KEY is not set"); e.status=500; throw e; }
    return k;
}

async function ensureModel() {
    // prefer env or auto-pick
    const preferred = [ process.env.GEMINI_MODEL, "gemini-1.5-pro", "gemini-1.5-flash", "gemini-1.0-pro", "gemini-pro" ].filter(Boolean);
    const res = await fetch(`${BASE}?key=${getKey()}`);
    const data = await res.json();
    const models = new Map((data.models||[]).map(m=>[String(m.name||"").replace(/^models\//,""),m]));
    for (const id of preferred) {
        const m = models.get(id);
        if (m && (m.supportedGenerationMethods||[]).includes("generateContent")) return id;
    }
    for (const [id,m] of models) {
        if ((m.supportedGenerationMethods||[]).includes("generateContent")) return id;
    }
    throw new Error("No Gemini model with generateContent available");
}

export async function callGeminiCustomJSON(instruction, inputObject) {
    const model = await ensureModel();
    const url = `${BASE}/${model}:generateContent?key=${getKey()}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `${instruction}\n\nInput JSON:\n${JSON.stringify(inputObject) }\n\nReturn ONLY JSON.` }]}],
            generationConfig: { temperature: 0.3, topP: 0.9, candidateCount: 1 }
        })
    });
    const data = await res.json().catch(()=> ({}));
    if (!res.ok) {
        const msg = data?.error?.message || `HTTP ${res.status}`;
        const e = new Error(`Gemini API error: ${msg}`); e.status = res.status; throw e;
    }
    const txt = data?.candidates?.[0]?.content?.parts?.map(p=>p?.text||"").join("\n").trim();
    if (!txt) throw new Error("Gemini produced no text");
    try { return JSON.parse(txt.replace(/^```json|```$/g,"")); }
    catch {
        const m = txt.match(/\{[\s\S]*\}$/);
        if (!m) throw new Error("Failed to parse JSON from Gemini");
        return JSON.parse(m[0]);
    }
}
