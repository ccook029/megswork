// Shared template definitions for the Student Tracking Documents.
// One spec drives both the Word (.docx) and PDF renderers, and every
// sheet is populated from the roster passed in — so uploading a new
// semester's student list automatically fills all of these.
// No dates anywhere; the class name is the only label.

export const SCHOOL = "John Paul II Catholic Secondary School";
export const TEACHER_LINE = "MRS. M. McGUIRE  •  COOPERATIVE EDUCATION";
export const FOOTER_LINE = "Student Tracking Documents  •  Mrs. McGuire";

// Farmhouse palette (documents only — the site stays pale pink):
// black ink with a warm neutral accent. Swap the four accent values
// below to re-theme every document at once.
// Accent matched to Meagan's paint swatch (muted sage-greige)
export const PAL = {
  dark: "1A1A1A",    // titles — black
  main: "262626",    // header text — near black
  headFill: "DDDBCB",// accent: light sage-greige header fill
  band: "B3B09B",    // accent: the swatch itself — section bands
  alt: "F3F2EA",     // accent: palest tint — alternating rows
  border: "8C8975",  // accent: deep shade — borders
  eyebrow: "75725E", // teacher line
  soft: "56544A",    // notes & subtitles
  footer: "6E6C5D",
  ink: "1A1A1A",
};

const H = (text, sub) => (sub ? { text, sub } : { text });

const blanks = (n) => Array(n).fill("");

