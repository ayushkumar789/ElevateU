// Content-based recommender with cosine similarity over skill tags.
// If a trained model file exists (./models/jobs_model.json), we’ll blend its scores.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let jobsModel = null; // { tagWeights: { react:1.2, node:1.1, ... } }
const modelPath = path.join(__dirname, "models", "jobs_model.json");
if (fs.existsSync(modelPath)) {
    try {
        jobsModel = JSON.parse(fs.readFileSync(modelPath,"utf8"));
    } catch {
        jobsModel = null;
    }
}

function cosine(a, b){
    // a,b maps tag -> weight
    const tags = new Set([...Object.keys(a), ...Object.keys(b)]);
    let dot=0, na=0, nb=0;
    for(const t of tags){
        const va = a[t] || 0;
        const vb = b[t] || 0;
        dot += va*vb; na += va*va; nb += vb*vb;
    }
    return (na && nb) ? (dot / (Math.sqrt(na)*Math.sqrt(nb))) : 0;
}

export function scoreJobAgainstSkills(job, skills){
    const userVec = {};
    skills.forEach(s => userVec[s.toLowerCase()] = 1);

    const jobVec = {};
    (job.tags || []).forEach(t => jobVec[(t||"").toLowerCase()] = 1);

    let sim = cosine(userVec, jobVec);

    // If ML tag weights exist, reweight by model priors
    if (jobsModel?.tagWeights){
        const wUser = {};
        for (const k of Object.keys(userVec)){
            wUser[k] = (jobsModel.tagWeights[k] || 1);
        }
        const wJob = {};
        for (const k of Object.keys(jobVec)){
            wJob[k] = (jobsModel.tagWeights[k] || 1);
        }
        const simWeighted = cosine(wUser, wJob);
        // blend
        sim = 0.6*sim + 0.4*simWeighted;
    }

    return sim; // 0..1
}
