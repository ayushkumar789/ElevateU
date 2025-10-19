import express from "express";
import Event from "../models/Event.js";
import { requireAuth } from "../middleware/auth.js";

const r = express.Router();

// lightweight ingestion endpoint
r.post("/", requireAuth, async (req, res) => {
    const { type, jobId, page, msDwell, payload } = req.body || {};
    if (!type) return res.status(400).json({ error: "type required" });
    await Event.create({
        userId: req.user._id,
        type, jobId, page, msDwell, payload
    });
    res.json({ ok: true });
});

// a tiny metrics view (for future dashboards)
r.get("/counts", requireAuth, async (req, res) => {
    const sinceDays = Number(req.query.days || 7);
    const since = new Date(Date.now() - sinceDays*24*60*60*1000);
    const agg = await Event.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$type", n: { $sum: 1 } } },
        { $sort: { n: -1 } }
    ]);
    res.json({ ok: true, counts: agg });
});

export default r;
