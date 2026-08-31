"use client";

import { useEffect, useState } from "react";
import { loadState } from "../../lib/data";
import { DOC_LIST } from "../../lib/trackingSpecs";
import { generateTrackingDocx } from "../../lib/trackingDocs";
import { generateTrackingPdf } from "../../lib/trackingPdf";

export default function Documents() {
  const [state, setState] = useState(null);
  const [classId, setClassId] = useState(null);
  const [busy, setBusy] = useState("");

  useEffect(() => {
    const s = loadState();
    setState(s);
    setClassId(s.activeClassId);
  }, []);

  if (!state) return <p className="page-sub">Loading…</p>;

  const cls = state.classes.find((c) => c.id === classId) || state.classes[0];

  const download = async (kind, format) => {
    const id = `${kind}.${format}`;
    setBusy(id);
    try {
      const gen = format === "pdf" ? generateTrackingPdf : generateTrackingDocx;
      const { blob, filename } = await gen(kind, cls.students, cls.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Sorry, that didn't generate (${e.message}).`);
    } finally {
      setBusy("");
    }
  };

  const Buttons = ({ kind }) => (
    <span className="doc-buttons">
      <button className="btn small" disabled={!!busy} onClick={() => download(kind, "docx")}>
        {busy === `${kind}.docx` ? "…" : "⬇ Word"}
      </button>
      <button className="btn small" disabled={!!busy} onClick={() => download(kind, "pdf")}>
        {busy === `${kind}.pdf` ? "…" : "⬇ PDF"}
      </button>
    </span>
  );

  return (
    <>
      <h1 className="page-title">Documents</h1>
      <p className="page-sub">
        Every document is generated fresh from your class list, so they always
        show your current students — upload a new semester&apos;s list in the
        gradebook and these update automatically. Word downloads are fully
        editable; PDFs are print-ready.
      </p>

      <div className="toolbar">
        <label style={{ fontWeight: 600, color: "var(--rose-800)", fontSize: 14 }}>
          Class:&nbsp;
          <select value={cls.id} onChange={(e) => setClassId(e.target.value)}>
            {state.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.students.length} student{c.students.length === 1 ? "" : "s"})
              </option>
            ))}
          </select>
        </label>
      </div>

      <section style={{ marginBottom: 28 }}>
        <div className="doc-list">
          <div className="doc-row star">
            <span className="doc-icon">📚</span>
            <span className="doc-meta">
              <span className="doc-name">Complete Workbook — all eight documents in one</span>
              <span className="doc-desc">
                Cover page plus every template below, populated with {cls.students.length} student
                {cls.students.length === 1 ? "" : "s"}
              </span>
            </span>
            <Buttons kind="workbook" />
          </div>
        </div>
      </section>

      <h2 className="doc-group">Individual documents</h2>
      <div className="doc-list" style={{ marginTop: 10 }}>
        {DOC_LIST.map((d) => (
          <div key={d.key} className="doc-row">
            <span className="doc-icon">📄</span>
            <span className="doc-meta">
              <span className="doc-name">{d.name}</span>
              <span className="doc-desc">{d.desc}</span>
            </span>
            <Buttons kind={d.key} />
          </div>
        ))}
      </div>

      <p className="hint" style={{ marginTop: 18 }}>
        Tip: Word files convert straight into Google Docs — upload to Drive and
        open with Google Docs to keep an editable copy in the
        “Student Tracking Documents” folder.
      </p>
    </>
  );
}
