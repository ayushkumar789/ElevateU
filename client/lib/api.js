export function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY);
}

export async function api(path, options = {}) {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem(process.env.NEXT_PUBLIC_JWT_STORAGE_KEY);
            window.location.href = "/login";
        }
        throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}
export async function searchSemantic(q, k = 20) {
    // use the authenticated wrapper + correct API prefix
    return api("/api/search/semantic", {
        method: "POST",
        body: JSON.stringify({ q, k }),
    });
}

export async function suggestSkills(q, k = 10) {
    return api("/api/search/skills-suggest", {
        method: "POST",
        body: JSON.stringify({ q, k }),
    });
}
// client/lib/api.js
export async function llmAtsAnalyze({ file, jobDescription, resumeText }) {
    const tokenKey = process.env.NEXT_PUBLIC_JWT_STORAGE_KEY || "elevateu_jwt";
    const token = (typeof document !== "undefined" && document.cookie.split("; ").find(c=>c.startsWith(`${tokenKey}=`)))?.split("=")[1];
    let body, headers = {};
    if (file && !file.name.toLowerCase().endsWith(".txt")) {
        const fd = new FormData();
        fd.append("file", file, file.name);
        fd.append("jobDescription", jobDescription || "");
        body = fd;
    } else {
        body = JSON.stringify({ resumeText: resumeText || (file ? await file.text() : ""), jobDescription });
        headers["Content-Type"] = "application/json";
    }
    const r = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/resume/llm-ats`, {
        method: "POST",
        headers: { ...(token ? { Authorization: `Bearer ${decodeURIComponent(token)}` } : {}), ...headers },
        body
    });
    const data = await r.json().catch(()=> ({}));
    if (!r.ok) throw new Error(data?.error || "LLM ATS failed");
    return data; // { jd_match_percent, missing_keywords, profile_summary, found_keywords }
}
