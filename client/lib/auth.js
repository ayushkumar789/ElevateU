// client/lib/auth.js
export const TOKEN_KEY = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || "elevateu_jwt";

function readCookie(name) {
    if (typeof document === "undefined") return null;
    const hit = document.cookie.split("; ").find(c => c.startsWith(`${name}=`));
    return hit ? decodeURIComponent(hit.split("=")[1]) : null;
}

function setCookie(name, value, maxAgeSec = 60 * 60 * 24 * 30) {
    if (typeof document === "undefined") return;
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}
function clearCookie(name) {
    if (typeof document === "undefined") return;
    document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getToken() {
    // prefer cookie (same as middleware), fallback to localStorage
    const c = readCookie(TOKEN_KEY);
    if (c) return c;
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}

export function setToken(t) {
    try { localStorage.setItem(TOKEN_KEY, t); } catch {}
    setCookie(TOKEN_KEY, t);
    // notify all listeners (same tab + other tabs)
    window.dispatchEvent(new Event("elevateu-auth"));
    try { localStorage.setItem("__elevateu_ping", String(Date.now())); } catch {}
}

export function clearToken() {
    try { localStorage.removeItem(TOKEN_KEY); } catch {}
    clearCookie(TOKEN_KEY);
    window.dispatchEvent(new Event("elevateu-auth"));
    try { localStorage.setItem("__elevateu_ping", String(Date.now())); } catch {}
}

export function isAuthed() {
    return !!getToken();
}
