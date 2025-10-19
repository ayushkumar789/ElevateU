export async function track(type, data = {}) {
    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/events`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type, ...data })
        });
    } catch {}
}
