import mammoth from "mammoth";
// ✅ Use the Node-friendly legacy build
//    This exposes getDocument / GlobalWorkerOptions directly.
import {
    getDocument,
    GlobalWorkerOptions,
} from "pdfjs-dist/legacy/build/pdf.js";

// Point worker to the legacy worker bundle (Node won't actually spawn it, but this silences warnings)
try {
    GlobalWorkerOptions.workerSrc = "pdfjs-dist/legacy/build/pdf.worker.js";
} catch {}

/** Convert Node Buffer -> pure Uint8Array view (not a Buffer instance) */
function bufferToUint8(buf) {
    if (buf instanceof Uint8Array && !(buf instanceof Buffer)) return buf;
    // Use the underlying ArrayBuffer slice so we don't return a Buffer subclass
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
}

/** Extract text from a PDF Buffer using pdfjs-dist (legacy build) */
async function extractPdfText(buffer) {
    const uint8 = bufferToUint8(buffer);
    const loadingTask = getDocument({ data: uint8 });
    const pdf = await loadingTask.promise;
    let text = "";
    for (let p = 1; p <= pdf.numPages; p++) {
        const page = await pdf.getPage(p);
        const content = await page.getTextContent();
        text += content.items.map((i) => i.str).join(" ") + "\n";
    }
    return text;
}

/** Read text from an uploaded file Buffer (PDF/DOCX/TXT fallback) */
export async function extractTextFromFile(file) {
    const mime = (file.mimetype || "").toLowerCase();
    const name = (file.originalname || "").toLowerCase();

    if (mime.includes("pdf") || name.endsWith(".pdf")) {
        return await extractPdfText(file.buffer);
    }

    if (mime.includes("word") || name.endsWith(".docx")) {
        const { value } = await mammoth.extractRawText({ buffer: file.buffer });
        return value || "";
    }

    // fallback: treat as UTF-8 text
    return file.buffer.toString("utf-8");
}

/** Very simple skill extraction using a dictionary. */
export function extractSkills(text) {
    const lib = [
        // languages
        "c", "c++", "cpp", "java", "python", "javascript", "typescript", "go", "rust",
        // web
        "html", "css", "react", "next", "node", "express", "redux", "tailwind",
        // data/backend
        "mongodb", "postgresql", "mysql", "docker", "kubernetes", "aws", "gcp",
        // ai/ml
        "pytorch", "tensorflow", "nlp",
    ];
    const lo = (text || "").toLowerCase();
    const found = new Set();
    lib.forEach((k) => {
        const rx = new RegExp(`\\b${k.replace("+", "\\+")}\\b`, "i");
        if (rx.test(lo)) found.add(k);
    });
    const norm = Array.from(found).map((s) =>
        s === "cpp" ? "c++" : s === "next" ? "next.js" : s
    );
    return Array.from(new Set(norm));
}
