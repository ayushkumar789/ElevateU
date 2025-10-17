import mongoose from "mongoose";

const JobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, default: "" },
    tags: [{ type: String }],
    location: { type: String, default: "" },
    postedAt: { type: Date, default: Date.now },
    url: { type: String, unique: true, index: true }
}, { timestamps: true });

export default mongoose.model("Job", JobSchema);
