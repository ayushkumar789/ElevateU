import 'dotenv/config';
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import mongoose from "mongoose";
import authRouter from "./routes/auth.js";
import profileRouter from "./routes/profile.js";
import resumeRouter from "./routes/resume.js";
import interviewRouter from "./routes/interview.js";
import jobsRouter from "./routes/jobs.js";
import gamifyRouter from "./routes/gamify.js";
import eventsRoute from "./routes/events.js";
import searchRouter from "./routes/search.js";
import { requireAuth } from "./middleware/auth.js";
import resumeGenRoute from "./routes/resume_gen.js";

const app = express();
const PORT = process.env.PORT || 8000;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
const MOBILE_URL = process.env.MOBILE_URL || "http://localhost:19006";

app.use(helmet());
app.use(cors({ origin: [CLIENT_URL, MOBILE_URL], credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(morgan("tiny"));

app.get("/api/health", (req, res) => res.json({ ok: true, service: "elevateu-api" }));

app.use("/api/auth", authRouter);
app.use("/api/profile", profileRouter);
app.use("/api/resume", resumeRouter);
app.use("/api/interview", interviewRouter);
app.use("/api/jobs", jobsRouter);
app.use("/api/gamify", gamifyRouter);
app.use("/api/events", eventsRoute);
app.use("/api/search", requireAuth, searchRouter);
app.use("/api/resume", resumeGenRoute);

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/elevateu";
mongoose.connect(MONGODB_URI).then(() => {
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
}).catch(err => {
  console.error("MongoDB error:", err.message);
  app.listen(PORT, () => console.log(`API (no DB) http://localhost:${PORT}`));
});
