// Printable per-student grade report as a PDF, styled like the
// tracking documents (farmhouse palette, Playfair titles).

import { PAL, SCHOOL, TEACHER_LINE } from "./trackingSpecs";
import { GT_GROUPS, FJ_WEEKS, FC_COLS, effPct, calcStudent, fmtPct, pctToLevel } from "./coop";

const hex = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const M = 40;

let fontB64 = null;
async function loadFont(doc) {
  try {
    if (!fontB64) {
      const res = await fetch("/fonts/PlayfairDisplay.ttf");
      if (!res.ok) throw new Error("no font");
      const buf = new Uint8Array(await res.arrayBuffer());
      let bin = "";
      for (let i = 0; i < buf.length; i += 0x8000) {
        bin += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
      }
      fontB64 = btoa(bin);
    }
    doc.addFileToVFS("PlayfairDisplay.ttf", fontB64);
    doc.addFont("PlayfairDisplay.ttf", "Playfair", "normal");
    return "Playfair";
  } catch {
    return "times";
  }
}

export async function generateStudentReportPdf(student, cells) {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const TF = await loadFont(doc);
  const title = (size) => doc.setFont(TF, TF === "times" ? "bold" : "normal").setFontSize(size);
  const r = calcStudent(cells);

  // Masthead
  doc.setFont("helvetica", "bold").setFontSize(8).setTextColor(...hex(PAL.eyebrow));
  doc.text(TEACHER_LINE, M, M + 8);
  title(22);
  doc.setTextColor(...hex(PAL.dark));
  doc.text(student.name, M, M + 32);
  doc.setFont("helvetica", "normal").setFontSize(9.5).setTextColor(...hex(PAL.soft));
  doc.text(`${SCHOOL}   •   Grade Report`, M, M + 48);
  doc.setDrawColor(...hex(PAL.band)).setLineWidth(1.5);
  doc.line(M, M + 56, 612 - M, 612 > 0 ? M + 56 : 0);

  const common = {
    theme: "grid",
    margin: { left: M, right: M, top: M, bottom: M + 20 },
    styles: {
      font: "helvetica", fontSize: 9, cellPadding: 4,
      lineColor: hex(PAL.border), lineWidth: 0.6, textColor: hex(PAL.ink),
    },
    headStyles: {
      fillColor: hex(PAL.headFill), textColor: hex(PAL.main),
      fontStyle: "bold", fontSize: 8.5,
    },
    alternateRowStyles: { fillColor: hex(PAL.alt) },
  };

  const val = (id) => {
    const c = cells?.[id];
    const e = effPct(c);
    const lv = c?.lv ? String(c.lv).toUpperCase() : e !== null ? pctToLevel(e) : "";
    return [lv, e === null ? "" : fmtPct(e)];
  };

  let y = M + 70;
  const section = (label) => {
    title(13);
    doc.setTextColor(...hex(PAL.main));
    doc.text(label, M, y + 12);
    y += 20;
  };
  const table = (head, body, columnStyles) => {
    autoTable(doc, { ...common, startY: y, head: [head], body, columnStyles });
    y = doc.lastAutoTable.finalY + 16;
  };
  const ensureRoom = (need) => {
    if (y + need > 792 - M - 20) {
      doc.addPage("letter", "portrait");
      y = M;
    }
  };

  // Mid Term Marking Sheet
  section("Mid Term Marking Sheet");
  const gtBody = [];
  for (const g of GT_GROUPS) {
    g.cols.forEach((label, i) => {
      const [lv, pc] = val(`gt.${g.key}.${i}`);
      gtBody.push([g.label, label, lv, pc]);
    });
  }
  table(["Section", "Assignment", "Level", "%"], gtBody, {
    0: { cellWidth: 120 }, 1: { cellWidth: 250 }, 2: { cellWidth: 70, halign: "center" }, 3: { cellWidth: 92, halign: "center" },
  });

  ensureRoom(120);
  table(["Summary", "Result"], [
    ["Pre-Placement Average (65%)", r.pp === null ? "—" : fmtPct(r.pp)],
    ["Hours & Journals Average (30%)", r.hj === null ? "—" : fmtPct(r.hj)],
    ["Learning Plan (5%)", r.lp === null ? "—" : fmtPct(r.lp)],
    ["Midterm Mark", r.gtFinal === null ? "—" : `${fmtPct(r.gtFinal)}   (${pctToLevel(r.gtFinal)})`],
  ], { 0: { cellWidth: 370, fontStyle: "bold" }, 1: { cellWidth: 162, halign: "center" } });

  // Final Journals
  ensureRoom(200);
  section("Final Journals — Weeks 7–15");
  table(["Week", "Level", "%"],
    [...FJ_WEEKS.map((w) => {
      const [lv, pc] = val(`fj.${w}`);
      return [`Week ${w}`, lv, pc];
    }), ["Average", r.fjAvg === null ? "—" : r.fjLevel, r.fjAvg === null ? "" : fmtPct(r.fjAvg)]],
    { 0: { cellWidth: 300, fontStyle: "bold" }, 1: { cellWidth: 116, halign: "center" }, 2: { cellWidth: 116, halign: "center" } });

  // Final Marking Sheet
  ensureRoom(260);
  section("Final Marking Sheet");
  table(["Component", "Weight", "%"],
    [...FC_COLS.map((c) => {
      const v = r.fcParts[c.id];
      return [`${c.label}${c.auto ? " (auto)" : ""}`, `${Math.round(c.weight * 100)}%`, v === null ? "—" : fmtPct(v)];
    }), ["Final Mark", "", r.fcFinal === null ? "—" : `${fmtPct(r.fcFinal)}   (${r.fcLevel})`]],
    { 0: { cellWidth: 300, fontStyle: "bold" }, 1: { cellWidth: 116, halign: "center" }, 2: { cellWidth: 116, halign: "center" } });

  // Footer on every page
  const n = doc.getNumberOfPages();
  for (let i = 1; i <= n; i++) {
    doc.setPage(i);
    doc.setDrawColor(...hex(PAL.band)).setLineWidth(0.8);
    doc.line(M, 792 - 26, 612 - M, 792 - 26);
    doc.setFont("helvetica", "normal").setFontSize(7.5).setTextColor(...hex(PAL.footer));
    doc.text(`${student.name}  •  Grade Report  •  Page ${i} of ${n}`, 306, 792 - 14, { align: "center" });
  }

  return { blob: doc.output("blob"), filename: `Grade Report - ${student.name}.pdf` };
}
