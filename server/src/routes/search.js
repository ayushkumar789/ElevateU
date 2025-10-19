// server/src/routes/search.js
import { Router } from "express";
import mongoose from "mongoose";

const router = Router();

// Utility: basic text similarity for scoring (fast heuristic)
function simpleScore(text, qWords) {
    if (!text) return 0;
    const lo = String(text).toLowerCase();
    let s = 0;
    for (const w of qWords) if (w && lo.includes(w)) s += 1;
    return s;
}

// Shape helpers
function toJobHit(doc, score = 0) {
    return {
        score,
        job: {
            _id: doc._id,
            title: doc.title,
            company: doc.company,
            location: doc.location,
            url: doc.url,
            summary: doc.summary || doc.description || "",
            tags: doc.tags || [],
            postedAt: doc.postedAt || doc.createdAt || null,
        },
    };
}

/**
 * POST /api/search/semantic
 * body: { q: string, k?: number }
 * returns: { hits: [{score, job}] }
 *
 * Implementation:
 * - Tries a Mongo text search if an index exists.
 * - Falls back to regex + heuristic scoring.
 */
router.post("/semantic", async (req, res) => {
    try {
        const { q = "", k = 20 } = req.body || {};
        const topK = Math.min(Math.max(parseInt(k, 10) || 20, 1), 50);

        if (!q.trim()) return res.json({ hits: [] });

        const qWords = q.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);

        const db = mongoose.connection.db;
        const jobsCol = db.collection("jobs");

        let docs = [];

        // Try $text if available
        const indexes = await jobsCol.indexes();
        const hasText = indexes.some((ix) => ix.key && Object.keys(ix.key).some((k) => ix.key[k] === "text"));

        if (hasText) {
            // $text + score
            const cursor = jobsCol
                .find({ $text: { $search: q } }, { projection: { score: { $meta: "textScore" } } })
                .sort({ score: { $meta: "textScore" } })
                .limit(topK * 3); // overfetch, then rerank
            docs = await cursor.toArray();
        } else {
            // Fallback: loose regex filter on common fields
            const rx = new RegExp(qWords.join("|"), "i");
            const cursor = jobsCol
                .find({
                    $or: [
                        { title: rx },
                        { company: rx },
                        { location: rx },
                        { summary: rx },
                        { description: rx },
                        { tags: { $in: qWords } },
                    ],
                })
                .limit(500);
            docs = await cursor.toArray();
        }

        // Heuristic rerank (even if $text exists) so we always return score
        const scored = docs.map((d) => {
            const textBlob = [d.title, d.company, d.location, d.summary, d.description, (d.tags || []).join(" ")].join(" ");
            const s = (d.score || 0) + simpleScore(textBlob, qWords);
            return toJobHit(d, s);
        });

        // Sort & cut
        scored.sort((a, b) => b.score - a.score);
        const hits = scored.slice(0, topK);

        return res.json({ hits });
    } catch (e) {
        console.error("search/semantic error:", e);
        return res.status(500).json({ error: "semantic search failed" });
    }
});

/**
 * POST /api/search/skills-suggest
 * body: { q: string, k?: number }
 * returns: { suggestions: [{ skill, score }] }
 */
router.post("/skills-suggest", async (req, res) => {
    try {
        const { q = "", k = 10 } = req.body || {};
        const topK = Math.min(Math.max(parseInt(k, 10) || 10, 1), 50);

        if (!q.trim()) return res.json({ suggestions: [] });

        const qWords = q.toLowerCase().split(/[^a-z0-9+]+/).filter(Boolean);
        const rx = new RegExp(qWords.join("|"), "i");

        const db = mongoose.connection.db;
        // If you have a dedicated "skills" collection, use it; otherwise derive from jobs.tags
        const skillsCol = db.collection("skills");
        const hasSkillsCol = (await db.listCollections({ name: "skills" }).toArray()).length > 0;

        let suggestions = [];

        if (hasSkillsCol) {
            const cursor = skillsCol.find({ name: rx }).limit(500);
            const rows = await cursor.toArray();
            suggestions = rows
                .map((r) => ({ skill: r.name || r.skill || "", score: simpleScore(r.name || r.skill || "", qWords) }))
                .filter((s) => s.skill);
        } else {
            // derive from jobs.tags
            const jobsCol = db.collection("jobs");
            const rows = await jobsCol
                .aggregate([
                    { $match: { tags: { $exists: true, $ne: [] } } },
                    { $unwind: "$tags" },
                    { $match: { tags: rx } },
                    { $group: { _id: "$tags", freq: { $sum: 1 } } },
                    { $sort: { freq: -1 } },
                    { $limit: 500 },
                ])
                .toArray();
            suggestions = rows.map((r) => ({ skill: r._id, score: r.freq }));
        }

        // Sort & cut
        suggestions.sort((a, b) => b.score - a.score);
        suggestions = suggestions.slice(0, topK);

        return res.json({ suggestions });
    } catch (e) {
        console.error("search/skills-suggest error:", e);
        return res.status(500).json({ error: "skills suggest failed" });
    }
});

export default router;
