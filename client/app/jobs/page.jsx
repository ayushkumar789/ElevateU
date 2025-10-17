"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import RequireAuth from "../../components/RequireAuth";

export default function Jobs(){
    return (<RequireAuth><Content/></RequireAuth>);
}
function Content(){
    const [q,setQ]=useState("");
    const [jobs,setJobs]=useState([]);
    const [note,setNote]=useState("");

    async function load(){
        const url = `/api/jobs/recommendations${q ? `?q=${encodeURIComponent(q)}` : ""}`;
        const data = await api(url);
        setJobs(data.jobs||[]); setNote(data.note||"");
    }
    useEffect(()=>{ load(); },[]);

    return (
        <div className="card">
            <h2 className="font-bold mb-2">Recommended Jobs</h2>
            <div className="flex gap-2 mb-3">
                <input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="Search job title (e.g., frontend, data)" />
                <button className="btn btn-primary" onClick={load}>Search</button>
            </div>
            {note && <div className="text-sm opacity-70 mb-3">{note}</div>}
            <div className="grid md:grid-cols-3 gap-4">
                {jobs.map((j,i)=>(
                    <div key={i} className="card">
                        <div className="font-bold">{j.title}</div>
                        <div className="opacity-80">{j.company}</div>
                        <div className="text-xs opacity-70 mt-2">{(j.tags||[]).join(", ")}</div>
                    </div>
                ))}
            </div>
            {!jobs.length && !note && <div className="opacity-70">No jobs match your filters yet.</div>}
        </div>
    );
}
