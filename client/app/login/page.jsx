"use client";
import { useState } from "react";
import { setToken } from "../../lib/auth";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    async function submit(e) {
        e.preventDefault();
        setError("");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || "Login failed"); return; }

        // Save to localStorage + cookie (middleware will see cookie)
        setToken(data.token);

        // hard redirect so middleware runs on the next request
        window.location.href = "/dashboard";
    }

    return (
        <div className="max-w-md mx-auto card">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            {error && <div className="text-red-600 mb-2">{error}</div>}
            <form onSubmit={submit} className="space-y-3">
                <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" className="input" />
                <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" className="input" />
                <button className="btn btn-primary w-full">Sign in</button>
            </form>
        </div>
    );
}
