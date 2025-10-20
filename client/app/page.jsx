"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import TeamGrid from "../components/TeamGrid";
import { getToken } from "../lib/auth";

// prevent static caching for this route
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function Home() {
    const [ready, setReady] = useState(false);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
        setAuthed(!!getToken());
        setReady(true);
    }, []);

    if (!ready) return null;

    return authed ? <HomeAuthed /> : <HomeAnon />;
}

/* ===============================
   LOGGED-IN HOME (no redirect)
   =============================== */
function HomeAuthed() {
    return (
        <div className="space-y-16">
            {/* Welcome / Snapshot */}
            <section className="grid lg:grid-cols-3 gap-6 items-stretch">
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 card"
                >
                    <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
                        Welcome back 👋
                    </h1>
                    <p className="mt-3 text-lg opacity-80">
                        Continue where you left off: analyze resumes, practice interviews,
                        explore jobs, and track progress — all in one place.
                    </p>

                    <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        <QuickLink title="Dashboard" href="/dashboard" desc="Overview, streaks, points, recent activity." />
                        <QuickLink title="Resume Analyzer" href="/resume" desc="Upload PDF/DOCX → ATS score & keyword coverage." />
                        <QuickLink title="Jobs" href="/jobs" desc="Semantic job search + skills hints." />
                        <QuickLink title="Interview" href="/interview" desc="Question generation & feedback (Confidence, Clarity, Pace, STAR)." />
                        <QuickLink title="Profile" href="/profile" desc="Update headline, skills, links, and preferences." />
                        <QuickLink title="Logout" href="/logout" desc="Sign out from this device." />
                    </div>
                </motion.div>

                {/* “Today” card */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="card"
                >
                    <h3 className="text-xl font-bold">Today</h3>
                    <ul className="mt-3 space-y-2 text-sm opacity-90">
                        <li>• Finish resume keyword alignment for 2 roles.</li>
                        <li>• 20-min Interview practice on React/JS.</li>
                        <li>• Apply to 3 high-match jobs from recommendations.</li>
                    </ul>
                    <div className="mt-4 flex gap-2">
                        <Link className="btn btn-primary" href="/dashboard">
                            Open Dashboard
                        </Link>
                        <Link className="btn" href="/jobs">
                            View Jobs
                        </Link>
                    </div>
                </motion.div>
            </section>

            {/* Resume Health */}
            <section className="card">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Resume Health</h2>
                    <Link href="/resume" className="text-indigo-400 hover:underline">
                        Go to Analyzer →
                    </Link>
                </div>
                <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm">
                    <Kpi title="Latest ATS Score" value="—" sub="Upload/Analyze to refresh." />
                    <Kpi title="Keyword Coverage" value="—" sub="Add JD to see alignment." />
                    <Kpi title="Bullet Points" value="—" sub="Prefer results + metrics." />
                </div>
                <div className="mt-4 text-sm opacity-80">
                    Tip: Upload the same resume and try the <b>Gemini (PDF)</b> button for an LLM
                    view (JD match, missing keywords, profile summary).
                </div>
            </section>

            {/* Interview Practice */}
            <section className="card">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">Interview Practice</h2>
                    <Link href="/interview" className="text-indigo-400 hover:underline">
                        Start Practice →
                    </Link>
                </div>
                <p className="opacity-80 mt-2">
                    Pick a stack/subject, then practice questions with feedback on Confidence,
                    Clarity, Pace, and STAR. Use daily streaks to stay consistent.
                </p>
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Tag>React</Tag>
                    <Tag>Node.js</Tag>
                    <Tag>Python</Tag>
                    <Tag>SQL</Tag>
                    <Tag>System Design</Tag>
                    <Tag>Behavioral</Tag>
                </div>
            </section>

            {/* Job Matches / Recommendations */}
            <section className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold">Job Recommendations</h2>
                        <Link href="/jobs" className="text-indigo-400 hover:underline">
                            Open Jobs →
                        </Link>
                    </div>
                    <p className="opacity-80 mt-2">
                        We use semantic search to surface roles similar to your queries. Add skills
                        to refine, and keep your profile up to date for better recall.
                    </p>
                    <div className="mt-4 grid md:grid-cols-2 gap-4">
                        <RecJob />
                        <RecJob />
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-xl font-bold">Learning Path</h3>
                    <p className="mt-1 opacity-80 text-sm">
                        Structured progression from fundamentals to advanced topics. Earn
                        points/badges while you complete modules.
                    </p>
                    <ul className="mt-3 text-sm space-y-2 opacity-90">
                        <li>• React: Hooks, performance, patterns</li>
                        <li>• Node/Express: APIs, auth, testing</li>
                        <li>• SQL/Databases: modeling, queries</li>
                        <li>• System Design: scalability, caching</li>
                    </ul>
                    <Link className="btn mt-4" href="/dashboard">
                        Continue
                    </Link>
                </div>
            </section>

            {/* Activity / Streaks / Achievements */}
            <section className="grid lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2">
                    <h2 className="text-2xl font-bold">Recent Activity</h2>
                    <div className="mt-3 text-sm space-y-2 opacity-90">
                        <p>• Reviewed resume: added metrics to 3 bullets.</p>
                        <p>• Practiced 10 React questions — improved clarity score.</p>
                        <p>• Saved 4 roles: Senior React Dev, Full-Stack JS, …</p>
                    </div>
                </div>
                <div className="card">
                    <h3 className="text-xl font-bold">Streaks & Achievements</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-center">
                        <Streak title="Day Streak" value="3" />
                        <Streak title="Total Points" value="210" />
                    </div>
                    <div className="mt-4 text-sm opacity-80">
                        Keep your streak alive — do a quick 10-min session today!
                    </div>
                </div>
            </section>

            {/* Resources & Announcements */}
            <section className="grid lg:grid-cols-3 gap-6">
                <div className="card lg:col-span-2">
                    <h2 className="text-2xl font-bold">Resources</h2>
                    <div className="mt-4 grid md:grid-cols-2 gap-4 text-sm">
                        <Res link="https://roadmap.sh" title="Frontend/Backend Roadmaps" />
                        <Res link="https://leetcode.com" title="LeetCode Practice Sets" />
                        <Res link="https://systemdesign.one" title="System Design Notes" />
                        <Res link="https://sqlbolt.com" title="SQLBolt Interactive Lessons" />
                    </div>
                </div>
                <div className="card">
                    <h3 className="text-xl font-bold">What’s new</h3>
                    <ul className="mt-3 text-sm opacity-90 space-y-2">
                        <li>• Gemini Direct PDF analysis on Resume page</li>
                        <li>• Semantic Job Search + Skills Suggestions</li>
                        <li>• Cleaner dashboard layout & cards</li>
                    </ul>
                </div>
            </section>

            {/* Team */}
            <TeamGrid />
        </div>
    );
}

/* ===============================
   ANONYMOUS (PUBLIC) HOME
   =============================== */
function HomeAnon() {
    return (
        <div className="space-y-16">
            {/* Hero */}
            <section className="grid md:grid-cols-2 gap-10 items-center">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <h1 className="text-5xl font-extrabold leading-tight">
                        Learn, Prepare, <span className="text-indigo-600">Succeed</span>.
                    </h1>
                    <p className="mt-4 text-lg opacity-80">
                        ATS-ready resumes, mock interviews with feedback, role recommendations, and
                        gamified progress — all in one place.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href="/register" className="btn btn-primary">
                            Create your account
                        </Link>
                        <Link href="/login" className="btn border border-indigo-600">
                            I already have an account
                        </Link>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="card">
                    <h2 className="text-2xl font-bold mb-2">How it works</h2>
                    <ol className="list-decimal ml-6 space-y-2 opacity-90">
                        <li>Register and upload your resume — skills are parsed & ATS score computed.</li>
                        <li>Practice with Interview Assistant — pick a subject and get actionable feedback.</li>
                        <li>Discover roles matched to your skills & iterate to improve scores.</li>
                    </ol>
                </motion.div>
            </section>

            {/* Feature Trio */}
            <section className="grid md:grid-cols-3 gap-6">
                <div className="card">
                    <h3 className="font-bold mb-1">MetaResume</h3>
                    <p className="opacity-80">
                        Upload PDF/DOCX → unified ATS score, keyword coverage, structure, bullets, metrics.
                    </p>
                </div>
                <div className="card">
                    <h3 className="font-bold mb-1">Interview Assistant</h3>
                    <p className="opacity-80">
                        Choose subject (C/Python/TS/JS, etc.). Feedback on Confidence, Clarity, Pace, STAR.
                    </p>
                </div>
                <div className="card">
                    <h3 className="font-bold mb-1">Recommendations</h3>
                    <p className="opacity-80">
                        Content-based job matching; ML reweighting when you add a model file.
                    </p>
                </div>
            </section>

            {/* Why Section */}
            <section className="card">
                <h2 className="text-2xl font-bold mb-2">Why ElevateU?</h2>
                <ul className="list-disc ml-6 space-y-2 opacity-90">
                    <li><b>Unified scoring:</b> the same ATS engine everywhere (no surprises).</li>
                    <li><b>Modular AI:</b> optional LLM for question gen, optional ML models for scoring & jobs.</li>
                    <li><b>Motivation built-in:</b> points, levels, streaks, badges, leaderboard.</li>
                    <li><b>Mobile-friendly:</b> companion app for scoring + practice on the go.</li>
                </ul>
            </section>

            {/* Security & FAQ */}
            <section className="grid md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-bold mb-1">Security & Privacy</h3>
                    <p className="opacity-80">
                        You control your content. JWT-based auth; HTTPS in production. No resume is shared with third parties.
                    </p>
                </div>
                <div className="card">
                    <h3 className="font-bold mb-1">FAQ</h3>
                    <ul className="list-disc ml-6 space-y-2 opacity-90">
                        <li><b>Is upload mandatory?</b> Yes at registration; it powers recommendations.</li>
                        <li><b>Do you need a JD?</b> Optional — add it to see keyword alignment.</li>
                        <li><b>Can I add AI later?</b> Yes — just drop a model file or an API key.</li>
                    </ul>
                </div>
            </section>

            {/* Testimonials */}
            <section className="card">
                <h2 className="text-2xl font-bold">What users say</h2>
                <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm opacity-90">
                    <Quote
                        text="The ATS hints told me exactly what keywords to add. Landed more interviews in a week."
                        by="Akhil, Frontend Dev"
                    />
                    <Quote
                        text="Interview practice with STAR feedback was a game-changer for my confidence."
                        by="Sana, Backend Engineer"
                    />
                    <Quote
                        text="Semantic job search actually surfaces relevant roles without spamming me."
                        by="Ravi, Full-Stack"
                    />
                </div>
            </section>

            {/* CTA */}
            <section className="card text-center">
                <h2 className="text-2xl font-bold">Ready to level up?</h2>
                <p className="opacity-80 mt-1">
                    Create a free account and take your first step today.
                </p>
                <div className="mt-4 flex justify-center gap-3">
                    <Link href="/register" className="btn btn-primary">
                        Create your account
                    </Link>
                    <Link href="/login" className="btn">
                        I already have an account
                    </Link>
                </div>
            </section>

            {/* Team */}
            <TeamGrid />
        </div>
    );
}

/* ============== small UI atoms ============== */

function QuickLink({ title, desc, href }) {
    return (
        <Link href={href} className="block rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition">
            <div className="font-semibold">{title}</div>
            <div className="text-xs opacity-80 mt-1">{desc}</div>
        </Link>
    );
}

function Kpi({ title, value, sub }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm opacity-70">{title}</div>
            <div className="text-3xl font-extrabold mt-1">{value}</div>
            <div className="text-xs opacity-60 mt-1">{sub}</div>
        </div>
    );
}

