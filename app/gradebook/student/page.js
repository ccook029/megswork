"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadState } from "../../../lib/data";
import { syncLoad } from "../../../lib/sync";
import {
  GT_GROUPS, FJ_WEEKS, FC_COLS, effPct, calcStudent, fmtPct, pctToLevel,
} from "../../../lib/coop";
import { danceCourse, danceId, calcDance } from "../../../lib/dance";
import { generateStudentReportPdf, generateDanceReportPdf } from "../../../lib/studentReportPdf";

export default function StudentReport() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    (async () => {
      const { state: s } = await syncLoad();
      for (const c of s.classes) {
        const st = c.students.find((x) => x.id === id);
        if (st) {
          setData({ cls: c, st, cells: c.cells?.[st.id] || {} });
          return;
        }
      }
      setData({ missing: true });
    })();
  }, []);

  if (!data) return <p className="page-sub">Loading…</p>;
  if (data.missing)
    return (
      <div className="card">
        Student not found. <Link href="/gradebook">Back to the Gradebook</Link>.
      </div>
    );

  const { cls, st, cells } = data;
  const isDance = cls.type === "dance";
  const r = calcStudent(cells);

  const makePdf = async () => {
    const gen = isDance ? generateDanceReportPdf : generateStudentReportPdf;
    return gen(st, cells, cls.danceCourse);
  };

  const downloadPdf = async () => {
    setBusy(true);
    try {
      const { blob, filename } = await makePdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(`Sorry, the PDF didn't generate (${e.message}).`);
    } finally {
      setBusy(false);
    }
  };

  // print the one-page PDF, so it always comes out on a single sheet
  const printPdf = async () => {
    setBusy(true);
    try {
      const { blob } = await makePdf();
      window.open(URL.createObjectURL(blob), "_blank");
    } catch (e) {
      alert(`Sorry, the PDF didn't generate (${e.message}).`);
    } finally {
      setBusy(false);
    }
  };

  const val = (id) => {
    const c = cells?.[id];
    const e = effPct(c);
    const lv = c?.lv ? String(c.lv).toUpperCase() : e !== null ? pctToLevel(e) : "";
    return { lv, pc: e === null ? "" : fmtPct(e) };
  };

  return (
    <div className="report">
      <div className="toolbar no-print">
        <Link className="btn" href="/gradebook">◀ Back to Gradebook</Link>
        <span className="spacer" />
        <button className="btn" disabled={busy} onClick={printPdf}>🖨 Print</button>
        <button className="btn primary" disabled={busy} onClick={downloadPdf}>
          {busy ? "…" : "⬇ Download PDF"}
        </button>
      </div>

      <div className="report-head">
        <div className="report-eyebrow">
          {isDance ? `MRS. M. McGUIRE • DANCE (${danceCourse(cls).code})` : "MRS. M. McGUIRE • COOPERATIVE EDUCATION"}
        </div>
        <h1>{st.name}</h1>
        <div className="report-sub">
          John Paul II Catholic Secondary School • Grade Report
          {st.sid ? ` • Student #${st.sid}` : ""}
        </div>
      </div>

      {isDance ? (
        <DanceReportBody st={st} cells={cells} course={danceCourse(cls)} />
      ) : (
        <>
      <div className="stats report-stats">
        <div className="stat"><div className="label">Midterm Mark</div><div className="value">{r.gtFinal === null ? "—" : `${fmtPct(r.gtFinal)} · ${pctToLevel(r.gtFinal)}`}</div></div>
        <div className="stat"><div className="label">Journals Avg</div><div className="value">{r.fjAvg === null ? "—" : `${fmtPct(r.fjAvg)} · ${r.fjLevel}`}</div></div>
        <div className="stat"><div className="label">Final Mark</div><div className="value">{r.fcFinal === null ? "—" : `${fmtPct(r.fcFinal)} · ${r.fcLevel}`}</div></div>
      </div>

      <h2 className="report-h2">Mid Term Marking Sheet</h2>
      <table className="report-table">
        <thead>
          <tr><th>Section</th><th>Assignment</th><th>Level</th><th>%</th></tr>
        </thead>
        <tbody>
          {GT_GROUPS.flatMap((g) =>
            g.cols.map((label, i) => {
              const v = val(`gt.${g.key}.${i}`);
              return (
                <tr key={`${g.key}.${i}`}>
                  <td className="muted">{g.label}</td>
                  <td>{label}</td>
                  <td className="c">{v.lv}</td>
                  <td className="c">{v.pc}</td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          <tr><td colSpan={3}>Pre-Placement Average (65%)</td><td className="c">{r.pp === null ? "—" : fmtPct(r.pp)}</td></tr>
          <tr><td colSpan={3}>Hours &amp; Journals Average (30%)</td><td className="c">{r.hj === null ? "—" : fmtPct(r.hj)}</td></tr>
          <tr><td colSpan={3}>Learning Plan (5%)</td><td className="c">{r.lp === null ? "—" : fmtPct(r.lp)}</td></tr>
          <tr className="grand"><td colSpan={3}>Midterm Mark</td><td className="c">{r.gtFinal === null ? "—" : `${fmtPct(r.gtFinal)} (${pctToLevel(r.gtFinal)})`}</td></tr>
        </tfoot>
      </table>

      <h2 className="report-h2">Final Journals — Weeks 7–15</h2>
      <table className="report-table">
        <thead><tr><th>Week</th><th>Level</th><th>%</th></tr></thead>
        <tbody>
          {FJ_WEEKS.map((w) => {
            const v = val(`fj.${w}`);
            return (
              <tr key={w}><td>Week {w}</td><td className="c">{v.lv}</td><td className="c">{v.pc}</td></tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="grand"><td>Average</td><td className="c">{r.fjAvg === null ? "—" : r.fjLevel}</td><td className="c">{r.fjAvg === null ? "" : fmtPct(r.fjAvg)}</td></tr>
        </tfoot>
      </table>

      <h2 className="report-h2">Final Marking Sheet</h2>
      <table className="report-table">
        <thead><tr><th>Component</th><th>Weight</th><th>%</th></tr></thead>
        <tbody>
          {FC_COLS.map((c) => (
            <tr key={c.id}>
              <td>{c.label}{c.auto ? <span className="muted"> (auto)</span> : null}</td>
              <td className="c">{Math.round(c.weight * 100)}%</td>
              <td className="c">{r.fcParts[c.id] === null ? "—" : fmtPct(r.fcParts[c.id])}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="grand"><td>Final Mark</td><td /><td className="c">{r.fcFinal === null ? "—" : `${fmtPct(r.fcFinal)} (${r.fcLevel})`}</td></tr>
        </tfoot>
      </table>
        </>
      )}
    </div>
  );
}

function DanceReportBody({ st, cells, course }) {
  const r = calcDance(cells, course);
  const val = (id) => {
    const c = cells?.[id];
    const e = effPct(c);
    const lv = c?.lv ? String(c.lv).toUpperCase() : e !== null ? pctToLevel(e) : "";
    return { lv, pc: e === null ? "" : fmtPct(e) };
  };
  const row = (label, v) => (
    <tr key={label}><td colSpan={3}>{label}</td><td className="c">{v === null ? "—" : fmtPct(v)}</td></tr>
  );
  return (
    <>
      <div className="stats report-stats">
        <div className="stat"><div className="label">{course.termLabel}</div><div className="value">{r.term === null ? "—" : `${fmtPct(r.term)} · ${pctToLevel(r.term)}`}</div></div>
        <div className="stat"><div className="label">{course.apLabel}</div><div className="value">{r.ap === null ? "—" : `${fmtPct(r.ap)} · ${pctToLevel(r.ap)}`}</div></div>
        <div className="stat"><div className="label">Current Mark</div><div className="value">{r.current === null ? "—" : `${fmtPct(r.current)} · ${pctToLevel(r.current)}`}</div></div>
      </div>

      <h2 className="report-h2">Dance Marking Sheet</h2>
      <table className="report-table">
        <thead>
          <tr><th>Category</th><th>Assignment</th><th>Level</th><th>%</th></tr>
        </thead>
        <tbody>
          {course.groups.flatMap((g) =>
            g.cols.map((label, i) => {
              const v = val(danceId(g.key, i));
              return (
                <tr key={`${g.key}.${i}`}>
                  <td className="muted">{g.label} ({Math.round(g.weight * 100)}%)</td>
                  <td>{label}{g.colWeights ? ` (${g.colWeights[i]}%)` : ""}</td>
                  <td className="c">{v.lv}</td>
                  <td className="c">{v.pc}</td>
                </tr>
              );
            })
          )}
        </tbody>
        <tfoot>
          {r.summary.map((srow) => row(srow.label, srow.value))}
          <tr className="grand"><td colSpan={3}>Current Mark</td><td className="c">{r.current === null ? "—" : `${fmtPct(r.current)} (${pctToLevel(r.current)})`}</td></tr>
        </tfoot>
      </table>
    </>
  );
}
