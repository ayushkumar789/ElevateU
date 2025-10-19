"use client";

import { useState } from "react";
import { getToken } from "../../lib/auth";

export default function ResumePage() {
    const [file, setFile] = useState(null);
    const [jd, setJd] = useState("");
    const [result, setResult] = useState(null); // will store { llmDirect: { ... } }
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState("");

    async function onAnalyzeDirect() {
        setErr("");
        if (!file) {
            setErr("Please upload your resume first.");
            return;
        }

        setBusy(true);
        try {
            const token = getToken();
            const fd = new FormData();
            fd.append("file", file, file.name);
            fd.append("jobDescription", jd);

            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/resume/llm-ats-direct`,
                {
                    method: "POST",
                    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    body: fd,
                }
            );

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErr(data?.error || "Direct Gemini ATS failed");
                setResult({ llmDirect: { error: data?.error || "failed" } });
                return;
            }

            setResult({
                llmDirect: {
                    jd_match_percent:
                        typeof data.jd_match_percent === "number"
                            ? data.jd_match_percent
                            : null,
                    missing_keywords: Array.isArray(data.missing_keywords)
                        ? data.missing_keywords
                        : [],
                    profile_summary: data.profile_summary || "",
                },
            });
        } catch (e) {
            setErr(e.message || "Network error. Please try again.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="max-w-6xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Resume Analyzer</h1>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left: inputs */}
                <div className="space-y-3">
                    <input
                        type="file"
                        accept=".pdf,.doc,.docx" // direct flow expects a file
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full"
                    />
                    <textarea
                        value={jd}
                        onChange={(e) => setJd(e.target.value)}
                        placeholder="Paste job description (optional; improves JD match)"
                        className="w-full h-40 p-3 rounded-md border bg-transparent"
                    />
                    <div className="flex flex-wrap gap-3">
                        <button onClick={onAnalyzeDirect} disabled={busy} className="btn btn-primary">
                            {busy ? "Analyzing..." : "Analyze with Gemini (PDF)"}
                        </button>
                    </div>
                    {err && <div className="text-sm text-red-500">{err}</div>}
                </div>

                {/* Right: ONLY Gemini LLM (Direct from PDF) */}
                <div className="space-y-6">
                    <div className="rounded-md border p-4 space-y-3">
                        <div className="text-lg font-medium">ATS Report</div>

                        {result?.llmDirect && !result.llmDirect.error ? (
                            <div className="space-y-3">
                                <div className="text-3xl font-bold">
                                    {typeof result.llmDirect.jd_match_percent === "number"
                                        ? `${Math.round(result.llmDirect.jd_match_percent)}%`
                                        : "—"}
                                </div>

                                {!!(result.llmDirect.missing_keywords?.length) && (
                                    <div>
                                        <div className="font-medium mb-1">Missing JD keywords</div>
                                        <div className="flex flex-wrap gap-2">
                                            {result.llmDirect.missing_keywords.slice(0, 30).map((k, i) => (
                                                <span key={i} className="px-2 py-1 text-xs rounded border">
                          {k}
                        </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {result.llmDirect.profile_summary && (
                                    <div>
                                        <div className="font-medium mb-1">Profile Summary</div>
                                        <p className="text-sm opacity-90">{result.llmDirect.profile_summary}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm opacity-70">
                                {result?.llmDirect?.error
                                    ? `LLM direct analysis unavailable: ${String(result.llmDirect.error)}`
                                    : "Upload your resume (PDF/DOCX), optionally add a JD, then click Analyze."}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