function Tag({ children }) {
    return (
        <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-sm">
      {children}
    </span>
    );
}

function RecJob() {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="font-semibold">Senior React Developer</div>
            <div className="text-xs opacity-70">Remote • Fintech</div>
            <div className="mt-2 text-sm opacity-85">
                Build performant UIs, collaborate with backend, optimize bundle size,
                and contribute to design system.
            </div>
            <div className="mt-3 flex gap-2 flex-wrap text-xs">
                <Tag>React</Tag><Tag>TypeScript</Tag><Tag>Tailwind</Tag>
            </div>
            <div className="mt-3">
                <Link className="text-indigo-400 hover:underline text-sm" href="/jobs">
                    View details →
                </Link>
            </div>
        </div>
    );
}

function Streak({ title, value }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm opacity-70">{title}</div>
            <div className="text-3xl font-extrabold mt-1">{value}</div>
        </div>
    );
}

function Res({ link, title }) {
    return (
        <a
            target="_blank"
            rel="noreferrer"
            href={link}
            className="rounded-xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
        >
            <div className="font-semibold">{title}</div>
            <div className="text-xs opacity-70 mt-1">External resource</div>
        </a>
    );
}

function Quote({ text, by }) {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p>“{text}”</p>
            <div className="mt-2 text-xs opacity-70">— {by}</div>
        </div>
    );
}
