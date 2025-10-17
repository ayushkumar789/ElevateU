import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ParsedResume from "../models/ParsedResume.js";
import { extractSkills } from "../utils/skills.js";
import { scoreResume } from "../utils/scorer.js";
import { geminiExtractResume } from "../utils/ai.js";

const router = Router();
function sign(user) {
    return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET || "devsecret", { expiresIn: "7d" });
}

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    resumeText: z.string().min(20, "Resume text is required (parsed from file)."),
    jobDescription: z.string().optional()
});

router.post("/register-with-text", async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);

        const exists = await User.findOne({ email: data.email });
        if (exists) return res.status(400).json({ error: "Email already in use" });

        // LLM extraction (primary source of skills)
        const parsed = await geminiExtractResume(data.resumeText);

        // Fallback extraction merged with LLM skills for safety
        const heuristicSkills = extractSkills(data.resumeText);
        const mergedSkills = Array.from(new Set([...(parsed.skills || []), ...heuristicSkills]));

        const ats = scoreResume(data.resumeText, data.jobDescription || "");

        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await User.create({
            name: data.name,
            email: data.email,
            passwordHash,
            profile: {
                headline: parsed.summary || "",
                skills: mergedSkills,
                resumeText: data.resumeText
            }
        });

        // Store structured parse in separate collection (avoids schema issues)
        await ParsedResume.findOneAndUpdate(
            { userId: user._id },
            {
                userId: user._id,
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

        const token = sign(user);
        return res.json({
            token,
            user: { id: user._id, name: user.name, email: user.email },
            ats,
            parsed: { ...parsed, skills: mergedSkills }
        });
    } catch (e) {
        res.status(e.status || 400).json({ error: e.message || "Registration failed" });
    }
});

router.post("/register", async (req, res) => {
    try {
        const schema = z.object({ name: z.string().min(2), email: z.string().email(), password: z.string().min(6) });
        const data = schema.parse(req.body);
        const exists = await User.findOne({ email: data.email });
        if (exists) return res.status(400).json({ error: "Email already in use" });
        const passwordHash = await bcrypt.hash(data.password, 10);
        const user = await User.create({ name: data.name, email: data.email, passwordHash });
        const token = sign(user);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (e) {
        res.status(400).json({ error: e.errors?.[0]?.message || e.message });
    }
});

router.post("/login", async (req, res) => {
    try {
        const schema = z.object({ email: z.string().email(), password: z.string().min(6) });
        const data = schema.parse(req.body);
        const user = await User.findOne({ email: data.email });
        if (!user) return res.status(400).json({ error: "Invalid credentials" });
        const ok = await bcrypt.compare(data.password, user.passwordHash);
        if (!ok) return res.status(400).json({ error: "Invalid credentials" });
        const token = sign(user);
        res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
    } catch (e) {
        res.status(400).json({ error: e.errors?.[0]?.message || e.message });
    }
});

export default router;
