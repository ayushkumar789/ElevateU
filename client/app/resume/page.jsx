"use client";
import { useState } from "react";
import { api } from "../../lib/api";
import RequireAuth from "../../components/RequireAuth";

async function readFileAsArrayBuffer(file) {
    return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = rej;
        fr.readAsArrayBuffer(file);
    });
}
async function extractPdfText(file) {
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");
    const version = pdfjs.version || "4.10.38";
    pdfjs.GlobalWorkerOptions.workerSrc =
        `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    const ab = await readFileAsArrayBuffer(file);
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(ab) }).promise;
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        text += content.items.map(i => i.str).join(" ") + "\n";
    }
    return text.trim();
}
async function extractDocxText(file) {
    const ab = await readFileAsArrayBuffer(file);
    const mammoth = await import("mammoth/mammoth.browser");
    const { value } = await mammoth.extractRawText({ arrayBuffer: ab });
    return (value || "").trim();
}
async function extractResumeText(file) {
    const name = (file.name || "").toLowerCase();
    if (name.endsWith(".pdf")) return await extractPdfText(file);
    if (name.endsWith(".docx")) return await extractDocxText(file);
    const ab = await readFileAsArrayBuffer(file);
    return new TextDecoder().decode(new Uint8Array(ab));
}

export default function Resume(){
    return (<RequireAuth><Content/></RequireAuth>);
}
function Content(){
    const [file,setFile]=useState(null);
    const [jd,setJd]=useState("");
    const [result,setResult]=useState(null);
    const [error,setError]=useState("");

    async function analyze(){
        try{
            setError("");
            if(!file){ setError("Choose a PDF/DOCX/TXT file."); return; }
            const resumeText = await extractResumeText(file);
            const data = await api("/api/resume/score",{ method:"POST", body: JSON.stringify({ resumeText, jobDescription: jd })});
            setResult(data);
            await api("/api/gamify/claim",{ method:"POST", body: JSON.stringify({ action:"score_resume" })});
        }catch(e){ setError(e.message); }
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="card">
                <h2 className="font-bold mb-2">Upload Resume</h2>
                <input type="file" accept=".pdf,.docx,.txt" onChange={e=>setFile(e.target.files?.[0]||null)} className="input"/>
                <h2 className="font-bold mt-4 mb-2">Target Job Description (optional)</h2>
                <textarea value={jd} onChange={e=>setJd(e.target.value)} className="input h-40" placeholder="Paste JD to align keywords..." />
                <button onClick={analyze} className="btn btn-primary mt-4">Analyze & Score</button>
            </div>

            <div className="card">
                <h2 className="font-bold mb-2">Result</h2>
                {error && <div className="text-red-600">{error}</div>}
                {!result && !error && <div className="opacity-70">Upload a resume to see suggestions.</div>}
                {result && (
                    <div className="space-y-3">
                        <div className="text-3xl font-extrabold">{result.score}/100</div>
                        <div className="opacity-80">Keyword coverage: {result.keywordCoverage}%</div>
                        <div className="opacity-80">Bullets: {result.bullets} • Metrics: {result.metrics}</div>
                        {result.missingKeywords?.length ? (
                            <div className="text-sm">
                                <div className="font-semibold mb-1">Missing keywords (from JD):</div>
                                <div className="opacity-80">{result.missingKeywords.join(", ")}</div>
                            </div>
                        ) : null}
                        <div className="text-sm">
                            <div className="font-semibold mb-1">LLM Summary</div>
                            <div className="opacity-80">{result.parsed?.summary || "—"}</div>
                        </div>
                        <div className="text-sm">
                            <div className="font-semibold mb-1">Detected skills</div>
                            <div className="opacity-80">{(result.parsed?.skills || []).join(", ") || "—"}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