export function buildSpecs(students) {
  const roster = students || [];
  const names = roster.map((s) => s.name);
  const dataRows = (nCols, extras) =>
    names.map((name, i) => ({
      cells: [name, ...blanks(nCols)].map((v, ci) =>
        extras && extras[i] && extras[i][ci] !== undefined ? extras[i][ci] : v
      ),
    }));
  const blankDataRows = (nCols, count) =>
    Array.from({ length: count }, () => ({ cells: blanks(nCols + 1) }));

  const specs = [
    {
      key: "hr",
      file: "Hour Republic Forms Tracker",
      title: "Hour Republic Forms Tracker",
      desc: "WEA, SDS, PTP, Transportation, Photo Release, CA, OYAP, contract & PPE checkboxes",
      landscape: true,
      items: [
        { t: "note", text: "Check off each form as it is completed in Hour Republic. Extra rows are provided under Full Day and OYAP Level 1 for students in those groups." },
        {
          t: "table",
          widths: [2900, ...Array(10).fill(1150)],
          rowH: 360,
          head: [
            H("Student"),
            H("WEA", "Worker Education Agreement"), H("SDS", "Student Data Sheet"),
            H("PTP", "Permission to Participate"), H("TRANS", "Transportation"),
            H("PR", "Photo Release"), H("CA", "Confidentiality Agreement"),
            H("OYAP", "Section 1"), H("OYAP", "Section 2"),
            H("School Contract"), H("PPE Form"),
          ],
          rows: [
            ...dataRows(10),
            { band: "Full Day" },
            ...blankDataRows(10, 5),
            { band: "OYAP Level 1" },
            ...blankDataRows(10, 5),
          ],
        },
      ],
    },
    {
      key: "pre",
      file: "Pre-Placement Assignments",
      title: "Pre-Placement Assignments",
      desc: "Unit 1, Unit 2 and Quizzes marking sheets",
      landscape: true,
      items: [
        { t: "note", text: "Record the mark for each assignment as it is submitted." },
        { t: "h2", text: "Unit One Assignments" },
        {
          t: "table",
          widths: [2900, 2300, 2300, 2300, 2300, 2300],
          head: ["Student", "A.2 Resume", "A.3 Cover Letter", "A.4 Interview Questions", "U.1 Email Etiquette", "U.1 Phone Etiquette"].map((x) => H(x)),
          rows: dataRows(5),
        },
        { t: "pagebreak" },
        { t: "h2", text: "Unit Two Assignments" },
        {
          t: "table",
          widths: [2900, 1917, 1917, 1917, 1917, 1916, 1916],
          head: ["Student", "A.1 Human Rights", "A.2 ESA C. Study", "A.3 HS Sheet", "A.4 Confidentiality", "A.5 Journals 1–5", "Pre-Placement Journal"].map((x) => H(x)),
          rows: dataRows(6),
        },
        { t: "pagebreak" },
        { t: "h2", text: "Quizzes" },
        {
          t: "table",
          widths: [2900, 1650, 1300, 1500, 1400, 1400, 1300, 1475, 1475],
          head: ["Student", "U.2.A.1 Discrimination", "U.2.A.1 ESA", "U.2.A.2 Ont. Labour Relations", "U.2.A.3 WHMIS Poster", "U.2.A.3 PPE 1", "U.6.A.2 Inquiry", "U.10 Customer Service", "U.10 Leadership"].map((x) => H(x)),
          rows: dataRows(8),
        },
      ],
    },
    {
      key: "plc",
      file: "Placement Assignments",
      title: "Placement Assignments",
      desc: "Final Co-op components marking sheet",
      landscape: true,
      items: [
        { t: "note", text: "Record placement-term marks as they are completed. Columns match the Final Marking Sheet in the Gradebook." },
        { t: "h2", text: "Placement Assignments" },
        {
          t: "table",
          widths: [2900, 1643, 1643, 1643, 1643, 1643, 1643, 1642],
          head: ["Student", "Total Hours", "Scavenger Hunt", "Fin. Literacy Quiz", "Placement Performance", "Poster", "Exit Resume", "Presentation"].map((x) => H(x)),
          rows: dataRows(7),
        },
      ],
    },
    {
      key: "jrn",
      file: "Journals Tracker",
      title: "Journals Tracker",
      desc: "Weekly journals, weeks 1–15",
      landscape: true,
      items: [
        { t: "note", text: "Check off or enter a mark for each weekly journal as it is submitted (Weeks 1–6 count toward the midterm; Weeks 7–15 toward final journals)." },
        {
          t: "table",
          widths: [2900, ...Array(15).fill(766)],
          head: ["Student", ...Array.from({ length: 15 }, (_, i) => `W${i + 1}`)].map((x) => H(x)),
          rows: dataRows(15),
        },
      ],
    },
    {
      key: "ppe",
      file: "PPE - Working at Heights - OYAP Level 1",
      title: "PPE, Working at Heights & OYAP Level 1",
      desc: "Safety training and equipment tracking",
      landscape: false,
      items: [
        { t: "note", text: "Track safety training and equipment for each student before their placement begins." },
        {
          t: "table",
          widths: [2900, 1250, 1450, 3700, 1500],
          rowH: 480,
          head: ["Student", "OYAP Level 1 (Y/N)", "Working From Heights? (Y/N)", "PPE Required", "Date PPE Distributed"].map((x) => H(x)),
          rows: dataRows(4),
        },
      ],
    },
    {
      key: "vis",
      file: "Placement Visit Log (Car Copy)",
      title: "Placement Visit Log",
      desc: "Several students per page — five visits each with date, time and notes",
      landscape: false,
      items: [
        { t: "note", text: "Keep this copy in the car. Space for five visits per student." },
        // Several students per page; a student's card never splits across
        // pages — if it can't fit, it moves whole to the next page.
        ...names.flatMap((name) => [
          { t: "visithead", name, keepTogether: true },
          {
            t: "table",
            widths: [900, 1800, 1400, 6700],
            rowH: 500,
            centerFirst: true,
            keepTogether: true,
            head: ["Visit", "Date", "Time", "Notes"].map((x) => H(x)),
            rows: [1, 2, 3, 4, 5].map((v) => ({ cells: [String(v), "", "", ""], firstBold: true })),
          },
        ]),
      ],
    },
    {
      key: "att",
      file: "Attendance Sheet",
      title: "Attendance Sheet",
      desc: "Names with six blank date columns — two copies back to back",
      landscape: false,
      items: [
        { t: "note", text: "Write the date in each column heading. Two identical sheets, back to back." },
        {
          t: "table",
          widths: [2900, 1317, 1317, 1317, 1317, 1317, 1315],
          rowH: 400,
          head: ["Student", ...blanks(6)].map((x) => H(x)),
          rows: dataRows(6),
        },
        { t: "pagebreak" },
        {
          t: "table",
          widths: [2900, 1317, 1317, 1317, 1317, 1317, 1315],
          rowH: 400,
          head: ["Student", ...blanks(6)].map((x) => H(x)),
          rows: dataRows(6),
        },
      ],
    },
    {
      key: "cod",
      file: "Placements and Course Codes",
      title: "Placements & Course Codes",
      desc: "Master list: placement, SHSM/OYAP pathway, course code",
      landscape: true,
      items: [
        { t: "note", text: "Master list of each student's placement, SHSM/OYAP pathway, and related course code." },
        {
          t: "table",
          widths: [2900, 1100, 1500, 7500, 1400],
          rowH: 460,
          head: ["Student", "Student #", "SHSM / OYAP", "Placement & Supervisor", "Course Code"].map((x) => H(x)),
          rows: dataRows(4, roster.map((s) => ({ 1: s.sid || "", 2: s.shsm || "" }))),
        },
      ],
    },
  ];

  return specs;
}

export function subtitleText() {
  return SCHOOL;
}

export const DOC_LIST = buildSpecs([]).map((s) => ({ key: s.key, name: s.title, desc: s.desc }));
