// server/src/routes/resume.js
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import ParsedResume from "../models/ParsedResume.js";
import { scoreResume } from "../utils/scorer.js";
import { extractSkills } from "../utils/skills.js";
import { geminiExtractResume, geminiAtsAnalyze } from "../utils/ai.js";
import { geminiAtsFromPdfBytes } from "../utils/ai-fileats.js";

// CommonJS modules inside ESM
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");   // CJS
const mammoth = require("mammoth"); // CJS

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

async function toTextFromUpload(file) {
    if (!file) return "";
    const mime = (file.mimetype || "").toLowerCase();
    const name = (file.originalname || "").toLowerCase();

    try {
        if (mime.includes("pdf") || name.endsWith(".pdf")) {
            const data = await pdf(file.buffer);
            return (data.text || "").trim();
        }
        if (mime.includes("word") || name.endsWith(".docx")) {
            const res = await mammoth.extractRawText({ buffer: file.buffer });
            return (res.value || "").trim();
        }
    } catch {
        // fall through to utf8 decode if specialized parsers fail
    }
    return file.buffer.toString("utf8").trim();
}

/**
 * POST /api/resume/score
 * Accepts multipart/form-data (file) OR JSON { resumeText, jobDescription }
 * Returns heuristic ATS + LLM ATS (Gemini) + missingKeywords (heuristic).
 */
router.post("/score", requireAuth, upload.single("file"), async (req, res) => {
    try {
        let { resumeText = "", jobDescription = "" } = req.body || {};
        if (!resumeText && req.file) {
            resumeText = await toTextFromUpload(req.file);
        }
        if (!resumeText) {
            return res.status(400).json({ error: "No resume text/file provided" });
        }

        // 1) Heuristic score (existing)
        const result = scoreResume(resumeText, jobDescription); // {score, keywordCoverage, bullets, metrics, suggestions}

        // 2) LLM score (Gemini) — never fail the whole request if LLM errors
        let llm = null;
        try {
            llm = await geminiAtsAnalyze({ resumeText, jobDescription }); // { jd_match_percent, missing_keywords, found_keywords, profile_summary }
        } catch (e) {
            llm = { error: String(e.message || e) };
        }

        // 3) Parse resume (LLM) for profile enrichment — soft-fail
        let parsed = {};
        try {
            parsed = await geminiExtractResume(resumeText);
        } catch {
            parsed = {
                summary: "",
                skills: extractSkills(resumeText),
                keywords: extractSkills(resumeText),
                education: [],
                experience: [],
                projects: [],
                certifications: [],
            };
        }

        // Merge skills (LLM + heuristic extractor)
        const mergedSkills = Array.from(
            new Set([...(parsed.skills || []), ...extractSkills(resumeText)])
        );

        // 4) Update User profile (soft)
        try {
            const user = await User.findById(req.user.id);
            if (user) {
                user.profile = {
                    ...(user.profile || {}),
                    resumeText,
                    skills: mergedSkills,
                    headline: user.profile?.headline || parsed?.summary || "",
                };
                user.applyActivity?.(20);
                await user.save();
            }
        } catch {
            /* ignore profile write errors */
        }

        // 5) Upsert into ParsedResume using your schema (userId)
        try {
            await ParsedResume.findOneAndUpdate(
                { userId: req.user.id },
                {
                    userId: req.user.id,
                    summary: parsed.summary || "",
                    skills: mergedSkills,
                    keywords: parsed.keywords || mergedSkills,
                    education: Array.isArray(parsed.education) ? parsed.education : [],
                    experience: Array.isArray(parsed.experience) ? parsed.experience : [],
                    projects: Array.isArray(parsed.projects) ? parsed.projects : [],
                    certifications: Array.isArray(parsed.certifications) ? parsed.certifications : [],
                },
                { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
            );
        } catch {
            /* ignore resume store errors */
        }

        // 6) Heuristic missing JD keywords (cheap baseline)
        const jdWords = Array.from(
            new Set(
                (jobDescription || "")
                    .toLowerCase()
                    .split(/[^a-z0-9+]+/)
                    .filter((w) => w.length > 3)
            )
        );
        const missingKeywords = jdWords.filter(
            (k) => !resumeText.toLowerCase().includes(k)
        );

        return res.json({
            ...result,         // score, keywordCoverage, bullets, metrics, suggestions
            missingKeywords,   // heuristic view
            llm,               // Gemini ATS object OR {error}
        });
    } catch (e) {
        res.status(500).json({ error: e.message || "Resume analysis failed" });
    }
});

/**
 * POST /api/resume/llm-ats
 * Optional: direct Gemini-only ATS endpoint (JSON or multipart).
 */
router.post("/llm-ats", requireAuth, upload.single("file"), async (req, res) => {
    try {
        let { resumeText = "", jobDescription = "" } = req.body || {};
        if (!resumeText && req.file) {
            resumeText = await toTextFromUpload(req.file);
        }
        if (!resumeText) {
            return res.status(400).json({ error: "No resume text/file provided" });
        }
        const ats = await geminiAtsAnalyze({ resumeText, jobDescription });
        res.json(ats);
    } catch (e) {
        res.status(500).json({ error: e.message || "LLM ATS failed" });
    }
});

router.post("/llm-ats-direct", requireAuth, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "Upload a PDF/DOCX" });
        const ats = await geminiAtsFromPdfBytes({
            fileBuffer: req.file.buffer,
            mimeType: req.file.mimetype,
            jobDescription: req.body?.jobDescription || ""
        });
        res.json(ats);
    } catch (e) {
        res.status(500).json({ error: e.message || "Direct LLM ATS failed" });
    }
});

export default router;
