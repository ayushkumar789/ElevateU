"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import RequireAuth from "../../components/RequireAuth";

export default function Gamify(){
    return (<RequireAuth><Content/></RequireAuth>);
}
function Content(){
    const [stats,setStats]=useState(null); const [top,setTop]=useState([]);
    useEffect(()=>{(async()=>{ try{ const s=await api("/api/gamify/stats"); setStats(s); const lb=await api("/api/gamify/leaderboard"); setTop(lb.top||[]);}catch(e){} })();},[]);
    if(!stats) return <div className="card">Loading...</div>;
    return (
        <div className="grid md:grid-cols-2 gap-6">
            <div className="card"><h2 className="font-bold mb-2">Your Gamification</h2>
                <div className="text-3xl font-extrabold">{stats.points} pts</div>
                <div className="opacity-80">Level {stats.level} • Streak {stats.streakDays} days</div>
                <div className="text-sm opacity-70 mt-2">Badges: {(stats.badges||[]).join(", ")||"—"}</div></div>
            <div className="card"><h2 className="font-bold mb-2">Leaderboard</h2>
                <ul className="space-y-2">{top.map((u,i)=>(<li key={i} className="flex justify-between"><span>{i+1}. {u.name}</span><span>{u.points} pts • L{u.level}</span></li>))}</ul></div>
        </div>
    );
}
