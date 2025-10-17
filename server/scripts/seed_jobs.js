import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Job from "../src/models/Job.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
    const file = path.resolve(process.cwd(), "scripts", "jobs_sample.json");
    if (!fs.existsSync(file)) {
        console.error("jobs_sample.json not found at scripts/jobs_sample.json");
        process.exit(1);
    }
    const items = JSON.parse(fs.readFileSync(file, "utf8"));
    if (!Array.isArray(items) || !items.length) {
        console.error("jobs_sample.json must be a non-empty array");
        process.exit(1);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    await Job.deleteMany({});
    await Job.insertMany(items.map(j => ({
        title: j.title,
        company: j.company,
        description: j.description || "",
        tags: j.tags || []
    })));
    console.log(`Inserted ${items.length} jobs.`);
    await mongoose.disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
