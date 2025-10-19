// Use Gemini to draft bullets/summary from the user's structured inputs.
// Relies on callGeminiJSON from ai.js (or geminiQuestions style).

import { geminiExtractResume } from "./ai.js";
import { callGeminiCustomJSON } from "./resume_ai_core.js"; // helper below

export async function callGeminiDraft(data) {
    const prompt = `
You are a resume writing assistant. Improve the user's resume content while keeping facts.
Return ONLY JSON with the same structure you receive, but:
- Rewrite "summary" to 2–3 strong sentences with measurable impact if possible.
- For each experience item, rewrite "notes" into 3–5 concise STAR-style bullets (newline separated).
- Keep dates/companies/titles unchanged.
- Ensure "skills" is deduplicated and relevant to the experiences/projects.
Input schema keys: name,email,phone,links,summary,experience[{title,company,start,end,tech,notes}],projects[{name,tech,notes}],education[{school,degree,year}],skills[].
  `.trim();

    const payload = { input: data };
    const out = await callGeminiCustomJSON(prompt, payload);

    // defensive: ensure required keys exist
    const safe = {
        name: out.name || data.name || "",
        email: out.email || data.email || "",
        phone: out.phone || data.phone || "",
        links: out.links || data.links || [],
        summary: out.summary || data.summary || "",
        experience: Array.isArray(out.experience) ? out.experience : data.experience || [],
        projects: Array.isArray(out.projects) ? out.projects : data.projects || [],
        education: Array.isArray(out.education) ? out.education : data.education || [],
        skills: Array.from(new Set([...(out.skills||[]), ...((data.skills)||[])]))
    };
    return safe;
}
