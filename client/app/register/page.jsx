"use client";
import { useState } from "react";

// ... (same helper functions you already have for PDF/DOCX extraction)

import { /* keep your readFileAsArrayBuffer, extractPdfText, extractDocxText, extractResumeText */ } from "./resume_extract_helpers";
// If you don't have this helper file, keep the inline functions you used earlier.

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [file, setFile] = useState(null);
    const [jd, setJd] = useState(""); // NEW: allow JD to match the ATS logic
    const [ats, setAts] = useState(null);
    const [error, setError] = useState("");

    async function submit(e) {
        e.preventDefault();
        setError(""); setAts(null);
        if (!file) { setError("Please upload your resume (PDF/DOCX)."); return; }
        try {
            const resumeText = await extractResumeText(file);
            if (!resumeText || resumeText.length < 20) throw new Error("Could not read resume. Please upload a clear PDF/DOCX.");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register-with-text`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, resumeText, jobDescription: jd })
            });
            const data = await res.json();
            if (!res.ok) { setError(data.error || "Registration failed"); return; }

            localStorage.setItem(process.env.JWT_STORAGE_KEY, data.token);
            setAts(data.ats);
            setTimeout(() => { window.location.href = "/dashboard"; }, 1200);
        } catch (err) {
            setError(err.message || "Failed to parse resume");
        }
    }

    return (
        <div className="max-w-lg mx-auto card">
            <h1 className="text-2xl font-bold mb-4">Create account</h1>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full name" className="input" />
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input" />
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="input" />
                <input type="file" accept=".pdf,.docx,.txt" onChange={e=>setFile(e.target.files?.[0] || null)} className="input" />
                <textarea value={jd} onChange={e=>setJd(e.target.value)} className="input h-32" placeholder="Optional: paste target job description for aligned ATS score" />
                <button className="btn btn-primary w-full">Register & Analyze Resume</button>
            </form>
            {ats && (
                <div className="mt-4">
                    <div className="text-sm opacity-70">ATS Score</div>
                    <div className="text-3xl font-extrabold">{ats.score}/100</div>
                    <div className="text-sm opacity-70">Coverage: {ats.keywordCoverage}% • Bullets: {ats.bullets} • Metrics: {ats.metrics}</div>
                </div>
            )}
        </div>
    );
}
