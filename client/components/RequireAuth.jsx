"use client";
import { useEffect, useState } from "react";
export default function RequireAuth({ children }) {
    const [ok, setOk] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem(process.env.JWT_STORAGE_KEY);
        if (!token) window.location.href = "/login";
        else setOk(true);
    }, []);
    if (!ok) return null;
    return children;
}
