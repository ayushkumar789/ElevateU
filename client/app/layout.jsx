"use client";
import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";
import { isAuthed, clearToken } from "../lib/auth";

export default function RootLayout({ children }) {
    const [authed, setAuthed] = useState(false);
    const pathname = usePathname();

    // re-check auth on route change, auth events, visibility change
    useEffect(() => {
        const refresh = () => setAuthed(isAuthed());
        refresh();

        const onAuth = () => refresh();
        const onStorage = (e) => { if (e.key === "__elevateu_ping") refresh(); };
        const onVis = () => { if (document.visibilityState === "visible") refresh(); };

        window.addEventListener("elevateu-auth", onAuth);
        window.addEventListener("storage", onStorage);
        document.addEventListener("visibilitychange", onVis);
        return () => {
            window.removeEventListener("elevateu-auth", onAuth);
            window.removeEventListener("storage", onStorage);
            document.removeEventListener("visibilitychange", onVis);
        };
    }, [pathname]);

    function doLogout() {
        clearToken();
        window.location.href = "/"; // back to public home
    }

    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="border-b">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
                {/* Left: Brand (single Link) */}
                <div className="flex-1">
                    <Link href="/" aria-label="Go to ElevateU home" className="inline-flex items-center gap-2">
                        <Logo className="h-6 w-auto" />
                    </Link>
                </div>

                {/* Center: nav */}
                <nav className="flex-1 flex justify-center gap-6 text-sm">
                    <Link href="/" className="hover:underline">Home</Link>
                    {!authed && <Link href="/login" className="hover:underline">Login</Link>}

                    {authed && (
                        <>
                            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                            <Link href="/resume" className="hover:underline">Resume</Link>
                            <Link href="/jobs" className="hover:underline">Jobs</Link>
                            <Link href="/interview" className="hover:underline">Interview</Link>
                            <Link href="/profile" className="hover:underline">Profile</Link>
                            <button onClick={doLogout} className="hover:underline">Logout</button>
                        </>
                    )}
                </nav>

                {/* Right: theme toggle */}
                <div className="flex-1 flex justify-end">
                    <ThemeToggle />
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto p-6">{children}</main>
        <footer className="max-w-7xl mx-auto p-6 text-sm opacity-70">© {new Date().getFullYear()} ElevateU</footer>
        </body>
        </html>
    );
}
