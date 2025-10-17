// Live job seeder from public ATS boards + Remotive.
// Usage examples:
//   node scripts/fetch_jobs.js --days 120 --min 150
//   node scripts/fetch_jobs.js --days 180 --min 250 --reset
//   node scripts/fetch_jobs.js --days 90 --dry   (no DB writes)

import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Job from "../src/models/Job.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// ---------- Load company slugs ----------
function loadCompanies() {
    const cfg = path.resolve(process.cwd(), "scripts", "companies.json");
    if (fs.existsSync(cfg)) {
        const j = JSON.parse(fs.readFileSync(cfg, "utf8"));
        return {
            greenhouse: j.greenhouse || [],
            lever: j.lever || [],
            ashby: j.ashby || [],
            workable: j.workable || []
        };
    }
    // fallback (tiny) if file missing
    return {
        greenhouse: ["openai","stripe","airbnb","cloudflare","datadog","figma","notion"],
        lever: ["shopify","affirm","postman","grammarly"],
        ashby: ["anthropic","retool","webflow"],
        workable: ["hotjar","typeform"]
    };
}

const COMP = loadCompanies();

// ---------- Tag dictionary ----------
const TAGS = [
    // Tech
    "react","next.js","vue","angular","svelte","javascript","typescript","node","express",
    "python","django","flask","fastapi","java","spring","kotlin","go","rust","c++","c","php","laravel",
    "html","css","tailwind","redux","graphql","apollo",
    "mongodb","postgresql","mysql","redis","elasticsearch","kafka",
    "aws","gcp","azure","docker","kubernetes","terraform","ansible",
    "ml","ai","nlp","cv","pytorch","tensorflow","sklearn","pandas","spark","databricks","dbt",
    "security","devops","sre","qa","testing","automation",
    // Non-tech
    "marketing","seo","sem","content","copywriting","social media","brand","growth",
    "sales","account executive","business development","customer success","support",
    "finance","accounting","fp&a","treasury","audit","tax",
    "hr","people operations","recruiting","talent acquisition",
    "design","ui","ux","research","product design","graphic design",
    "operations","strategy","legal","paralegal","project management","program management",
    "data analyst","bi","analytics","product manager","pm","supply chain","logistics"
];

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const sanitize = (t) => (t || "").replace(/\s+/g, " ").trim();
function extractTags(title, description) {
    const hay = `${title} ${description}`.toLowerCase();
    const found = new Set();
    TAGS.forEach(t => {
        const rx = new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`, "i");
        if (rx.test(hay)) found.add(t);
    });
    return Array.from(found);
}
function uniqueKey(j) {
    return `${(j.company||"").toLowerCase()}|${(j.title||"").toLowerCase()}|${(j.location||"").toLowerCase()}|${j.url||""}`;
}
function parseDate(s) {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
}

// ---------- Providers ----------
async function fetchGreenhouse(company) {
    const url = `https://boards.greenhouse.io/${company}/embed/job_board`;
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    const out = [];
    for (const dep of data?.departments || []) {
        for (const p of dep?.jobs || []) {
            out.push({
                title: p.title,
                company,
                description: sanitize(p.content || ""),
                location: sanitize(p.location?.name || ""),
                url: p.absolute_url || (p.internal_job_id ? `https://boards.greenhouse.io/${company}/jobs/${p.internal_job_id}` : ""),
                postedAt: parseDate(p.updated_at || p.created_at) || new Date(),
                tags: extractTags(p.title || "", p.content || "")
            });
        }
    }
    return out;
}

async function fetchLever(company) {
    const url = `https://api.lever.co/v0/postings/${company}?mode=json`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const arr = await res.json();
    return arr.map(p => ({
        title: p.text,
        company,
        description: sanitize((p.descriptionPlain || p.description || "")),
        location: sanitize((p.categories?.location || "")),
        url: p.hostedUrl || p.applyUrl,
        postedAt: p.createdAt ? new Date(Number(p.createdAt)) : new Date(),
        tags: extractTags(p.text || "", p.description || "")
    }));
}

async function fetchAshby(company) {
    const url = `https://jobs.ashbyhq.com/api/posting/${company}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const posts = data?.jobs || data?.postings || data || [];
    return posts.map(p => ({
        title: p.title || p.jobTitle || "",
        company,
        description: sanitize(p.description || p.jobDescription || ""),
        location: sanitize(p.location || p.primaryLocation || ""),
        url: p.applyUrl || (p.slug ? `https://jobs.ashbyhq.com/${company}/${p.slug}` : p.hostedUrl),
        postedAt: parseDate(p.publishedAt || p.createdAt || p.updatedAt) || new Date(),
        tags: extractTags(p.title || "", p.description || "")
    }));
}

