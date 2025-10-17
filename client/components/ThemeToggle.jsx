"use client";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
    const [mounted, setMounted] = useState(false);
    const [dark, setDark] = useState(false);

    useEffect(() => {
        setMounted(true);
        const saved = typeof window !== "undefined" && localStorage.getItem("theme");
        const isDark = saved ? saved === "dark" : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(isDark);
        if (isDark) document.documentElement.classList.add("dark");
    }, []);

    if (!mounted) return null;

    function toggle() {
        const next = !dark;
        setDark(next);
        if (next) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
        }
    }

    return <button onClick={toggle} className="btn btn-primary">{dark ? "Light" : "Dark"}</button>;
}
