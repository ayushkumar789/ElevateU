export function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(process.env.JWT_STORAGE_KEY);
}

export async function api(path, options = {}) {
    const token = getToken();
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
        if (typeof window !== "undefined") {
            localStorage.removeItem(process.env.JWT_STORAGE_KEY);
            window.location.href = "/login";
        }
        throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}
