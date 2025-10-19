import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { callGeminiDraft } from "../utils/resume_ai.js";
import { renderMinimalPDF } from "../utils/templates.js";
import { trackEvent } from "../utils/track.js";

const r = express.Router();

// AI drafting: take structured + notes, return improved bullets & summary
r.post("/draft", requireAuth, async (req, res) => {
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: "data required" });

    const improved = await callGeminiDraft(data);
    await trackEvent(req.user?._id, "resume_generate", { payload: { via: "ai_draft" } });
    res.json({ ok: true, data: improved });
});

// Render resume as PDF (ATS-safe template)
r.post("/render", requireAuth, async (req, res) => {
    const { data } = req.body || {};
    if (!data) return res.status(400).json({ error: "data required" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="resume.pdf"`);
    await trackEvent(req.user?._id, "resume_render", { payload: { format: "pdf" } });
    renderMinimalPDF(res, data);
});

export default r;
