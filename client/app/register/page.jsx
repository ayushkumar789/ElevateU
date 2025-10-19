"use client";

import { useState } from "react";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    async function submit(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setError(data?.error || "Registration failed");
                return;
            }

            // Save token and go to dashboard
            if (data?.token) {
                localStorage.setItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY, data.token);
            }
            window.location.href = "/dashboard";
        } catch (err) {
            setError(err.message || "Network error");
        } finally {
            setBusy(false);
        }
    }

    return (
        <div className="max-w-lg mx-auto p-6 rounded-md border">
            <h1 className="text-2xl font-bold mb-4">Create account</h1>

            {error && <div className="mb-3 text-red-500 text-sm">{error}</div>}

            <form onSubmit={submit} className="space-y-3">
                <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-md border px-3 py-2 bg-transparent"
                    required
                />
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full rounded-md border px-3 py-2 bg-transparent"
                    required
                />
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full rounded-md border px-3 py-2 bg-transparent"
                    minLength={6}
                    required
                />

                <button
                    type="submit"
                    disabled={busy}
                    className="btn btn-primary w-full disabled:opacity-60"
                >
                    {busy ? "Creating account..." : "Register"}
                </button>
            </form>

            <p className="mt-4 text-sm opacity-70">
                Already have an account?{" "}
                <a href="/login" className="underline">
                    Log in
                </a>
            </p>
        </div>
    );
}
