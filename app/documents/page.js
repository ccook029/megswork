import Link from "next/link";

export const metadata = { title: "Documents — Megan's Teaching Dashboard" };

// Files live in /public/documents — add a file there (and a row here)
// and it ships with the site, so it's always available from any device.
const GROUPS = [
  {
    label: "Student Tracking Documents",
    note: "2026–27 templates, pre-filled with this year's class.",
    files: [
      { name: "Student Tracking Documents — Complete Workbook", file: "Student Tracking Documents - Complete Workbook.docx", desc: "All eight templates in one document", star: true },
      { name: "Complete Workbook (PDF, print-ready)", file: "Student Tracking Documents - Complete Workbook.pdf", desc: "Same workbook as a PDF for quick printing", star: true },
      { name: "Hour Republic Forms Tracker", file: "Hour Republic Forms Tracker.docx", desc: "WEA, SDS, PTP, Transportation, Photo Release, CA, OYAP, contract & PPE checkboxes" },
      { name: "Pre-Placement Assignments", file: "Pre-Placement Assignments.docx", desc: "Unit 1, Unit 2 and Quizzes marking sheets" },
      { name: "Placement Assignments", file: "Placement Assignments.docx", desc: "Final Co-op components marking sheet" },
      { name: "Journals Tracker", file: "Journals Tracker.docx", desc: "Weekly journals, weeks 1–15" },
      { name: "PPE, Working at Heights & OYAP Level 1", file: "PPE - Working at Heights - OYAP Level 1.docx", desc: "Safety training and equipment tracking" },
      { name: "Placement Visit Log (Car Copy)", file: "Placement Visit Log (Car Copy).docx", desc: "One card per student — five visits with date, time and notes" },
      { name: "Attendance Sheet", file: "Attendance Sheet.docx", desc: "Names with blank date columns" },
      { name: "Placements & Course Codes", file: "Placements and Course Codes.docx", desc: "Master list: placement, SHSM/OYAP pathway, course code" },
    ],
  },
];

function icon(file) {
  if (file.endsWith(".pdf")) return "📕";
  if (file.endsWith(".docx")) return "📘";
  if (file.endsWith(".xlsx") || file.endsWith(".csv")) return "📗";
  return "📄";
}

export default function Documents() {
  return (
    <>
      <h1 className="page-title">Documents</h1>
      <p className="page-sub">
        Everything lives right here with the dashboard — open or download any
        file from any device. Word files convert straight into Google Docs
        when added to Drive.
      </p>
      {GROUPS.map((g) => (
        <section key={g.label} style={{ marginBottom: 32 }}>
          <h2 className="doc-group">{g.label}</h2>
          <p className="hint" style={{ margin: "0 0 12px" }}>{g.note}</p>
          <div className="doc-list">
            {g.files.map((f) => (
              <a
                key={f.file}
                className={`doc-row${f.star ? " star" : ""}`}
                href={`/documents/${encodeURIComponent(f.file)}`}
                download
              >
                <span className="doc-icon">{icon(f.file)}</span>
                <span className="doc-meta">
                  <span className="doc-name">{f.name}</span>
                  <span className="doc-desc">{f.desc}</span>
                </span>
                <span className="doc-dl">⬇ Download</span>
              </a>
            ))}
          </div>
        </section>
      ))}
      <p className="hint">
        Need something added or updated? New files become part of the
        dashboard whenever we publish them here — just send them over in a
        Claude session. Head back <Link href="/">home</Link> for the other tools.
      </p>
    </>
  );
}
