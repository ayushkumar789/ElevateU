// Smarter ATS utilities: deterministic extraction + Gemini suggestions.
// Requires: geminiExtractResume (already in ai.js), plus this file exports consistent scoring.

import { geminiExtractResume } from "./ai.js";

// naive but stable keyword extraction (skills/tech)
const TECH_WORDS = [
    "react","next","node","express","typescript","javascript","python","java","spring",
    "django","flask","fastapi","mongodb","mysql","postgres","redis","graphql","docker",
    "kubernetes","aws","gcp","azure","tailwind","html","css","git","jenkins","kafka",
    "spark","pandas","numpy","tensorflow","pytorch","sklearn","nlp","cv","golang","rust","kotlin","c++","c"
];

function tokenize(s="") { return s.toLowerCase().split(/[^a-z0-9+.#-]+/).filter(Boolean); }

export function deterministicExtract(resumeText) {
    const tokens = tokenize(resumeText);
    const skills = Array.from(new Set(tokens.filter(t => TECH_WORDS.includes(t))));
    return { skills };
}

export async function analyzeResume({ resumeText, jobDescription }) {
    // Deterministic pass
    const simple = deterministicExtract(resumeText);

    // LLM pass for summary/structure
    let llm = {};
    try {
        llm = await geminiExtractResume(resumeText);
    } catch (e) {
        llm = { summary: "", skills: simple.skills, keywords: [] };
    }

    // Compute ATS score vs JD (keyword coverage + cosine-like proxy)
    const jdTokens = new Set(tokenize(jobDescription || ""));
    const resumeTokens = new Set(tokenize(resumeText));
    const overlap = [...jdTokens].filter(w => resumeTokens.has(w));
    const coverage = jdTokens.size ? (overlap.length / jdTokens.size) : 0;
    const skillOverlap = llm.skills?.length
        ? llm.skills.filter(s => jdTokens.has(s.toLowerCase())).length / llm.skills.length
        : 0;
    const score = Math.round((0.7*coverage + 0.3*skillOverlap) * 100);

    // Missing keywords (top 10)
    const missing = [...jdTokens].filter(w => !resumeTokens.has(w)).slice(0, 10);

    // Suggestions: actionables
    const suggestions = [];
    if (missing.length) suggestions.push(`Add missing keywords: ${missing.join(", ")}`);
    if (llm.summary?.length < 120) suggestions.push("Expand your professional summary to 2–3 lines with outcomes.");
    if (!(resumeText.match(/\b\d+%\b/) || resumeText.match(/\b\d{2,}\b/))) {
        suggestions.push("Quantify impact (metrics, % improvements, time saved).");
    }

    return {
        score,
        summary: llm.summary || "",
        skills: Array.from(new Set([...(llm.skills||[]), ...simple.skills])),
        keywords: llm.keywords || [],
        missing,
        suggestions
    };
}
