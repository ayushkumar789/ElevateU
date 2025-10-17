"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import RequireAuth from "../../components/RequireAuth";

export default function Interview(){
    return (<RequireAuth><Content/></RequireAuth>);
}

function Content(){
    const [skills, setSkills] = useState([]);
    const [category, setCategory] = useState("tech");
    const [count, setCount] = useState(20);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState([]);
    const [err, setErr] = useState("");
    const [transcript, setTranscript] = useState("");
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const d = await api("/api/profile");
                setSkills(d.profile?.skills || []);
            } catch { /* ignore */ }
        })();
    }, []);

    async function generate() {
        try {
            setErr(""); setLoading(true); setQuestions([]);
            const qs = `/api/interview/questions?category=${encodeURIComponent(category)}&count=${count}`;
            const data = await api(qs);
            setQuestions(data.questions || []);
        } catch (e) {
            setErr(e.message || "Failed to generate questions");
        } finally {
            setLoading(false);
        }
    }

    async function analyze() {
        try {
            setErr("");
            const d = await api("/api/interview/feedback", { method: "POST", body: JSON.stringify({ transcript }) });
            setFeedback(d);
            await api("/api/gamify/claim", { method: "POST", body: JSON.stringify({ action: "complete_interview" }) });
        } catch (e) {
            setErr(e.message || "Failed to analyze");
        }
    }

    useEffect(() => { generate(); }, []); // generate on first visit

    return (
        <div className="space-y-6">
            <div className="card">
                <div className="font-semibold mb-2">Interview Assistant (Gemini-powered)</div>
                <div className="opacity-80 text-sm">
                    We generate questions based on your stored skills:{" "}
                    {skills.length ? <b>{skills.join(", ")}</b> : <i>add skills in your Profile</i>}.
                    Choose category and count, then “Generate”.
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <select className="input max-w-[200px]" value={category} onChange={e=>setCategory(e.target.value)}>
                        <option value="tech">Technical</option>
                        <option value="behavioral">Behavioral</option>
                    </select>
                    <input type="number" className="input w-28" min={5} max={50} value={count} onChange={e=>setCount(parseInt(e.target.value||"20",10))}/>
                    <button className="btn btn-primary" onClick={generate} disabled={loading}>{loading ? "Generating..." : "Generate"}</button>
                </div>
            </div>

            {err && <div className="card text-red-500">{err}</div>}

            <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                    <h3 className="font-bold mb-2">Question Bank ({questions.length})</h3>
                    <ol className="list-decimal ml-6 space-y-2">
                        {questions.map(q => (
                            <li key={q.id}>
                                <div className="font-medium">{q.q}</div>
                                <div className="text-xs opacity-70">Skill: {q.subject} • Type: {q.type} • Difficulty: {q.difficulty}</div>
                            </li>
                        ))}
                        {!questions.length && !loading && <div className="opacity-70">No questions yet. Click Generate.</div>}
                    </ol>
                </div>

                <div className="card">
                    <h3 className="font-bold mb-2">Your Answer</h3>
                    <textarea value={transcript} onChange={e=>setTranscript(e.target.value)} className="input h-56" placeholder="Paste or type your response here..." />
                    <button onClick={analyze} className="btn btn-primary mt-3">Get Feedback</button>
                    {feedback && (
                        <div className="mt-4">
                            <div className="font-semibold">Analysis</div>
                            <div className="opacity-80">Confidence: {feedback.analysis.confidence}%</div>
                            <div className="opacity-80">Clarity: {feedback.analysis.clarity}%</div>
                            <div className="opacity-80">Pace (wpm): {feedback.analysis.pace}</div>
                            <div className="opacity-80">STAR Structure: {feedback.analysis.structure}%</div>
                            <div className="font-semibold mt-2">Tips</div>
                            <ul className="list-disc ml-6">{feedback.tips.map((t,i)=><li key={i}>{t}</li>)}</ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
