// Per-student grade reports as PDFs, styled like the tracking documents
// (farmhouse palette, Playfair titles). Every report is exactly ONE page
// (two-column layout), so it prints single-sided; a whole class exports
// as one PDF with one page per student.

import { PAL, SCHOOL, TEACHER_LINE } from "./trackingSpecs";
import { GT_GROUPS, FJ_WEEKS, FC_COLS, effPct, calcStudent, fmtPct, pctToLevel } from "./coop";
import { DANCE_COURSES, danceCourse, danceId, calcDance } from "./dance";

const hex = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const M = 36;
const PAGE_W = 612;
const PAGE_H = 792;
const GUTTER = 14;
const COL_W = (PAGE_W - 2 * M - GUTTER) / 2; // 263
const COL_X = [M, M + COL_W + GUTTER];

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

async function libs() {
  const { jsPDF } = await import("jspdf");
  const { default: autoTable } = await import("jspdf-autotable");
  return { jsPDF, autoTable };
}

const tableStyle = {
  theme: "grid",
  styles: {
    font: "helvetica", fontSize: 6.8, cellPadding: 2,
    lineColor: hex(PAL.border), lineWidth: 0.5, textColor: hex(PAL.ink),
  },
  headStyles: {
    fillColor: hex(PAL.headFill), textColor: hex(PAL.main),
    fontStyle: "bold", fontSize: 6.6,
  },
  alternateRowStyles: { fillColor: hex(PAL.alt) },
};

// one assignment table confined to a column
function colTable(doc, autoTable, col, y, body) {
  autoTable(doc, {
    ...tableStyle,
    startY: y,
    margin: { left: COL_X[col], right: PAGE_W - COL_X[col] - COL_W, top: M, bottom: M },
    head: [["Category", "Assignment", "Lv", "%"]],
    body,
    columnStyles: {
      0: { cellWidth: 62 }, 1: { cellWidth: 133 },
      2: { cellWidth: 26, halign: "center" }, 3: { cellWidth: 42, halign: "center" },
    },
    pageBreak: "avoid",
  });
  return doc.lastAutoTable.finalY;
}

function summaryTable(doc, autoTable, col, y, rows) {
  autoTable(doc, {
    ...tableStyle,
    styles: { ...tableStyle.styles, fontSize: 7.2, cellPadding: 2.4 },
    startY: y,
    margin: { left: COL_X[col], right: PAGE_W - COL_X[col] - COL_W, top: M, bottom: M },
    head: [["Summary", "Result"]],
    body: rows,
    columnStyles: { 0: { cellWidth: COL_W - 78, fontStyle: "bold" }, 1: { cellWidth: 78, halign: "center" } },
    pageBreak: "avoid",
  });
  return doc.lastAutoTable.finalY;
}

function masthead(doc, TF, student, eyebrow, statLine) {
  doc.setFont("helvetica", "bold").setFontSize(7.5).setTextColor(...hex(PAL.eyebrow));
  doc.text(eyebrow, M, M + 6);
  doc.setFont(TF, TF === "times" ? "bold" : "normal").setFontSize(17);
  doc.setTextColor(...hex(PAL.dark));
  doc.text(student.name, M, M + 26);
  doc.setFont("helvetica", "normal").setFontSize(8).setTextColor(...hex(PAL.soft));
  doc.text(
    `${SCHOOL}   •   Grade Report${student.sid ? `   •   Student #${student.sid}` : ""}`,
    M, M + 39
  );
  doc.setFont("helvetica", "bold").setFontSize(8.2).setTextColor(...hex(PAL.main));
  doc.text(statLine, M, M + 53);
  doc.setDrawColor(...hex(PAL.band)).setLineWidth(1.2);
  doc.line(M, M + 60, PAGE_W - M, M + 60);
  return M + 70;
}

function footer(doc, student) {
  doc.setDrawColor(...hex(PAL.band)).setLineWidth(0.8);
  doc.line(M, PAGE_H - 24, PAGE_W - M, PAGE_H - 24);
  doc.setFont("helvetica", "normal").setFontSize(7).setTextColor(...hex(PAL.footer));
  doc.text(`${student.name}  •  Grade Report  •  ${TEACHER_LINE}`, PAGE_W / 2, PAGE_H - 13, { align: "center" });
}

const valFor = (cells) => (id) => {
  const c = cells?.[id];
  const e = effPct(c);
  const lv = c?.lv ? String(c.lv).toUpperCase() : e !== null ? pctToLevel(e) : "";
  return [lv, e === null ? "" : fmtPct(e)];
};

const dash = (v) => (v === null || v === undefined ? "—" : fmtPct(v));
const withLevel = (v) => (v === null || v === undefined ? "—" : `${fmtPct(v)}  (${pctToLevel(v)})`);

