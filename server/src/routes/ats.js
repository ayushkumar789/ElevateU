import express from "express";
import { analyzeResume } from "../utils/ats.js";
import { requireAuth } from "../middleware/auth.js";

const r = express.Router();

r.post("/score", requireAuth, async (req, res) => {
    const { resumeText, jobDescription } = req.body || {};
    if (!resumeText) return res.status(400).json({ error: "resumeText required" });
    const result = await analyzeResume({ resumeText, jobDescription });
    res.json({ ok: true, ...result });
});

export default r;
