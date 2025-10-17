export function extractSkills(text) {
    const lib = [
        "c","c++","cpp","java","python","javascript","typescript","go","rust",
        "html","css","react","next.js","node","express","redux","tailwind",
        "mongodb","postgresql","mysql","docker","kubernetes","aws","gcp",
        "pytorch","tensorflow","nlp"
    ];
    const lo = (text || "").toLowerCase();
    const found = new Set();
    lib.forEach(k => {
        const rx = new RegExp(`\\b${k.replace("+","\\+")}\\b`, "i");
        if (rx.test(lo)) found.add(k);
    });
    return Array.from(found);
}
