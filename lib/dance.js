// Dance gradebooks. Each course code carries its own marks breakdown from
// Meagan's course outlines; all use the same entry system as the co-op
// gradebook (an Ontario level or a direct percent per assignment, blanks
// skipped — never counted as 0) and the running mark re-weights across the
// categories that have marks in them.

import { effPct } from "./coop";

export const danceId = (groupKey, i) => `dn.${groupKey}.${i}`;

const PERF_TESTS = ["Hip-Hop Test", "Jazz Test", "Lyrical/Contemporary Test"];
const AP_COLS = [
  "September/February Performance Preparation",
  "October/March Performance Preparation",
  "November/April Performance Preparation",
  "December/May Performance Preparation",
  "January/June Performance Preparation",
  "Warm-Ups",
];

export const DANCE_COURSES = {
  // ATC20 — Term Work 65 (Written 20: Comprehension 10 / Quizzes 5 /
  // Reflections 5; Physical 45: Tests 25 / Skills 10 / Barre 5 /
  // Activities 5), A&P 15, Final 20 (5/5/10)
  ATC20: {
    code: "ATC20",
    groups: [
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
      { key: "perf", label: "Performance Tests", weight: 0.25, theme: "green", cols: PERF_TESTS },
      {
        key: "skill", label: "Skills", weight: 0.10, theme: "green",
        cols: ["Pirouettes", "Chaines", "Kicks Turning", "Jetes/Russians", "Ballet Turns", "Piques", "Fan Kicks"],
      },
      { key: "barre", label: "Barre", weight: 0.05, theme: "green", cols: ["Ballet Positions", "Plies", "Tendus"] },
      { key: "act", label: "Activities", weight: 0.05, theme: "green", cols: ["B-Boy Activity", "Small Group Choreography"] },
      { key: "ap", label: "Attendance & Participation", weight: 0.15, theme: "red", cols: AP_COLS },
      {
        key: "fin", label: "Final", weight: 0.20, theme: "black",
        cols: ["Culminating Performance", "Culminating Preparation", "Exam"],
        colWeights: [5, 5, 10],
      },
    ],
    sections: [
      { label: "WRITTEN WORK (20%)", keys: ["comp", "quiz", "refl"], h: "h-blue" },
      { label: "PHYSICAL ASSESSMENTS (45%)", keys: ["perf", "skill", "barre", "act"], h: "h-green" },
      { label: "ATTENDANCE & PARTICIPATION (15%)", keys: ["ap"], h: "h-red" },
      { label: "FINAL (20%)", keys: ["fin"], h: "h-black" },
    ],
    termKeys: ["comp", "quiz", "refl", "perf", "skill", "barre", "act"],
    summary: [
      { label: "Written Work (20%)", keys: ["comp", "quiz", "refl"] },
      { label: "Physical Assessments (45%)", keys: ["perf", "skill", "barre", "act"] },
      { label: "Term Work (65%)", keys: ["comp", "quiz", "refl", "perf", "skill", "barre", "act"] },
      { label: "Attendance & Participation (15%)", keys: ["ap"] },
      { label: "Final (20%)", keys: ["fin"] },
    ],
    termLabel: "Term Work (65%)",
    apLabel: "Att. & Part. (15%)",
    finLabel: "Final (20%)",
  },

  // ATC3M — Term Work 65 (Written 20 flat; Physical 45: Tests 20 /
  // Skills 10 / Activities 15), A&P 10, Final 25 (10/5/10)
  ATC3M: {
    code: "ATC3M",
    groups: [
      {
        key: "writ", label: "Written Work", weight: 0.20, theme: "blue",
        cols: [
          "Do Schools Kill Creativity",
          "How the Bronx Brought Breaking to the World",
          "Dancing In Isolation",
          "Written Choreography",
          "Bugaku and Ballet",
          "The Nutcracker History",
          "Nutcracker Presentation",
          "Anatomical Terms",
          "Skeletal System Quiz",
          "Dance Goals Essay",
          "Hip-Hop Inspiration Reflection",
          "Contemporary Inspiration Reflection",
        ],
      },
      { key: "perf", label: "Performance Tests", weight: 0.20, theme: "green", cols: PERF_TESTS },
      {
        key: "skill", label: "Skills", weight: 0.10, theme: "green",
        cols: [
          "Pirouettes", "Chaines", "Kicks Turning", "Jetes/Russians", "Ballet Turns",
          "Piques", "Fan Kicks", "Plies", "Tendus", "Sautees/Eschappes", "Retire Releves",
        ],
      },
      {
        key: "act", label: "Activities", weight: 0.15, theme: "green",
        cols: [
          "B-Boy Activity", "Small Group Choreography", "Stretch Class Assignment",
          "Jazz Skills Assignment", "Contemporary Skills Assignment", "Body Break Video",
        ],
      },
      { key: "ap", label: "Attendance & Participation", weight: 0.10, theme: "red", cols: AP_COLS },
      {
        key: "fin", label: "Final", weight: 0.25, theme: "black",
        cols: ["Culminating Performance", "Culminating Preparation", "Exam"],
        colWeights: [10, 5, 10],
      },
    ],
    sections: [
      { label: "WRITTEN WORK (20%)", keys: ["writ"], h: "h-blue" },
      { label: "PHYSICAL ASSESSMENTS (45%)", keys: ["perf", "skill", "act"], h: "h-green" },
      { label: "ATTENDANCE & PARTICIPATION (10%)", keys: ["ap"], h: "h-red" },
      { label: "FINAL (25%)", keys: ["fin"], h: "h-black" },
    ],
    termKeys: ["writ", "perf", "skill", "act"],
    summary: [
      { label: "Written Work (20%)", keys: ["writ"] },
      { label: "Physical Assessments (45%)", keys: ["perf", "skill", "act"] },
      { label: "Term Work (65%)", keys: ["writ", "perf", "skill", "act"] },
      { label: "Attendance & Participation (10%)", keys: ["ap"] },
      { label: "Final (25%)", keys: ["fin"] },
    ],
    termLabel: "Term Work (65%)",
    apLabel: "Att. & Part. (10%)",
    finLabel: "Final (25%)",
  },

  // ATC4M — Term Work 65 (Written 20 flat; Physical 45: Tests 20 /
  // Skills 10 / Leadership 15), A&P 10, Final 25 (10/5/10)
  ATC4M: {
    code: "ATC4M",
    groups: [
      {
        key: "writ", label: "Written Work", weight: 0.20, theme: "blue",
        cols: [
          "Community and Dance Essay",
          "Hip-Hop Inspiration Reflection",
          "Jazz History 1960s",
          "Jazz History 1970s",
          "Jazz History 1980s",
          "Jazz History 1990s",
          "Train Like a Ballerina Assignment",
          "Contemporary Inspiration Reflection",
          "Careers in Dance Article",
          "Final Reflection",
        ],
      },
      { key: "perf", label: "Performance Tests", weight: 0.20, theme: "green", cols: PERF_TESTS },
      {
        key: "skill", label: "Skills", weight: 0.10, theme: "green",
        cols: [
          "Pirouettes", "Chaine Leap Attitude", "Kicks Turning", "Jetes Turning/Straddle Leaps",
          "Ballet Turns", "Piques", "Fan Kicks", "Classical Ballet Terms",
        ],
      },
      {
        key: "lead", label: "Leadership", weight: 0.15, theme: "green",
        cols: [
          "B-Boy Activity", "Small Group Choreography", "Running a Jazz Class",
          "Working on Expression Assignment", "Running a Contemporary Class",
        ],
      },
      { key: "ap", label: "Attendance & Participation", weight: 0.10, theme: "red", cols: AP_COLS },
      {
        key: "fin", label: "Final", weight: 0.25, theme: "black",
        cols: ["Culminating Performance", "Culminating Preparation", "Exam"],
        colWeights: [10, 5, 10],
      },
    ],
    sections: [
      { label: "WRITTEN WORK (20%)", keys: ["writ"], h: "h-blue" },
      { label: "PHYSICAL ASSESSMENTS (45%)", keys: ["perf", "skill", "lead"], h: "h-green" },
      { label: "ATTENDANCE & PARTICIPATION (10%)", keys: ["ap"], h: "h-red" },
      { label: "FINAL (25%)", keys: ["fin"], h: "h-black" },
    ],
    termKeys: ["writ", "perf", "skill", "lead"],
    summary: [
      { label: "Written Work (20%)", keys: ["writ"] },
      { label: "Physical Assessments (45%)", keys: ["perf", "skill", "lead"] },
      { label: "Term Work (65%)", keys: ["writ", "perf", "skill", "lead"] },
      { label: "Attendance & Participation (10%)", keys: ["ap"] },
      { label: "Final (25%)", keys: ["fin"] },
    ],
    termLabel: "Term Work (65%)",
    apLabel: "Att. & Part. (10%)",
    finLabel: "Final (25%)",
  },
};

// A dance class saved before course codes existed is the ATC20 class.
export function danceCourse(cls) {
  return DANCE_COURSES[cls?.danceCourse] || DANCE_COURSES.ATC20;
}

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
function combine(course, avgs, keys) {
  let sum = 0;
  let wsum = 0;
  for (const g of course.groups) {
    if (!keys.includes(g.key)) continue;
    const v = avgs[g.key];
    if (v === null || v === undefined) continue;
    sum += v * g.weight;
    wsum += g.weight;
  }
  return wsum ? sum / wsum : null;
}

export function calcDance(cells, course = DANCE_COURSES.ATC20) {
  const groupAvg = {};
  for (const g of course.groups) groupAvg[g.key] = danceGroupAvg(g, cells);
  const term = combine(course, groupAvg, course.termKeys);
  const current = combine(course, groupAvg, course.groups.map((g) => g.key));
  return {
    groupAvg,
    term,
    ap: groupAvg.ap,
    fin: groupAvg.fin,
    current,
    summary: course.summary.map((s) => ({ label: s.label, value: combine(course, groupAvg, s.keys) })),
  };
}
