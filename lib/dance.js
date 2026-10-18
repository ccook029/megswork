// Dance (ATC20) gradebook structure and calculations.
// Marks breakdown from Meagan's course outline:
//   TERM WORK 65%  = Written Work 20% (Comprehension 10, Quizzes 5,
//                    Reflections 5) + Physical Assessments 45%
//                    (Performance Tests 25, Skills 10, Barre 5, Activities 5)
//   ATTENDANCE AND PARTICIPATION 15%
//   FINAL 20%      = Culminating Performance 5, Culminating Preparation 5,
//                    Exam 10
// Entry works exactly like the co-op gradebook: an Ontario level or a
// direct percent per assignment; blanks are skipped (not counted as 0),
// and the running mark re-weights across the categories with marks in them.

import { effPct } from "./coop";

export const DANCE_GROUPS = [
  {
    key: "comp", label: "Comprehension", weight: 0.10, theme: "blue",
    cols: [
      "Birth of Hip-Hop",
      "Origins of Dance Textbook Questions",
      "Jazz History Textbook Part One",
      "Jazz History Textbook Part Two/Three",
      "Lyrical Debate Article",
      "Written Choreography",
    ],
  },
  {
    key: "quiz", label: "Quizzes", weight: 0.05, theme: "gold",
    cols: ["Dance Science Quiz", "Basic Elements of Dance Quiz", "History of Hip-Hop Quiz"],
  },
  {
    key: "refl", label: "Reflections", weight: 0.05, theme: "purple",
    cols: ["Dance Goals Essay", "Hip-Hop Inspiration Reflection", "Contemporary Inspiration Reflection"],
  },
  {
    key: "perf", label: "Performance Tests", weight: 0.25, theme: "green",
    cols: ["Hip-Hop Test", "Jazz Test", "Lyrical/Contemporary Test"],
  },
  {
    key: "skill", label: "Skills", weight: 0.10, theme: "green",
    cols: ["Pirouettes", "Chaines", "Kicks Turning", "Jetes/Russians", "Ballet Turns", "Piques", "Fan Kicks"],
  },
  {
    key: "barre", label: "Barre", weight: 0.05, theme: "green",
    cols: ["Ballet Positions", "Plies", "Tendus"],
  },
  {
    key: "act", label: "Activities", weight: 0.05, theme: "green",
    cols: ["B-Boy Activity", "Small Group Choreography"],
  },
  {
    key: "ap", label: "Attendance & Participation", weight: 0.15, theme: "red",
    cols: [
      "September/February Performance Preparation",
      "October/March Performance Preparation",
      "November/April Performance Preparation",
      "December/May Performance Preparation",
      "January/June Performance Preparation",
      "Warm-Ups",
    ],
  },
  {
    key: "fin", label: "Final", weight: 0.20, theme: "black",
    cols: ["Culminating Performance", "Culminating Preparation", "Exam"],
    // within the final 20%: 5% + 5% + 10%
    colWeights: [5, 5, 10],
  },
];

// group keys per top-level section of the breakdown
export const DANCE_SECTIONS = [
  { label: "WRITTEN WORK (20%)", keys: ["comp", "quiz", "refl"], h: "h-blue" },
  { label: "PHYSICAL ASSESSMENTS (45%)", keys: ["perf", "skill", "barre", "act"], h: "h-green" },
  { label: "ATTENDANCE & PARTICIPATION (15%)", keys: ["ap"], h: "h-red" },
  { label: "FINAL (20%)", keys: ["fin"], h: "h-black" },
];

const TERM_KEYS = ["comp", "quiz", "refl", "perf", "skill", "barre", "act"];

export const danceId = (groupKey, i) => `dn.${groupKey}.${i}`;

export function danceGroupAvg(group, cells) {
  const c = cells || {};
  let sum = 0;
  let wsum = 0;
  group.cols.forEach((_, i) => {
    const v = effPct(c[danceId(group.key, i)]);
    if (v === null || v === undefined) return;
    const w = group.colWeights ? group.colWeights[i] : 1;
    sum += v * w;
    wsum += w;
  });
  return wsum ? sum / wsum : null;
}

// weight-combine group averages, re-normalising over the groups
// that actually have marks (a running mark, not blanks-as-zero)
function combine(avgs, keys) {
  let sum = 0;
  let wsum = 0;
  for (const g of DANCE_GROUPS) {
    if (!keys.includes(g.key)) continue;
    const v = avgs[g.key];
    if (v === null || v === undefined) continue;
    sum += v * g.weight;
    wsum += g.weight;
  }
  return wsum ? sum / wsum : null;
}

export function calcDance(cells) {
  const groupAvg = {};
  for (const g of DANCE_GROUPS) groupAvg[g.key] = danceGroupAvg(g, cells);
  const term = combine(groupAvg, TERM_KEYS);
  const written = combine(groupAvg, ["comp", "quiz", "refl"]);
  const physical = combine(groupAvg, ["perf", "skill", "barre", "act"]);
  const current = combine(groupAvg, DANCE_GROUPS.map((g) => g.key));
  return {
    groupAvg,
    written,     // Written Work rollup (of its 20%)
    physical,    // Physical Assessments rollup (of its 45%)
    term,        // Term Work rollup (of its 65%)
    ap: groupAvg.ap,
    fin: groupAvg.fin,
    current,     // running final mark across everything entered
  };
}
