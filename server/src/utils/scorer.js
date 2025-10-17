// Feature extraction + single scoring function used by both register and resume.
// If an ML model is present (./models/resume_model.json), we’ll use it; else heuristic.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mlModel = null; // { weights: {intercept, coverage, sections, bullets, metrics} }
const modelPath = path.join(__dirname, "models", "resume_model.json");
if (fs.existsSync(modelPath)) {
    try {
        mlModel = JSON.parse(fs.readFileSync(modelPath, "utf8"));
        // basic sanity
        ["intercept", "coverage", "sections", "bullets", "metrics"].forEach(k => {
            if (typeof mlModel.weights?.[k] !== "number") throw new Error("bad weights");
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
    const coverage = keywords.length ? (hits / keywords.length) : 0; // 0..1

    const sections = ["summary","experience","education","projects","skills","achievements"];
    const sectionsPresent = sections.reduce((a,s)=> a + (lo.includes(s) ? 1 : 0), 0);
    const sectionsRatio = sectionsPresent / sections.length; // 0..1

    const bullets = (text.match(/\n\s*[-•*]/g) || []).length;  // count
    const metrics = (text.match(/\b(\d+%|\d+k|\$\d+|\d+\s?(months?|years?))\b/gi) || []).length;

    return { coverage, sectionsRatio, bullets, metrics };
}

function clamp(x, min=0, max=100){ return Math.max(min, Math.min(max, x)); }

export function scoreResume(resumeText = "", jobDescription = "") {
    const f = extractResumeFeatures(resumeText, jobDescription);

    // If ML model exists, use linear model -> 0..100
    if (mlModel) {
        const w = mlModel.weights;
        const raw =
            w.intercept +
            w.coverage * f.coverage +
            w.sections * f.sectionsRatio +
            w.bullets  * Math.min(10, f.bullets) +
            w.metrics  * Math.min(10, f.metrics);
        const score = clamp(Math.round(raw));
        return finalize(score, f);
    }

    // Heuristic fallback (stable and consistent across app)
    let score = Math.round(
        55 * f.coverage +      // JD alignment matters most
        25 * f.sectionsRatio + // structure matters a lot
        2  * Math.min(10, f.bullets) + // bullet quality
        2  * Math.min(10, f.metrics)   // metrics/impact
    );
    score = clamp(score);

    return finalize(score, f);
}

function finalize(score, f){
    const suggestions = [];
    if (f.coverage < 0.7) suggestions.push("Add more role-specific keywords from the JD.");
    if (f.sectionsRatio < 0.8) suggestions.push("Ensure Summary, Experience, Education, Projects, Skills, Achievements are present.");
    if (f.bullets < 6) suggestions.push("Use concise bullet points under experience/projects.");
    if (f.metrics < 2) suggestions.push("Quantify impact with metrics (%, $, time saved, scale).");
    return {
        score,
        keywordCoverage: Math.round(f.coverage*100),
        bullets: f.bullets,
        metrics: f.metrics,
        suggestions
    };
}