// split rows roughly in half, one table per column
function twoColumns(doc, autoTable, y0, rows, summary, student) {
  const half = Math.ceil(rows.length / 2);
  colTable(doc, autoTable, 0, y0, rows.slice(0, half));
  const rightEnd = colTable(doc, autoTable, 1, y0, rows.slice(half));
  summaryTable(doc, autoTable, 1, rightEnd + 8, summary);
  footer(doc, student);
}

// ---------- co-op page ----------

function renderCoopPage(doc, autoTable, TF, student, cells) {
  const r = calcStudent(cells);
  const val = valFor(cells);
  const y0 = masthead(
    doc, TF, student, "MRS. M. McGUIRE  •  COOPERATIVE EDUCATION",
    `Midterm ${withLevel(r.gtFinal)}      Journals ${withLevel(r.fjAvg)}      Final ${withLevel(r.fcFinal)}`
  );

  const rows = [];
  for (const g of GT_GROUPS) {
    g.cols.forEach((label, i) => rows.push([g.label, label, ...val(`gt.${g.key}.${i}`)]));
  }
  for (const w of FJ_WEEKS) rows.push(["Final Journals", `Week ${w}`, ...val(`fj.${w}`)]);
  for (const c of FC_COLS) {
    const v = r.fcParts[c.id];
    rows.push([
      "Final Marking Sheet",
      `${c.label} (${Math.round(c.weight * 100)}%)${c.auto ? " — auto" : ""}`,
      "",
      v === null ? "" : fmtPct(v),
    ]);
  }

  twoColumns(doc, autoTable, y0, rows, [
    ["Pre-Placement Average (65%)", dash(r.pp)],
    ["Hours & Journals Average (30%)", dash(r.hj)],
    ["Learning Plan (5%)", dash(r.lp)],
    ["Midterm Mark", withLevel(r.gtFinal)],
    ["Journals Average", withLevel(r.fjAvg)],
    ["Final Mark", withLevel(r.fcFinal)],
  ], student);
}

// ---------- dance page ----------

function renderDancePage(doc, autoTable, TF, student, cells, course) {
  const r = calcDance(cells, course);
  const val = valFor(cells);
  const y0 = masthead(
    doc, TF, student, `MRS. M. McGUIRE  •  DANCE (${course.code})`,
    `${course.termLabel} ${withLevel(r.term)}      ${course.apLabel} ${withLevel(r.ap)}      Current ${withLevel(r.current)}`
  );

  const rows = [];
  for (const g of course.groups) {
    g.cols.forEach((label, i) =>
      rows.push([
        `${g.label} (${Math.round(g.weight * 100)}%)`,
        g.colWeights ? `${label} (${g.colWeights[i]}%)` : label,
        ...val(danceId(g.key, i)),
      ])
    );
  }

  twoColumns(doc, autoTable, y0, rows, [
    ...r.summary.map((s) => [s.label, dash(s.value)]),
    ["Current Mark", withLevel(r.current)],
  ], student);
}

function renderPage(doc, autoTable, TF, cls, student) {
  if (cls.type === "dance") {
    renderDancePage(doc, autoTable, TF, student, cls.cells?.[student.id] || {}, danceCourse(cls));
  } else {
    renderCoopPage(doc, autoTable, TF, student, cls.cells?.[student.id] || {});
  }
}

// ---------- public API ----------

export async function generateStudentReportPdf(student, cells) {
  const { jsPDF, autoTable } = await libs();
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const TF = await loadFont(doc);
  renderCoopPage(doc, autoTable, TF, student, cells);
  return { blob: doc.output("blob"), filename: `Grade Report - ${student.name}.pdf` };
}

export async function generateDanceReportPdf(student, cells, courseKey) {
  const { jsPDF, autoTable } = await libs();
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const TF = await loadFont(doc);
  const course = DANCE_COURSES[courseKey] || DANCE_COURSES.ATC20;
  renderDancePage(doc, autoTable, TF, student, cells, course);
  return { blob: doc.output("blob"), filename: `Grade Report - ${student.name}.pdf` };
}

// one PDF for the whole class: one page per student
export async function generateClassReportsPdf(cls) {
  const { jsPDF, autoTable } = await libs();
  const doc = new jsPDF({ unit: "pt", format: "letter", orientation: "portrait" });
  const TF = await loadFont(doc);
  cls.students.forEach((st, i) => {
    if (i > 0) doc.addPage("letter", "portrait");
    renderPage(doc, autoTable, TF, cls, st);
  });
  return { blob: doc.output("blob"), filename: `${cls.name} - Grade Reports.pdf` };
}
