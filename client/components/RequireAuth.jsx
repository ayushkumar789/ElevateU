// client/components/RequireAuth.jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const TOKEN_KEY = process.env.NEXT_PUBLIC_NEXT_PUBLIC_JWT_STORAGE_KEY || "elevateu_jwt";

function hasTokenCookie() {
    if (typeof document === "undefined") return false;
    return document.cookie.split("; ").some((c) => c.startsWith(`${TOKEN_KEY}=`));
}
function getLsToken() {
    if (typeof window === "undefined") return null;
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export default function RequireAuth({ children }) {
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        // agree with middleware: cookie is the source of truth
        const ok = hasTokenCookie() || !!getLsToken();
        if (!ok) router.replace("/login");
        else setReady(true);
    }, [router]);

    if (!ready) return null;
    return children;
}
