// Shared data helpers for the dashboard.
// All data lives in the browser's localStorage under one key, so Megan's
// gradebook stays on her own device and nothing is sent to a server.

export const STORAGE_KEY = "megs-dashboard-v2";
const LEGACY_KEY = "megs-dashboard-v1";
export const MAX_STUDENTS = 30;

let nextId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

export function makeStudent(name, sid = "", grade = "") {
  return { id: nextId(), name, sid: String(sid || ""), grade: String(grade || "") };
}

// Roster from the Student List export (John Paul II CSS, Aug 2026)
const SEED_ROSTER = [
  ["69061", "Alejaga, Trykes Huer", "12"],
  ["69060", "Alejaga, Zebedee Eliakim", "12"],
  ["65410", "Ali, Abir", "12"],
  ["2501566", "Badar, Muhammad", "12"],
  ["65414", "Bruder, Rayne", "12"],
  ["75816", "Bustillo, Jenkin", "12"],
  ["26490", "Canlas, Edmund-Alexander", "11"],
  ["57190", "Castillano, Francis Andre", "12"],
  ["63608", "Collens, Dylan", "11"],
  ["71779", "Daoust, Brandon", "11"],
  ["48213", "Foanyi, Janell", "12"],
  ["769239", "Godoy, Julian", "12"],
  ["73554", "Hamoay, Simon", "12"],
  ["74215", "Johnstone, Prestyn", "11"],
  ["25805", "Keo, Aiden", "11"],
  ["74900", "Lariosa, Julia", "12"],
  ["32842", "Malko, Hermiz", "11"],
  ["768129", "Masterson, Trinity", "12"],
  ["66369", "Ngazi, Elysee", "12"],
  ["61847", "Olokesusi, Daniel", "12"],
  ["70212", "Olumide, Oluwafikunayo", "11"],
  ["37963", "Reyes, Noah", "12"],
  ["24631", "Reynaldo, Fernando", "11"],
];

export function defaultState() {
  const students = SEED_ROSTER.map(([sid, name, grade]) =>
    makeStudent(name, sid, grade)
  );
  const cls = {
    id: nextId(),
    name: "My Class",
    students,
    cells: {},
  };
  return { classes: [cls], activeClassId: cls.id };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.classes) && s.classes.length) return s;
    }
    // migrate rosters from the old simple gradebook, if present
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy);
      if (old && Array.isArray(old.classes) && old.classes.length) {
        const classes = old.classes.map((c) => ({
          id: c.id,
          name: c.name,
          students: (c.students || []).slice(0, MAX_STUDENTS),
          cells: {},
        }));
        return { classes, activeClassId: old.activeClassId || classes[0].id };
      }
    }
  } catch {
    // fall through to a fresh state
  }
  return defaultState();
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable — nothing else to do client-side
  }
}

// ---------- Roster parsing ----------
// Accepts rows (array of arrays, from a spreadsheet) or pasted text and
// pulls out student names, plus IDs and grade levels when present.
// Handles SIS "Student List" exports with columns like:
//   ID | Name | Grade | Gender | Birth Date

const NAME_RE = /^[A-Za-zÀ-ÿ'’.\- ]+,\s*[A-Za-zÀ-ÿ'’.\- ]+$/;

function looksLikeName(cell) {
  const s = String(cell ?? "").trim();
  if (!s || s.length < 3) return false;
  if (NAME_RE.test(s)) return true;
  // "First Last" style: 2+ alphabetic words, no digits
  return /^[A-Za-zÀ-ÿ'’.\-]+( [A-Za-zÀ-ÿ'’.\-]+)+$/.test(s);
}

export function parseRosterRows(rows) {
  if (!rows || !rows.length) return [];
  const clean = rows
    .map((r) => (Array.isArray(r) ? r.map((c) => String(c ?? "").trim()) : []))
    .filter((r) => r.some((c) => c));

  // Look for a header row that names its columns
  let nameCol = -1;
  let idCol = -1;
  let gradeCol = -1;
  let startRow = 0;
  for (let i = 0; i < Math.min(clean.length, 10); i++) {
    const row = clean[i].map((c) => c.toLowerCase());
    const n = row.findIndex((c) => /(^|\b)(name|student)($|\b)/.test(c));
    if (n !== -1) {
      nameCol = n;
      idCol = row.findIndex((c) => /^(id|student ?id|number)$/.test(c));
      gradeCol = row.findIndex((c) => /^grade/.test(c));
      startRow = i + 1;
      break;
    }
  }

  const out = [];
  for (let i = startRow; i < clean.length; i++) {
    const row = clean[i];
    let name = "";
    let sid = "";
    let grade = "";
    if (nameCol !== -1) {
      name = row[nameCol] || "";
      if (idCol !== -1) sid = row[idCol] || "";
      if (gradeCol !== -1) grade = row[gradeCol] || "";
      if (!looksLikeName(name)) continue;
    } else {
      // No header: find the first name-looking cell in the row
      const ni = row.findIndex(looksLikeName);
      if (ni === -1) continue;
      name = row[ni];
      const digits = row.find((c, j) => j !== ni && /^\d{3,}$/.test(c));
      if (digits) sid = digits;
      const g = row.find((c, j) => j !== ni && /^(9|10|11|12|[1-8])$/.test(c));
      if (g) grade = g;
    }
    out.push(makeStudent(name, sid, grade));
  }
  return out;
}

export function parseRosterText(text) {
  const rows = [];
  for (const line of String(text || "").split(/\r?\n/)) {
    const t = line.trim();
    if (!t) continue;
    // Pasted SIS report line: "69061 Alejaga, Trykes Huer 12 Male 05/08/2009"
    const m = t.match(
      /^(\d{3,})?\s*([A-Za-zÀ-ÿ'’.\- ]+,\s*[A-Za-zÀ-ÿ'’.\- ]+?)(?:\s+(\d{1,2}))?(?:\s+(?:Male|Female|M|F))?(?:\s+\d{1,2}\/\d{1,2}\/\d{2,4})?\s*$/
    );
    if (m && looksLikeName(m[2])) {
      rows.push([m[1] || "", m[2].trim(), m[3] || ""]);
      continue;
    }
    // Otherwise split on tabs/commas and let the row parser figure it out
    rows.push(t.split(/\t|,(?=\S)/).map((c) => c.trim()));
  }
  // Reuse the row heuristics for anything that wasn't a report line
  return parseRosterRows(rows);
}

export function sortRoster(students) {
  return [...students].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}
