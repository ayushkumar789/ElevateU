"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";

function Mic({ onText }) {
    const [rec, setRec] = useState(null);
    const [listening, setListening] = useState(false);
    useEffect(()=>()=>rec?.stop?.(),[rec]);

    function start() {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) { alert("Speech Recognition not supported in this browser"); return; }
        const r = new SR(); r.lang="en-US"; r.continuous=true; r.interimResults=false;
        r.onresult = (e)=> {
            const t = Array.from(e.results).map(r=>r[0].transcript).join(" ");
            onText(t);
        };
        r.onend = ()=> setListening(false);
        r.start(); setRec(r); setListening(true);
    }
    function stop(){ rec?.stop(); setListening(false); }
    return (
        <button type="button" onClick={listening?stop:start}
                className={`px-3 py-1 rounded ${listening?"bg-red-600":"bg-neutral-800"}`}>
            {listening?"Stop ":"Record "}
            <span className="opacity-80">(voice)</span>
        </button>
    );
}

export default function Builder() {
    const [data, setData] = useState({
        name:"", email:"", phone:"", links:[],
        summary:"",
        experience:[{ title:"", company:"", start:"", end:"", tech:"", notes:"" }],
        projects:[{ name:"", notes:"", tech:"" }],
        education:[{ school:"", degree:"", year:"" }],
        skills:[]
    });
    const [busy, setBusy] = useState(false);
    const [drafting, setDrafting] = useState(false);

    function up(path, value){
        setData(d => {
            const copy = JSON.parse(JSON.stringify(d));
            const seg = path.split(".");
            let cur = copy;
            for (let i=0;i<seg.length-1;i++) cur = cur[seg[i]];
            cur[seg.at(-1)] = value;
            return copy;
        });
    }

    async function aiDraft() {
        setDrafting(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/draft`,{
            method:"POST", credentials:"include",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ data })
        });
        const j = await res.json();
        if (j.ok) setData(j.data);
        setDrafting(false);
        track("resume_generate",{ payload:{ via:"ai_draft" }});
    }

    async function render(kind="pdf") {
        setBusy(true);
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/render?format=${kind}`,{
            method:"POST", credentials:"include",
            headers:{ "Content-Type":"application/json" },
            body: JSON.stringify({ data })
        });
        setBusy(false);
        if (!res.ok) return alert("Render failed");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        track("resume_render",{ payload:{ format: kind }});
    }

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold">Resume Builder</h1>
                <Mic onText={(t)=>up("summary", (data.summary?data.summary+" ":"")+t)} />
            </div>

            <section className="grid md:grid-cols-2 gap-4">
                <input className="bg-neutral-900 p-3 rounded" placeholder="Full Name"
                       value={data.name} onChange={e=>up("name", e.target.value)} />
                <input className="bg-neutral-900 p-3 rounded" placeholder="Email"
                       value={data.email} onChange={e=>up("email", e.target.value)} />
                <input className="bg-neutral-900 p-3 rounded" placeholder="Phone"
                       value={data.phone} onChange={e=>up("phone", e.target.value)} />
                <input className="bg-neutral-900 p-3 rounded" placeholder="Portfolio/LinkedIn (comma separated)"
                       onChange={e=>up("links", e.target.value.split(",").map(s=>s.trim()))} />
                <textarea className="bg-neutral-900 p-3 rounded md:col-span-2" rows={4}
                          placeholder="Professional Summary"
                          value={data.summary} onChange={e=>up("summary", e.target.value)} />
            </section>

            <section className="space-y-2">
                <div className="font-medium">Experience</div>
                {data.experience.map((x,i)=>(
                    <div key={i} className="grid md:grid-cols-5 gap-2 bg-neutral-900 p-3 rounded">
                        <input className="p-2 rounded bg-neutral-800" placeholder="Title" value={x.title} onChange={e=>{ const v=[...data.experience]; v[i].title=e.target.value; setData({...data,experience:v}); }} />
                        <input className="p-2 rounded bg-neutral-800" placeholder="Company" value={x.company} onChange={e=>{ const v=[...data.experience]; v[i].company=e.target.value; setData({...data,experience:v}); }} />
                        <input className="p-2 rounded bg-neutral-800" placeholder="Start" value={x.start} onChange={e=>{ const v=[...data.experience]; v[i].start=e.target.value; setData({...data,experience:v}); }} />
                        <input className="p-2 rounded bg-neutral-800" placeholder="End" value={x.end} onChange={e=>{ const v=[...data.experience]; v[i].end=e.target.value; setData({...data,experience:v}); }} />
                        <input className="p-2 rounded bg-neutral-800" placeholder="Tech (comma)" value={x.tech} onChange={e=>{ const v=[...data.experience]; v[i].tech=e.target.value; setData({...data,experience:v}); }} />
                        <textarea className="p-2 rounded bg-neutral-800 md:col-span-5" rows={2}
                                  placeholder="Notes / Achievements (free text)"
                                  value={x.notes} onChange={e=>{ const v=[...data.experience]; v[i].notes=e.target.value; setData({...data,experience:v}); }} />
                    </div>
                ))}
                <button className="px-3 py-1 rounded bg-neutral-800"
                        onClick={()=>setData(d=>({...d, experience:[...d.experience, {title:"",company:"",start:"",end:"",tech:"",notes:""}]}))}>
                    + Add experience
                </button>
            </section>

            <section className="space-y-2">
                <div className="font-medium">Projects</div>
                {data.projects.map((x,i)=>(
                    <div key={i} className="grid md:grid-cols-3 gap-2 bg-neutral-900 p-3 rounded">
                        <input className="p-2 rounded bg-neutral-800" placeholder="Name" value={x.name}
                               onChange={e=>{ const v=[...data.projects]; v[i].name=e.target.value; setData({...data,projects:v}); }} />
                        <input className="p-2 rounded bg-neutral-800" placeholder="Tech (comma)" value={x.tech}
                               onChange={e=>{ const v=[...data.projects]; v[i].tech=e.target.value; setData({...data,projects:v}); }} />
                        <textarea className="p-2 rounded bg-neutral-800 md:col-span-3" rows={2}
                                  placeholder="Notes / Achievements"
                                  value={x.notes} onChange={e=>{ const v=[...data.projects]; v[i].notes=e.target.value; setData({...data,projects:v}); }} />
                    </div>
                ))}
                <button className="px-3 py-1 rounded bg-neutral-800"
                        onClick={()=>setData(d=>({...d, projects:[...d.projects, {name:"",notes:"",tech:""}]}))}>
                    + Add project
                </button>
            </section>

            <div className="flex gap-3">
                <button onClick={aiDraft} className="px-4 py-2 rounded bg-indigo-600">{drafting?"Drafting…":"AI Draft"}</button>
                <button onClick={()=>render("pdf")} disabled={busy} className="px-4 py-2 rounded bg-green-600">{busy?"Rendering…":"Export PDF"}</button>
            </div>
        </div>
    );
}
