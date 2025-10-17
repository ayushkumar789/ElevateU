"use client";
import "./globals.css";
import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "../components/ThemeToggle";
import Logo from "../components/Logo";

export default function RootLayout({ children }) {
    const [authed, setAuthed] = useState(false);
    useEffect(() => {
        const t = localStorage.getItem(process.env.JWT_STORAGE_KEY);
        setAuthed(!!t);
    }, []);
    return (
        <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen text-zinc-900 dark:text-zinc-100">
        <header className="sticky top-0 z-50 backdrop-blur bg-white/60 dark:bg-zinc-900/60 border-b dark:border-zinc-800">
            <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
                <Logo />
                <nav className="flex gap-4 text-sm md:text-base">
                    <Link href="/" className="hover:underline">Home</Link>
                    {authed && (
                        <>
                            <Link href="/resume" className="hover:underline">Resume</Link>
                            <Link href="/interview" className="hover:underline">Interview</Link>
                            <Link href="/jobs" className="hover:underline">Jobs</Link>
                            <Link href="/gamify" className="hover:underline">Gamify</Link>
                            <Link href="/dashboard" className="hover:underline">Dashboard</Link>
                        </>
                    )}
                    {!authed && <Link href="/login" className="hover:underline">Login</Link>}
                </nav>
                <ThemeToggle />
            </div>
        </header>
        <main className="max-w-7xl mx-auto p-6">{children}</main>
        <footer className="max-w-7xl mx-auto p-6 text-sm opacity-70">© {new Date().getFullYear()} ElevateU</footer>
        </body>
        </html>
    );
}
