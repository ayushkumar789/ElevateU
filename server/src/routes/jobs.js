import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import Job from "../models/Job.js";
import User from "../models/User.js";
import { scoreJobAgainstSkills } from "../utils/recommender.js";

const router = Router();

/**
 * GET /api/jobs/recommendations?q=...&limit=24
 * - Uses user.profile.skills for ranking.
 * - q filters title/company/tags/description via case-insensitive regex.
 */
router.get("/recommendations", requireAuth, async (req, res) => {
    const user = await User.findById(req.user.id).lean();
    const skills = (user?.profile?.skills || []).map(s => s.toLowerCase());

    const q = (req.query.q || "").trim();
    const limit = Math.min(parseInt(req.query.limit || "24", 10), 100);

    const filter = {};
    if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
        filter.$or = [
            { title: rx },
            { company: rx },
            { description: rx },
            { tags: rx }
        ];
    }

    let jobs = await Job.find(filter).limit(300).lean();

    if (!jobs.length) {
        return res.json({ jobs: [], note: "No jobs found. Seed the database to see recommendations." });
    }

    jobs = jobs
        .map(j => ({ ...j, _score: scoreJobAgainstSkills(j, skills) }))
        .sort((a, b) => b._score - a._score)
        .slice(0, limit);

    res.json({ jobs });
});

export default router;
