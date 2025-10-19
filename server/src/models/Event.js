import mongoose from "mongoose";

const EventSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, required: true, index: true }, // 'job_view'|'job_click'|'save_job'|'apply_click'|'qa_answered'|'resume_generate'|'resume_render'
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    page: String,
    msDwell: Number,
    payload: Object
}, { timestamps: true });

export default mongoose.model("Event", EventSchema);
