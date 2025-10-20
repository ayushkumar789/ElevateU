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

const allowedOrigins = new Set(
    []
        .concat((process.env.CLIENT_ORIGIN || "").split(",")) // optional CSV
        .concat(process.env.CLIENT_URL || "")
        .concat(process.env.MOBILE_URL || "")
        .map(s => s && s.trim())
        .filter(Boolean)
);

/* small helper */
function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.has(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Credentials", "true");

        // reflect requested headers or fall back to typical ones
        const reqHeaders =
            req.headers["access-control-request-headers"] || "Content-Type, Authorization";
        res.setHeader("Access-Control-Allow-Headers", reqHeaders);

        res.setHeader(
            "Access-Control-Allow-Methods",
            "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
        );
    }
}

/* 2) ALWAYS-ON CORS SHIM (must be first) */
app.use((req, res, next) => {
    setCorsHeaders(req, res);
    if (req.method === "OPTIONS") {
        // Short-circuit all preflights so nothing else can throw/500
        return res.status(204).end();
    }
    next();
});

/* 3) (Optional) keep standard cors() if you like; the shim above guarantees headers on errors */
app.use(
    cors({
        origin(origin, cb) {
            if (!origin || allowedOrigins.has(origin)) return cb(null, true);
            return cb(new Error("CORS: origin not allowed"));
        },
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"],
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    })
);
app.use(helmet());
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

app.use((err, req, res, next) => {
    console.error("Unhandled error:", err?.stack || err);
    if (res.headersSent) return;
    const status = err.status || err.statusCode || 500;
    res.status(status).json({ error: err.message || "Internal Server Error" });
});


const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/elevateu";
mongoose.connect(MONGODB_URI).then(() => {
  console.log("MongoDB connected");
  app.listen(PORT, () => console.log(`API http://localhost:${PORT}`));
}).catch(err => {
  console.error("MongoDB error:", err.message);
  app.listen(PORT, () => console.log(`API (no DB) http://localhost:${PORT}`));
});
