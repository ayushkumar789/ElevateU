import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";
import { geminiQuestions } from "../utils/ai.js";

const router = Router();

router.get("/questions", requireAuth, async (req, res) => {
    try {
        const count = Math.min(Math.max(parseInt(req.query.count || "20", 10) || 20, 5), 50);
        const category = (req.query.category || "tech").toLowerCase() === "behavioral" ? "behavioral" : "tech";

        let skills = [];
        if (req.query.skills) {
            skills = String(req.query.skills)
                .split(",")
                .map(s => s.trim())
                .filter(Boolean);
        } else {
            const user = await User.findById(req.user.id).lean();
            skills = (user?.profile?.skills || []).map(s => String(s).trim()).filter(Boolean);
        }
        const skillsList = skills.length ? skills.join(", ") : "general software engineering";

        const arr = await geminiQuestions({ skillsList, count, category });

        const questions = arr.slice(0, count).map((q, i) => ({
            id: i + 1,
            subject: q.skill || "general",
            type: (q.category === "behavioral" ? "behavioral" : "tech"),
            difficulty: (q.difficulty === "hard" || q.difficulty === "medium") ? q.difficulty : "easy",
            q: q.question || String(q)
        }));

        res.json({ questions, meta: { count: questions.length, category, skills } });
    } catch (e) {
        res.status(e.status || 500).json({ error: e.message || "Gemini question generation failed" });
    }
});

router.post("/feedback", requireAuth, async (req, res) => {
    const { transcript = "" } = req.body || {};
    const words = transcript.trim().split(/\s+/).filter(Boolean).length;
    const fillerCount = (transcript.match(/\b(um|uh|like|you know)\b/gi) || []).length;
    const pace = words > 0 ? Math.min(180, Math.round(words / 1.5)) : 0;
    const confidence = Math.max(40, 100 - fillerCount * 5);
    const clarity = Math.min(100, 50 + Math.round(words / 5));
    const structure = /\b(Situation|Task|Action|Result)\b/i.test(transcript) ? 100 : 60;
    const tips = [];
    if (fillerCount > 3) tips.push("Reduce filler words to sound confident.");
    if (pace > 160) tips.push("Slow down slightly to improve clarity.");
    if (words < 90) tips.push("Add more detail and follow the STAR structure.");
    res.json({ analysis: { confidence, clarity, pace, structure }, tips });
});

export default router;
