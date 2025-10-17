import { Router } from "express";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.get("/", requireAuth, async (req,res) => {
  const user = await User.findById(req.user.id).lean();
  res.json({ profile: user?.profile || {}, gamify: user?.gamify || { points:0, level:1, streakDays:0, badges:[] } });
});
router.put("/", requireAuth, async (req,res) => {
  const { profile } = req.body || {};
  const user = await User.findByIdAndUpdate(req.user.id, { $set: { profile } }, { new:true });
  res.json({ profile: user.profile });
});
export default router;
