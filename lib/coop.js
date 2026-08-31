// Ontario co-op gradebook engine: conversion tables, module/column
// definitions, and all grade calculations. Mirrors the Excel workbook:
// each gradable column stores {lv, pc} — an achievement level entry and/or
// a direct percentage entry. Level wins when both could apply, and the
// UI clears one when the other is typed so only one ever has data.

// ---------- Conversion table ----------
export const LEVEL_TO_PCT = {
  "4+": 97.5, "4": 90.5, "4-": 83.0,
  "3+": 78.0, "3": 74.5, "3-": 71.0,
  "2+": 68.0, "2": 64.5, "2-": 61.0,
  "1+": 58.0, "1": 54.5, "1-": 51.0,
  "R": 49.0, "0": 49.0,
};

const PCT_TO_LEVEL = [
  [95, "4+"], [87, "4"], [80, "4-"], [77, "3+"], [73, "3"], [70, "3-"],
  [67, "2+"], [63, "2"], [60, "2-"], [57, "1+"], [53, "1"], [50, "1-"], [0, "R"],
];

export function normalizeLevel(raw) {
  return String(raw ?? "").trim().toUpperCase();
}

export function isValidLevel(raw) {
  const s = normalizeLevel(raw);
  return s !== "" && Object.prototype.hasOwnProperty.call(LEVEL_TO_PCT, s);
}

export function levelToPct(raw) {
  const s = normalizeLevel(raw);
  return isValidLevel(s) ? LEVEL_TO_PCT[s] : null;
}

// "Largest lower bound ≤ input" reverse lookup
export function pctToLevel(pct) {
  if (pct === null || pct === undefined || Number.isNaN(pct)) return null;
  for (const [lo, lv] of PCT_TO_LEVEL) if (pct >= lo) return lv;
  return "R";
}

// Direct % entry accepts Excel-style decimals (0.75) or plain numbers (75).
export function parsePct(raw) {
  const s = String(raw ?? "").trim().replace("%", "");
  if (s === "") return null;
  const n = Number(s);
  if (Number.isNaN(n) || n < 0) return null;
  return n <= 1 ? n * 100 : n;
}

// Effective percentage for one {lv, pc} cell
export function effPct(cell) {
  if (!cell) return null;
  if (cell.lv !== undefined && cell.lv !== null && String(cell.lv).trim() !== "") {
    const v = levelToPct(cell.lv);
    if (v !== null) return v;
  }
  return parsePct(cell.pc);
}

function avg(values) {
  const vs = values.filter((v) => v !== null && v !== undefined);
  return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
}

// ---------- Module 1: Grade Tracker columns ----------
export const GT_GROUPS = [
  {
    key: "u1", label: "Unit 1 Assignments", theme: "blue",
    cols: ["A.2 Resume", "A.3 Cover Letter", "A.4 Interview Questions", "U.1 Email Etiquette", "U.1 Phone Etiquette"],
  },
  {
    key: "u2", label: "Unit 2 Assignments", theme: "green",
    cols: ["A.1 Human Rights", "A.2 ESA C. Study", "A.3 HS Sheet", "A.4 Confidentiality", "A.5 Journals 1-5"],
  },
  {
    key: "qz", label: "Quizzes", theme: "gold",
    cols: ["U.2.A.1 Discrimination", "U.2.A.1 ESA", "U.2.A.2 Ontario Labour Relations", "U.2.A.3 WHIMIS Poster", "U.2.A.3 PPE 1", "U.6.A.2 Inquiry", "U.10 Customer Service", "U.10 Leadership"],
  },
  {
    key: "hj", label: "Hours & Journals", theme: "red",
    cols: ["Pre-Placement", "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6", "Hours (90/180)"],
  },
  {
    key: "lp", label: "Learning Plan", theme: "purple",
    cols: ["Learning Plan"],
  },
];

export const GT_PP_IDS = GT_GROUPS.filter((g) => ["u1", "u2", "qz"].includes(g.key))
  .flatMap((g) => g.cols.map((_, i) => `gt.${g.key}.${i}`));
export const GT_HJ_IDS = GT_GROUPS.find((g) => g.key === "hj").cols.map((_, i) => `gt.hj.${i}`);
export const GT_LP_ID = "gt.lp.0";

// ---------- Module 2: Final Journals ----------
export const FJ_WEEKS = [7, 8, 9, 10, 11, 12, 13, 14, 15];
export const FJ_IDS = FJ_WEEKS.map((w) => `fj.${w}`);

// ---------- Module 3: Final Co-op Marking Sheet ----------
export const FC_COLS = [
  { id: "fc.midterm", label: "Midterm Mark", weight: 0.10, auto: "midterm" },
  { id: "fc.hours", label: "Total Hours", weight: 0.10 },
  { id: "fc.scav", label: "Scavenger Hunt", weight: 0.10 },
  { id: "fc.finlit", label: "Financial Literacy Quiz", weight: 0.05 },
  { id: "fc.journals", label: "Journals", weight: 0.15, auto: "journals" },
  { id: "fc.perf", label: "Placement Performance", weight: 0.20 },
  { id: "fc.poster", label: "Poster", weight: 0.10 },
  { id: "fc.resume", label: "Exit Resume", weight: 0.05 },
  { id: "fc.pres", label: "Presentation", weight: 0.15 },
];

// ---------- Per-student calculations ----------
export function calcStudent(cells) {
  const c = cells || {};
  const pp = avg(GT_PP_IDS.map((id) => effPct(c[id])));
  const hj = avg(GT_HJ_IDS.map((id) => effPct(c[id])));
  const lp = effPct(c[GT_LP_ID]);

  // Final grade blank when no pre-placement data; H&J and LP default to 0
  const gtFinal = pp === null ? null : pp * 0.65 + (hj ?? 0) * 0.30 + (lp ?? 0) * 0.05;

  const fjAvg = avg(FJ_IDS.map((id) => effPct(c[id])));

  const fcParts = {};
  let anyFc = false;
  for (const col of FC_COLS) {
    let v;
    if (col.auto === "midterm") v = gtFinal;
    else if (col.auto === "journals") v = fjAvg;
    else v = effPct(c[col.id]);
    fcParts[col.id] = v;
    if (v !== null) anyFc = true;
  }
  const fcFinal = anyFc
    ? FC_COLS.reduce((sum, col) => sum + (fcParts[col.id] ?? 0) * col.weight, 0)
    : null;

  return {
    pp, hj, lp, gtFinal,
    fjAvg, fjLevel: pctToLevel(fjAvg),
    fcParts, fcFinal, fcLevel: pctToLevel(fcFinal),
  };
}

export function fmtPct(v, digits = 1) {
  return v === null || v === undefined ? "" : `${v.toFixed(digits)}%`;
}
