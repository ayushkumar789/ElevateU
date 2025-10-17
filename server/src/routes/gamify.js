import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();

router.get("/stats", requireAuth, async (req,res) => {
  const user = await User.findById(req.user.id).lean();
  res.json({ points: user?.gamify?.points||0, level: user?.gamify?.level||1, streakDays: user?.gamify?.streakDays||0, badges: user?.gamify?.badges||[] });
});

router.post("/claim", requireAuth, async (req,res) => {
  const { action } = req.body || {};
  const points = action==="complete_interview"?50 : action==="score_resume"?30 : 10;
  const user = await User.findById(req.user.id);
  user.applyActivity(points);
  await user.save();
  res.json({ points: user.gamify.points, level: user.gamify.level, streakDays: user.gamify.streakDays, badges: user.gamify.badges });
});

router.get("/leaderboard", requireAuth, async (req,res) => {
  const top = await User.find({}, { name:1, "gamify.points":1, "gamify.level":1 }).sort({ "gamify.points": -1 }).limit(10).lean();
  res.json({ top: top.map(u=>({ name:u.name, points:u.gamify?.points||0, level:u.gamify?.level||1 })) });
});

export default router;
