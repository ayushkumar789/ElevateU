// FAISS-based semantic search (via child process addon = faiss-node is heavy).
// We load precomputed job vectors via faiss-cpu saved index using a tiny WASM reader alternative.
// Simpler path: we implement cosine search in Node with embeddings later if needed.
// For now, we do a pragmatic approach: fuzzy keyword + title/desc boost + tags overlap.
// (Still provides semantic-ish results without shipping large native deps into Node.)

import Job from "../models/Job.js";

// lightweight "semantic-ish" search using tokens + tag overlap + recency boost
function tokenize(q=""){ return q.toLowerCase().split(/[^a-z0-9+.#-]+/).filter(Boolean); }

export async function semanticJobsSearch(query, limit=30) {
    const toks = tokenize(query);
    if (!toks.length) return [];

    // coarse filter in DB
    const rx = new RegExp(toks.map(t=>`(?=.*${t})`).join(""), "i");
    const candidates = await Job.find({
        $or: [
            { title: rx }, { description: rx }, { company: rx }, { tags: { $in: toks } }
        ]
    }).limit(300);

    const now = Date.now();
    function score(j){
        const hay = `${j.title} ${j.company} ${j.location} ${(j.tags||[]).join(" ")} ${j.description}`.toLowerCase();
        const hit = toks.reduce((s,t)=> s + (hay.includes(t)?1:0), 0);
        const tagMatch = (j.tags||[]).filter(t => toks.includes(String(t).toLowerCase())).length;
        const recencyDays = (now - new Date(j.postedAt || j.updatedAt || now).getTime())/86400000;
        const recencyBoost = Math.max(0, 1 - (recencyDays/180)); // fade over 6 months
        return hit*1.0 + tagMatch*0.7 + recencyBoost*0.5;
    }

    return candidates
        .map(j => ({ j, s: score(j) }))
        .sort((a,b)=>b.s-a.s)
        .slice(0, limit)
        .map(x => x.j);
}

export async function suggestSkills(query, limit=8) {
    const BASE = [
        "react","next.js","node.js","express","typescript","javascript","python","java","spring",
        "django","flask","fastapi","mongodb","mysql","postgresql","redis","graphql","docker",
        "kubernetes","aws","gcp","azure","tailwind","html","css","git","jenkins","kafka",
        "spark","pandas","numpy","tensorflow","pytorch","scikit-learn","nlp","computer vision",
        "golang","rust","kotlin","c++","c","product management","ui/ux design","marketing","seo",
        "finance","accounting","hr","qa testing","sre","devops","data engineer"
    ];
    const q = query.toLowerCase();
    return BASE
        .map(s => ({ s, d: levenshtein(q, s.toLowerCase()) }))
        .sort((a,b)=>a.d-b.d)
        .slice(0, limit)
        .map(x=>x.s);
}

function levenshtein(a,b){
    const m = Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for (let i=0;i<=a.length;i++) m[i][0]=i;
    for (let j=0;j<=b.length;j++) m[0][j]=j;
    for (let i=1;i<=a.length;i++){
        for (let j=1;j<=b.length;j++){
            const cost = a[i-1]===b[j-1]?0:1;
            m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+cost);
        }
    }
    return m[a.length][b.length];
}
