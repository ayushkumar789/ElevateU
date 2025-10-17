// Shared ATS scorer used by both register and resume endpoints

const ACTION_VERBS = [
    "built","created","developed","designed","implemented","refactored","optimized","automated",
    "led","owned","drove","launched","deployed","integrated","migrated","analyzed","improved",
    "reduced","increased","streamlined","mentored","collaborated","delivered","debugged"
];

export function analyzeResume(resumeText = "", jobDescription = "") {
    const text = (resumeText || "").toLowerCase();
    const jd = (jobDescription || "").toLowerCase();

    // 1) Structure/sections
    const sections = ["summary","experience","education","projects","skills","achievements"];
    const secHits = sections.reduce((a,s)=> a + (text.includes(s) ? 1 : 0), 0);
    const secScore = secHits / sections.length; // 0..1

    // 2) Keyword coverage vs JD (if JD present)
    const jdKeywords = Array.from(new Set(
        jd.split(/[^a-z0-9+]+/).filter(w => w.length > 3)
    ));
    const hits = jdKeywords.filter(k => text.includes(k)).length;
    const coverage = jdKeywords.length ? Math.round((hits / jdKeywords.length) * 100) : null; // null if no JD

    // 3) Evidence quality
    const bullets = (resumeText.match(/\n\s*[-•*]/g) || []).length;
    const metrics = (resumeText.match(/\b(\d+%|\d+k|\$\d+|\d+\s+(?:months?|years?|weeks?))\b/gi) || []).length;
    const verbs = ACTION_VERBS.reduce((a,v)=> a + (new RegExp(`\\b${v}\\b`,'i').test(text) ? 1 : 0), 0);

    // 4) Compute score with sensible back-offs
    // Weights:
    // - If JD present: 55% coverage, 25% structure, 15% bullets/metrics, 5% verbs
    // - If no JD: 50% structure, 35% bullets/metrics, 15% verbs
    let score = 0;
    if (coverage !== null) {
        const quality = Math.min(20, bullets * 2) + Math.min(10, metrics * 2); // 0..30
        const verbsScaled = Math.min(10, verbs * 1); // 0..10
        score = Math.round(0.55 * coverage + 25 * secScore + quality + verbsScaled);
    } else {
        const quality = Math.min(35, bullets * 3 + metrics * 4); // 0..35
        const verbsScaled = Math.min(15, verbs * 1); // 0..15
        score = Math.round(50 * secScore + quality + verbsScaled);
    }
    if (score > 100) score = 100;
    if (score < 0) score = 0;

    const suggestions = [];
    if (coverage !== null && coverage < 70) suggestions.push("Add more role-specific keywords from the job description.");
    if (secScore < 0.8) suggestions.push("Include/label key sections: Summary, Experience, Education, Projects, Skills, Achievements.");
    if (bullets < 5) suggestions.push("Use more bullet points for scannability (5+ recommended).");
    if (metrics < 2) suggestions.push("Quantify impact (add % / $ / counts / time saved).");
    if (verbs < 5) suggestions.push("Start bullets with strong action verbs (built, optimized, launched...).");

    return {
        score,
        keywordCoverage: coverage === null ? undefined : coverage,
        bullets,
        metrics,
        actionVerbs: verbs,
        suggestions
    };
}
