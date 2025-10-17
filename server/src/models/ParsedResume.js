import mongoose from "mongoose";
const ParsedResumeSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true, unique: true },
    summary: String,
    skills: [String],
    keywords: [String],
    education: [{ degree: String, school: String, year: String }],
    experience: [{ title: String, company: String, start: String, end: String, highlights: [String] }],
    projects: [{ name: String, highlights: [String] }],
    certifications: [String],
}, { timestamps: true });

export default mongoose.model("ParsedResume", ParsedResumeSchema);
