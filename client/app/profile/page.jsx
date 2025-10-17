"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import RequireAuth from "../../components/RequireAuth";

export default function Profile(){
    return (<RequireAuth><Content/></RequireAuth>);
}
function Content(){
    const [profile,setProfile]=useState({ headline:"", skills:[], resumeText:"" });
    const [skillsInput,setSkillsInput]=useState(""); const [msg,setMsg]=useState("");
    useEffect(()=>{(async()=>{ const d=await api("/api/profile"); setProfile({...d.profile}); setSkillsInput((d.profile?.skills||[]).join(",")); })()},[]);
    async function save(){
        await api("/api/profile",{ method:"PUT", body: JSON.stringify({ profile: { ...profile, skills: skillsInput.split(",").map(s=>s.trim()).filter(Boolean) } }) });
        setMsg("Saved!"); setTimeout(()=>setMsg(""),1500);
    }
    return (
        <div className="max-w-2xl mx-auto card">
            <h2 className="font-bold mb-4">Your Profile</h2>
            <input className="input mb-3" placeholder="Headline" value={profile.headline||""} onChange={e=>setProfile(p=>({...p, headline:e.target.value}))}/>
            <input className="input mb-3" placeholder="Skills (comma separated)" value={skillsInput} onChange={e=>setSkillsInput(e.target.value)}/>
            <textarea className="input h-48" placeholder="Resume text (auto-filled from uploads)" value={profile.resumeText||""} onChange={e=>setProfile(p=>({...p, resumeText:e.target.value}))}/>
            <button onClick={save} className="btn btn-primary mt-3">Save</button>{msg&&<div className="text-green-600 mt-2">{msg}</div>}
        </div>
    );
}
