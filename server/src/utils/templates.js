// Minimal & Modern templates using pdfkit (server-side)

import PDFDocument from "pdfkit";

function header(doc, name, email, phone, links) {
    doc.fontSize(18).text(name, { continued:false, align:"left" }).moveDown(0.2);
    doc.fontSize(10).fillColor("#BBBBBB")
        .text([email, phone, ...(links||[])].filter(Boolean).join("  •  "))
        .fillColor("#FFFFFF")
        .moveDown(0.6);
}

function section(doc, title) {
    doc.moveDown(0.4);
    doc.fontSize(12).fillColor("#7db3ff").text(title.toUpperCase(), { underline:false });
    doc.moveDown(0.1).fillColor("#FFFFFF");
}

export function renderMinimalPDF(stream, data) {
    const doc = new PDFDocument({ margin: 42, size: "A4" });
    doc.pipe(stream);

    header(doc, data.name||"", data.email||"", data.phone||"", data.links);

    if (data.summary) {
        section(doc, "Summary");
        doc.fontSize(10).text(data.summary);
    }

    if (data.skills?.length) {
        section(doc, "Skills");
        doc.fontSize(10).text(data.skills.join(", "));
    }

    if (data.experience?.length) {
        section(doc, "Experience");
        data.experience.forEach(x => {
            doc.fontSize(11).text(`${x.title} • ${x.company} (${x.start} – ${x.end})`);
            if (x.tech) doc.fontSize(9).fillColor("#BBBBBB").text(x.tech).fillColor("#FFFFFF");
            if (x.notes) doc.fontSize(10).text("• " + x.notes.replace(/\n/g, "\n• "));
            doc.moveDown(0.4);
        });
    }

    if (data.projects?.length) {
        section(doc, "Projects");
        data.projects.forEach(p => {
            doc.fontSize(11).text(p.name);
            if (p.tech) doc.fontSize(9).fillColor("#BBBBBB").text(p.tech).fillColor("#FFFFFF");
            if (p.notes) doc.fontSize(10).text("• " + p.notes.replace(/\n/g, "\n• "));
            doc.moveDown(0.3);
        });
    }

    if (data.education?.length) {
        section(doc, "Education");
        data.education.forEach(e => {
            doc.fontSize(11).text(`${e.degree} • ${e.school} (${e.year||""})`);
        });
    }

    doc.end();
}
