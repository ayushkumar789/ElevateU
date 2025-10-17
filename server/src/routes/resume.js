import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import ParsedResume from "../models/ParsedResume.js";
import { scoreResume } from "../utils/scorer.js";
import { extractSkills } from "../utils/skills.js";
import { geminiExtractResume } from "../utils/ai.js";

const router = Router();

router.post("/score", requireAuth, async (req, res) => {
    try {
        const { resumeText = "", jobDescription = "" } = req.body || {};
        const result = scoreResume(resumeText, jobDescription);

        // LLM structured parse (default)
        const parsed = await geminiExtractResume(resumeText);

        // Merge skills (LLM + heuristic)
        const mergedSkills = Array.from(new Set([...(parsed.skills || []), ...extractSkills(resumeText)]));

        // Persist: profile.skills + ParsedResume doc
        const user = await User.findById(req.user.id);
        if (user) {
            user.profile = { ...(user.profile || {}), resumeText, skills: mergedSkills, headline: user.profile?.headline || parsed.summary || "" };
            user.applyActivity(20);
            await user.save();
        }

        await ParsedResume.findOneAndUpdate(
            { userId: req.user.id },
            {
                userId: req.user.id,
                summary: parsed.summary || "",
                skills: mergedSkills,
                keywords: parsed.keywords || [],
                education: parsed.education || [],
                experience: parsed.experience || [],
                projects: parsed.projects || [],
                certifications: parsed.certifications || []
            },
            { upsert: true, setDefaultsOnInsert: true }
        );

        // Compute naive missing keywords from JD too
        const jdWords = Array.from(new Set((jobDescription || "").toLowerCase().split(/[^a-z0-9+]+/).filter(w => w.length > 3)));
        const missingKeywords = jdWords.filter(k => !resumeText.toLowerCase().includes(k));

        res.json({ ...result, parsed, missingKeywords });
    } catch (e) {
        res.status(e.status || 500).json({ error: e.message || "Resume analysis failed" });
    }
});

export default router;
