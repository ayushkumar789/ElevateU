"use client";
import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import RequireAuth from "../../components/RequireAuth";

export default function Dashboard(){
    return (
        <RequireAuth>
            <Content/>
        </RequireAuth>
    );
}
function Content(){
    const [profile,setProfile]=useState(null); const [gamify,setGamify]=useState(null);
    useEffect(()=>{(async()=>{const d=await api("/api/profile"); setProfile(d.profile); setGamify(d.gamify);})()},[]);
    return (
        <div className="grid md:grid-cols-3 gap-6">
            <div className="card md:col-span-2">
                <h2 className="text-xl font-bold mb-2">Welcome back</h2>
                <p className="opacity-80">Headline: {profile?.headline||"Set your headline in Profile"}</p>
                <p className="opacity-80">Skills: {(profile?.skills||[]).join(", ")||"Add skills in Profile"}</p>
                <div className="mt-4 flex gap-3">
                    <a href="/resume" className="btn btn-primary">Optimize Resume</a>
                    <a href="/interview" className="btn border border-indigo-600">Start Interview</a>
                    <a href="/jobs" className="btn border border-indigo-600">Find Roles</a>
                    <a href="/profile" className="btn border border-indigo-600">Edit Profile</a>
                </div>
            </div>
            <div className="card">
                <h3 className="font-bold mb-2">Your Progress</h3>
                <div className="text-3xl font-extrabold">{gamify?.points||0} pts</div>
                <div className="opacity-80">Level {gamify?.level||1}</div>
                <div className="opacity-80">Streak: {gamify?.streakDays||0} days</div>
                <div className="text-sm opacity-70 mt-2">Badges: {(gamify?.badges||[]).join(", ")||"—"}</div>
            </div>
        </div>
    );
}
