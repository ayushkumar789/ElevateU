// server/src/utils/scorer.js
// Extracts features from resume text and computes a heuristic or model-based score.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mlModel = null; // { weights: {intercept, coverage, sections, bullets, metrics} }
const modelPath = path.join(__dirname, "models", "resume_model.json");
if (fs.existsSync(modelPath)) {
    try {
        const raw = fs.readFileSync(modelPath, "utf8");
        mlModel = JSON.parse(raw);
        ["intercept", "coverage", "sections", "bullets", "metrics"].forEach(k => {
            if (typeof mlModel?.weights?.[k] !== "number") throw new Error("bad weights");
        });
    } catch {
        mlModel = null;
    }
}

export function extractResumeFeatures(resumeText = "", jobDescription = "") {
    const text = (resumeText || "") + " ";
    const lo = text.toLowerCase();
    const jd = (jobDescription || " ").toLowerCase();

    const keywords = Array.from(new Set(jd.split(/[^a-z0-9+]+/).filter(w => w.length > 3)));
    const hits = keywords.filter(k => lo.includes(k)).length;
    const coverage = keywords.length ? hits / keywords.length : 0.5; // neutral default if no JD

    const sections = ["summary", "experience", "education", "projects", "skills", "achievements"];
    const foundSections = sections.filter(s => lo.includes(s));
    const sectionsRatio = foundSections.length / sections.length;

    const bullets = (text.match(/\n\s*[-•*]/g) || []).length;
    const metrics = (text.match(/\b(\d+(\.\d+)?\s*%|\$\s*\d+|[0-9][0-9.,]*\s*(k|m|b)\b)/gi) || []).length;

    return { coverage, sectionsRatio, bullets, metrics };
}

function finalize(score, f) {
    const suggestions = [];
    if (f.coverage < 0.7) suggestions.push("Add more role-specific keywords from the JD.");
    if (f.sectionsRatio < 0.8) suggestions.push("Ensure Summary, Experience, Education, Projects, Skills, Achievements are present.");
    if (f.bullets < 6) suggestions.push("Use concise bullet points under experience/projects.");
    if (f.metrics < 2) suggestions.push("Quantify impact with metrics (%, $, time saved, scale).");
    return {
        score,
        keywordCoverage: Math.round(f.coverage * 100),
        bullets: f.bullets,
        metrics: f.metrics,
        suggestions
    };
}

export function scoreResume(resumeText = "", jobDescription = "") {
    const f = extractResumeFeatures(resumeText, jobDescription);

    if (mlModel) {
        const w = mlModel.weights;
        const raw = w.intercept + w.coverage * f.coverage + w.sections * f.sectionsRatio + w.bullets * f.bullets + w.metrics * f.metrics;
        const score = Math.max(0, Math.min(100, Math.round(raw)));
        return finalize(score, f);
    }

    // Heuristic
    let base = 50;
    base += Math.round((f.coverage - 0.5) * 40);     // -20..+20
    base += Math.round((f.sectionsRatio - 0.5) * 20);// -10..+10
    base += Math.min(10, f.bullets);                 // up to +10
    base += Math.min(10, f.metrics * 2);             // up to +10
    const score = Math.max(0, Math.min(100, base));
    return finalize(score, f);
}
