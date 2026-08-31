// PDF renderer for the Student Tracking Documents.
// Consumes the same specs as the Word renderer, so both formats match.
// Handles mixed portrait/landscape pages in one workbook PDF.

import { buildSpecs, subtitleText, PAL, TEACHER_LINE, FOOTER_LINE } from "./trackingSpecs";

const hex = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const DXA_TO_PT = 0.05; // both page sizes use 0.5" margins → 10800/14400 dxa = 540/720 pt
const MARGIN = 36;

export async function generateTrackingPdf(kind, students, className) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const specs = buildSpecs(students);

  let doc;
  let filename;
  if (kind === "workbook") {
    doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
    cover(doc, specs, className);
    for (const spec of specs) {
      doc.addPage("letter", spec.landscape ? "landscape" : "portrait");
      renderSpec(doc, autoTable, spec, className);
    }
    filename = `Student Tracking Documents${className ? ` - ${className}` : ""}.pdf`;
  } else {
    const spec = specs.find((s) => s.key === kind);
    if (!spec) throw new Error(`Unknown document: ${kind}`);
    doc = new jsPDF({ unit: "pt", format: "letter", orientation: spec.landscape ? "landscape" : "portrait" });
    renderSpec(doc, autoTable, spec, className);
    filename = `${spec.file}${className ? ` - ${className}` : ""}.pdf`;
  }

  addFooters(doc);
  return { blob: doc.output("blob"), filename };
}

function pageWidth(doc) {
  return doc.internal.pageSize.getWidth();
}

function masthead(doc, title, className) {
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...hex(PAL.eyebrow));
  doc.text(TEACHER_LINE, MARGIN, MARGIN + 8);
  doc.setFont("times", "bold").setFontSize(22).setTextColor(...hex(PAL.dark));
  doc.text(title, MARGIN, MARGIN + 30);
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...hex(PAL.soft));
  doc.text(subtitleText(className), MARGIN, MARGIN + 46);
  doc.setDrawColor(...hex(PAL.band)).setLineWidth(1.5);
  doc.line(MARGIN, MARGIN + 54, pageWidth(doc) - MARGIN, MARGIN + 54);
  return MARGIN + 66;
}

function renderSpec(doc, autoTable, spec, className) {
  let y = masthead(doc, spec.title, className);
  const startPage = doc.getNumberOfPages();

  for (const it of spec.items) {
    if (it.t === "note") {
      doc.setFont("helvetica", "italic").setFontSize(8.5).setTextColor(...hex(PAL.soft));
      doc.text(it.text, MARGIN, y + 4, { maxWidth: pageWidth(doc) - 2 * MARGIN });
      y += 18;
    } else if (it.t === "h2") {
      if (y > doc.internal.pageSize.getHeight() - 120) {
        doc.addPage(undefined, spec.landscape ? "landscape" : "portrait");
        y = MARGIN + 10;
      }
      doc.setFont("times", "bold").setFontSize(14).setTextColor(...hex(PAL.main));
      doc.text(it.text, MARGIN, y + 14);
      y += 24;
    } else if (it.t === "pagebreak") {
      doc.addPage(undefined, spec.landscape ? "landscape" : "portrait");
      y = MARGIN + 10;
    } else if (it.t === "visithead") {
      if (y > doc.internal.pageSize.getHeight() - 170) {
        doc.addPage(undefined, spec.landscape ? "landscape" : "portrait");
        y = MARGIN + 10;
      }
      doc.setFont("times", "bold").setFontSize(12).setTextColor(...hex(PAL.dark));
      doc.text(it.name, MARGIN, y + 16);
      doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(...hex(PAL.soft));
      doc.text("Placement: ______________________________________", MARGIN + doc.getTextWidth(it.name) + 60, y + 16);
      y += 24;
    } else if (it.t === "table") {
      y = renderTable(doc, autoTable, it, spec, y);
    }
  }
  return startPage;
}

function renderTable(doc, autoTable, tbl, spec, startY) {
  const columnStyles = {};
  tbl.widths.forEach((w, i) => {
    columnStyles[i] = {
      cellWidth: w * DXA_TO_PT,
      halign: i === 0 && !tbl.centerFirst ? "left" : "center",
    };
  });

  const head = [tbl.head.map((h, i) => ({
    content: h.sub ? `${h.text}\n${h.sub}` : h.text,
    styles: { halign: i === 0 ? "left" : "center" },
  }))];

  let dataIdx = 0;
  const body = tbl.rows.map((row) => {
    if (row.band !== undefined) {
      return [{
        content: row.band,
        colSpan: tbl.widths.length,
        styles: {
          fillColor: hex(PAL.band), textColor: hex(PAL.dark),
          fontStyle: "bold", halign: "left", fontSize: 9.5,
        },
      }];
    }
    const zebra = row.cells[0] && !row.firstBold ? dataIdx++ % 2 === 1 : false;
    return row.cells.map((v, i) => ({
      content: v,
      styles: {
        ...(zebra ? { fillColor: hex(PAL.alt) } : {}),
        ...(i === 0 && row.firstBold ? { fontStyle: "bold", textColor: hex(PAL.main) } : {}),
        ...(i === 0 ? { fontSize: 9 } : {}),
      },
    }));
  });

  autoTable(doc, {
    startY,
    margin: { left: MARGIN, right: MARGIN, top: MARGIN + 10, bottom: MARGIN + 16 },
    head,
    body,
    theme: "grid",
    styles: {
      font: "helvetica",
      fontSize: 8.5,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      lineColor: hex(PAL.border),
      lineWidth: 0.6,
      textColor: hex(PAL.ink),
      minCellHeight: (tbl.rowH ?? 400) * DXA_TO_PT,
      valign: "middle",
    },
    headStyles: {
      fillColor: hex(PAL.headFill),
      textColor: hex(PAL.main),
      fontStyle: "bold",
      fontSize: 7,
      cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
      valign: "top",
      minCellHeight: 0,
    },
    columnStyles,
  });
  return doc.lastAutoTable.finalY + 14;
}

function cover(doc, specs, className) {
  const w = pageWidth(doc);
  const cx = w / 2;
  doc.setFont("helvetica", "bold").setFontSize(10).setTextColor(...hex(PAL.eyebrow));
  doc.text(TEACHER_LINE, cx, 300, { align: "center" });
  doc.setFont("times", "bold").setFontSize(30).setTextColor(...hex(PAL.dark));
  doc.text("Student Tracking Documents", cx, 340, { align: "center" });
  doc.setFont("helvetica", "normal").setFontSize(12).setTextColor(...hex(PAL.soft));
  doc.text(subtitleText(className), cx, 365, { align: "center" });
  doc.setDrawColor(...hex(PAL.band)).setLineWidth(1.2);
  doc.line(90, 420, w - 90, 420);
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...hex(PAL.main));
  doc.text(specs.map((t) => t.title).join("  •  "), cx, 442, { align: "center", maxWidth: w - 200 });
  doc.line(90, 480, w - 90, 480);
}

function addFooters(doc) {
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    const w = pageWidth(doc);
    const h = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...hex(PAL.band)).setLineWidth(0.8);
    doc.line(MARGIN, h - 26, w - MARGIN, h - 26);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...hex(PAL.footer));
    doc.text(`${FOOTER_LINE}  •  Page ${i} of ${n}`, w / 2, h - 14, { align: "center" });
  }
}
