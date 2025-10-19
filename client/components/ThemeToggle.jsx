"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setMounted(true);
        try {
            const saved = localStorage.getItem("theme");
            let isDark;
            if (saved === "dark") isDark = true;
            else if (saved === "light") isDark = false;
            else isDark = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;

            setDark(isDark);
            document.documentElement.classList.toggle("dark", isDark);
        } catch {
            // fail-safe: no-op
        }
    }, []);

    if (!mounted) return null;

    function toggle() {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
    }

    return (
        <button onClick={toggle} className="px-3 py-2 rounded-md border text-sm">
            {dark ? "Light" : "Dark"}
        </button>
    );
}
