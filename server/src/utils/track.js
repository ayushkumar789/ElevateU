import Event from "../models/Event.js";
export async function trackEvent(userId, type, { jobId, page, msDwell, payload } = {}) {
    try {
        await Event.create({ userId, type, jobId, page, msDwell, payload });
    } catch {}
}