async function fetchWorkable(subdomain) {
    const url = `https://${subdomain}.workable.com/api/accounts/${subdomain}/jobs?state=published`;
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) return [];
    const arr = (await res.json())?.jobs || [];
    return arr.map(p => ({
        title: p.title,
        company: subdomain,
        description: sanitize(p.description || ""),
        location: sanitize(p.location?.city || p.location?.country || ""),
        url: p.url,
        postedAt: parseDate(p.published || p.created) || new Date(),
        tags: extractTags(p.title || "", p.description || "")
    }));
}

// NEW: Remotive (real remote jobs across many domains)
async function fetchRemotive() {
    // public API
    const url = "https://remotive.com/api/remote-jobs?limit=500";
    const res = await fetch(url, { headers: { "accept": "application/json" } });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = data?.jobs || [];
    return arr.map(j => ({
        title: j.title,
        company: j.company_name,
        description: sanitize(j.description || ""),
        location: sanitize(j.candidate_required_location || j.job_type || ""),
        url: j.url,
        postedAt: parseDate(j.publication_date) || new Date(),
        tags: extractTags(j.title || "", j.description || "")
    }));
}

// ---------- Orchestrator ----------
async function gatherAll({ days = 120 }) {
    const cutoff = Date.now() - days*24*60*60*1000;
    const all = [];
    const seen = new Set();

    async function accept(rows) {
        for (const r of rows) {
            if (!r.title || !r.url) continue;
            const k = uniqueKey(r);
            if (seen.has(k)) continue;
            const dt = r.postedAt instanceof Date ? r.postedAt.getTime() : Date.now();
            if (dt < cutoff) continue;
            seen.add(k);
            all.push(r);
        }
    }

    // Providers (polite: small delay between each company)
    for (const c of COMP.greenhouse) { await accept(await fetchGreenhouse(c)); await sleep(120); }
    for (const c of COMP.lever)      { await accept(await fetchLever(c));      await sleep(120); }
    for (const c of COMP.ashby)      { await accept(await fetchAshby(c));      await sleep(120); }
    for (const c of COMP.workable)   { await accept(await fetchWorkable(c));   await sleep(120); }

    // Remotive once (adds many categories beyond tech)
    await accept(await fetchRemotive());

    return all;
}

// ---------- Save ----------
async function saveJobs(items, { dry = false, reset = false }) {
    if (dry) {
        console.log(`[dry-run] Would upsert ${items.length} jobs`);
        return;
    }
    if (reset) {
        await Job.deleteMany({});
        console.log("Cleared Job collection.");
    }
    const ops = items.map(j => ({
        updateOne: {
            filter: { url: j.url },
            update: {
                $set: {
                    title: j.title,
                    company: j.company,
                    description: j.description,
                    tags: j.tags,
                    location: j.location,
                    postedAt: j.postedAt,
                    url: j.url
                }
            },
            upsert: true
        }
    }));
    if (ops.length) {
        const res = await Job.bulkWrite(ops, { ordered: false });
        console.log(`Upserted: ${res.upsertedCount || 0}, Modified: ${res.modifiedCount || 0}`);
    }
}

// ---------- CLI ----------
async function main() {
    const args = process.argv.slice(2);
    const get = (flag, def) => {
        const i = args.indexOf(flag);
        if (i >= 0 && args[i+1]) return args[i+1];
        return def;
    };
    const days = parseInt(get("--days", "120"), 10);
    const minCount = parseInt(get("--min", "150"), 10);
    const dry = args.includes("--dry");
    const reset = args.includes("--reset");

    if (!process.env.MONGODB_URI) {
        console.error("MONGODB_URI missing in server/.env");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);

    const items = await gatherAll({ days });
    console.log(`Fetched ${items.length} fresh jobs (<=${days} days).`);

    if (items.length < minCount && !dry) {
        console.warn(`Warning: Only ${items.length} < requested minimum ${minCount}. Add more slugs in scripts/companies.json or increase --days.`);
    }

    await saveJobs(items, { dry, reset });

    await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
