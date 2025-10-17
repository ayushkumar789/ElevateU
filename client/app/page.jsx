"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import TeamGrid from "../components/TeamGrid";

export default function Home() {
    return (
        <div className="space-y-16">
            <section className="grid md:grid-cols-2 gap-10 items-center">
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.5}}>
                    <h1 className="text-5xl font-extrabold leading-tight">Learn, Prepare, <span className="text-indigo-600">Succeed</span>.</h1>
                    <p className="mt-4 text-lg opacity-80">ATS-ready resumes, mock interviews with feedback, role recommendations, and gamified progress — all in one place.</p>
                    <div className="mt-6 flex gap-3">
                        <Link href="/register" className="btn btn-primary">Create your account</Link>
                        <Link href="/login" className="btn border border-indigo-600">I already have an account</Link>
                    </div>
                </motion.div>
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{duration:.6}} className="card">
                    <h2 className="text-2xl font-bold mb-2">How it works</h2>
                    <ol className="list-decimal ml-6 space-y-2 opacity-90">
                        <li>Register and upload your resume — skills are parsed & ATS score computed.</li>
                        <li>Practice with Interview Assistant — pick a subject and get actionable feedback.</li>
                        <li>Discover roles matched to your skills & iterate to improve scores.</li>
                    </ol>
                </motion.div>
            </section>

            <section className="grid md:grid-cols-3 gap-6">
                <div className="card"><h3 className="font-bold mb-1">MetaResume</h3><p className="opacity-80">Upload PDF/DOCX → unified ATS score, keyword coverage, structure, bullets, metrics.</p></div>
                <div className="card"><h3 className="font-bold mb-1">Interview Assistant</h3><p className="opacity-80">Choose subject (C/Python/TS/JS, etc.). Feedback on Confidence, Clarity, Pace, STAR.</p></div>
                <div className="card"><h3 className="font-bold mb-1">Recommendations</h3><p className="opacity-80">Content-based job matching; ML reweighting when you add a model file.</p></div>
            </section>

            <section className="card">
                <h2 className="text-2xl font-bold mb-2">Why ElevateU?</h2>
                <ul className="list-disc ml-6 space-y-2 opacity-90">
                    <li><b>Unified scoring:</b> the same ATS engine everywhere (no surprises).</li>
                    <li><b>Modular AI:</b> optional LLM for question gen, optional ML models for scoring & jobs.</li>
                    <li><b>Motivation built-in:</b> points, levels, streaks, badges, leaderboard.</li>
                    <li><b>Mobile-friendly:</b> companion app for scoring + practice on the go.</li>
                </ul>
            </section>

            <section className="grid md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-bold mb-1">Security & Privacy</h3>
                    <p className="opacity-80">You control your content. JWT-based auth; HTTPS in production. No resume is shared with third parties.</p>
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

            <TeamGrid />
        </div>
    );
}
