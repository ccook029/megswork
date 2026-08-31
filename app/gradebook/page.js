"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadState, saveState, makeStudent, parseRosterRows, parseRosterText,
  sortRoster, MAX_STUDENTS,
} from "../../lib/data";
import {
  GT_GROUPS, GT_PP_IDS, FJ_WEEKS, FC_COLS,
  isValidLevel, levelToPct, effPct, parsePct, calcStudent, fmtPct, pctToLevel,
} from "../../lib/coop";

const TABS = [
  { key: "gt", label: "Grade Tracker" },
  { key: "fj", label: "Final Journals" },
  { key: "fc", label: "Final Co-op Marking Sheet" },
];

export default function Gradebook() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("gt");
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => { setState(loadState()); }, []);
  useEffect(() => { if (state) saveState(state); }, [state]);

  if (!state) return <p className="page-sub">Loading your gradebook…</p>;

  const cls = state.classes.find((c) => c.id === state.activeClassId) || state.classes[0];

  const updateClass = (updater) =>
    setState((s) => ({
      ...s,
      classes: s.classes.map((c) => (c.id === cls.id ? updater(c) : c)),
    }));

  // Entering a level clears the direct %, and vice versa — only one
  // of the two ever holds data for an assignment (mirrors the workbook).
  const setCell = (studentId, colId, field, value) =>
    updateClass((c) => {
      const forStudent = { ...(c.cells?.[studentId] || {}) };
      const prev = forStudent[colId] || {};
      const next = { ...prev, [field]: value };
      if (value !== "" && field === "lv") next.pc = "";
      if (value !== "" && field === "pc") next.lv = "";
      forStudent[colId] = next;
      return { ...c, cells: { ...c.cells, [studentId]: forStudent } };
    });

  const addClass = () => {
    const name = prompt("Name for the new class (e.g. Coop AM 2026-27):");
    if (!name) return;
    const id = Math.random().toString(36).slice(2, 10);
    setState((s) => ({
      ...s,
      classes: [...s.classes, { id, name, students: [], cells: {} }],
      activeClassId: id,
    }));
  };

  const renameClass = () => {
    const name = prompt("Rename this class:", cls.name);
    if (name) updateClass((c) => ({ ...c, name }));
  };

  const deleteClass = () => {
    if (state.classes.length === 1) return alert("You need at least one class.");
    if (!confirm(`Delete "${cls.name}" and all its grades? This can't be undone.`)) return;
    setState((s) => {
      const classes = s.classes.filter((c) => c.id !== cls.id);
      return { ...s, classes, activeClassId: classes[0].id };
    });
  };

  const addStudent = () => {
    if (cls.students.length >= MAX_STUDENTS)
      return alert(`This class is at the ${MAX_STUDENTS}-student limit.`);
    const name = prompt('Student name (e.g. "Smith, Jordan"):');
    if (!name) return;
    updateClass((c) => ({ ...c, students: sortRoster([...c.students, makeStudent(name)]) }));
  };

  const removeStudent = (st) => {
    if (!confirm(`Remove ${st.name} and all their grades?`)) return;
    updateClass((c) => {
      const cells = { ...c.cells };
      delete cells[st.id];
      return { ...c, students: c.students.filter((x) => x.id !== st.id), cells };
    });
  };

  const applyRoster = (students, mode) => {
    updateClass((c) => {
      if (mode === "replace") {
        return { ...c, students: sortRoster(students).slice(0, MAX_STUDENTS), cells: {} };
      }
      const existing = new Set(c.students.map((s) => s.name.toLowerCase()));
      const added = students.filter((s) => !existing.has(s.name.toLowerCase()));
      return {
        ...c,
        students: sortRoster([...c.students, ...added]).slice(0, MAX_STUDENTS),
      };
    });
    setShowUpload(false);
  };

  const exportCsv = () => {
    const rows = buildCsv(cls, tab);
    const csv = rows
      .map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cls.name} - ${TABS.find((t) => t.key === tab).label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const results = Object.fromEntries(
    cls.students.map((st) => [st.id, calcStudent(cls.cells?.[st.id])])
  );

  return (
    <>
      <h1 className="page-title">Gradebook</h1>
      <p className="page-sub">
        Enter an Ontario level (4+, 3-, R …) in a green row <em>or</em> a percent
        (75 or 0.75) in an orange row — the yellow row converts levels
        automatically. Everything saves on this device.
      </p>

      <div className="toolbar">
        <select
          value={cls.id}
          onChange={(e) => setState((s) => ({ ...s, activeClassId: e.target.value }))}
        >
          {state.classes.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button className="btn small" onClick={addClass}>＋ Class</button>
        <button className="btn small" onClick={renameClass}>Rename</button>
        <button className="btn small danger" onClick={deleteClass}>Delete</button>
        <span className="spacer" />
        <button className="btn" onClick={() => setShowUpload(true)}>📄 Upload student list</button>
        <button className="btn" onClick={addStudent}>＋ Student</button>
        <button className="btn" onClick={exportCsv}>⬇ Export CSV</button>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`tab${tab === t.key ? " active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {cls.students.length === 0 ? (
        <div className="card">No students yet — upload a student list or add one by hand.</div>
      ) : tab === "gt" ? (
        <GradeTracker cls={cls} results={results} setCell={setCell} removeStudent={removeStudent} />
      ) : tab === "fj" ? (
        <FinalJournals cls={cls} results={results} setCell={setCell} />
      ) : (
        <FinalCoop cls={cls} results={results} setCell={setCell} />
      )}

      {showUpload && (
        <UploadModal onClose={() => setShowUpload(false)} onApply={applyRoster} />
      )}
    </>
  );
}

// ---------- Shared cell inputs ----------

function LevelInput({ cell, onChange }) {
  const v = cell?.lv ?? "";
  const bad = v !== "" && !isValidLevel(v);
  return (
    <input
      className={`entry${bad ? " bad" : ""}`}
      value={v}
      placeholder=""
      title={bad ? "Not a valid level — use 4+, 4, 4-, 3+ … 1-, R, or 0-4" : ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function PctInput({ cell, onChange }) {
  return (
    <input
      className="entry"
      value={cell?.pc ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "" || /^\d*\.?\d*%?$/.test(v)) onChange(v);
      }}
    />
  );
}

function AutoCell({ cell }) {
  const v = cell?.lv ? levelToPct(cell.lv) : null;
  return <span className="auto-val">{v === null ? "" : fmtPct(v, 1)}</span>;
}

// A merged (3-row) result cell showing % and level
function ResultCell({ pct, rows = 3, cls = "" }) {
  return (
    <td rowSpan={rows} className={`result ${cls}`}>
      {pct === null ? "—" : (
        <>
          <div className="result-pct">{fmtPct(pct)}</div>
          <div className="result-lv">{pctToLevel(pct)}</div>
        </>
      )}
    </td>
  );
}

// ---------- Module 1: Grade Tracker ----------

function GradeTracker({ cls, results, setCell, removeStudent }) {
  const groups = GT_GROUPS;
  // Which sections are collapsed to a single "section average" column
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(localStorage.getItem("megs-gt-collapsed")) || {};
    } catch {
      return {};
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("megs-gt-collapsed", JSON.stringify(collapsed));
    } catch {}
  }, [collapsed]);

  const isC = (k) => !!collapsed[k] && k !== "lp";
  const toggle = (k) =>
    setCollapsed((c) => ({ ...c, [k]: !c[k] }));
  const span = (g) => (isC(g.key) ? 1 : g.cols.length);
  const ppSpan = groups.slice(0, 3).reduce((a, g) => a + span(g), 0);
  const arrow = (k) => (isC(k) ? "▸" : "▾");

  return (
    <>
      <p className="hint" style={{ margin: "0 0 8px" }}>
        Tip: click a section header (▾ Unit 1, Quizzes, Weeks &amp; Hours …)
        to collapse it down to a single section-average column.
      </p>
      <div className="gb-wrap">
        <table className="coop">
          <thead>
            <tr className="hr1">
              <th className="name-col" rowSpan={3}>Student</th>
              <th className="rowtype-col" rowSpan={3}></th>
              <th className="h-blue" colSpan={ppSpan}>PRE-PLACEMENT (65%)</th>
              <th className="h-red" colSpan={span(groups[3])}>HOURS &amp; JOURNALS (30%)</th>
              <th className="h-purple" colSpan={1}>LEARNING PLAN (5%)</th>
              <th className="h-purple" colSpan={2} rowSpan={2}>Averages</th>
              <th className="h-black" rowSpan={3}>Final Grade</th>
              <th rowSpan={3} className="x-col"></th>
            </tr>
            <tr className="hr2">
              {groups.slice(0, 3).map((g) => (
                <th
                  key={g.key}
                  className={`h-${g.theme}-lt toggle`}
                  colSpan={span(g)}
                  onClick={() => toggle(g.key)}
                  title="Click to expand / collapse this section"
                >
                  {arrow(g.key)} {g.label}
                  {isC(g.key) ? ` (${g.cols.length})` : ""}
                </th>
              ))}
              <th
                className="h-red-lt toggle"
                colSpan={span(groups[3])}
                onClick={() => toggle("hj")}
                title="Click to expand / collapse this section"
              >
                {arrow("hj")} Weeks &amp; Hours{isC("hj") ? " (8)" : ""}
              </th>
              <th className="h-purple-lt" colSpan={1}></th>
            </tr>
            <tr className="hr3">
              {groups.map((g) =>
                isC(g.key) ? (
                  <th key={g.key} className={`sub h-${g.theme}-lt`}>Section Avg</th>
                ) : (
                  g.cols.map((label, i) => (
                    <th key={`${g.key}.${i}`} className={`sub h-${g.theme}-lt`}>{label}</th>
                  ))
                )
              )}
              <th className="sub h-purple-lt">Pre-Placement Avg</th>
              <th className="sub h-purple-lt">H&amp;J Avg</th>
            </tr>
          </thead>
          <tbody>
            {cls.students.map((st, idx) => {
              const r = results[st.id];
              const band = idx % 2 === 1 ? " band" : "";
              const cellFor = (id) => cls.cells?.[st.id]?.[id];
              // Cells for one group on one row; a collapsed group renders a
              // single merged section-average cell on the first row only.
              const groupCells = (g, rowType) => {
                const ids = g.cols.map((_, i) => `gt.${g.key}.${i}`);
                if (isC(g.key)) {
                  if (rowType !== "lv") return [];
                  const vals = ids.map((id) => effPct(cellFor(id))).filter((v) => v !== null);
                  const gAvg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
                  return [
                    <td key={g.key} rowSpan={3} className={`c-collapsed t-${g.theme}`}>
                      {gAvg === null ? "—" : fmtPct(gAvg)}
                    </td>,
                  ];
                }
                return ids.map((id) =>
                  rowType === "lv" ? (
                    <td key={id} className="c-lv">
                      <LevelInput cell={cellFor(id)} onChange={(v) => setCell(st.id, id, "lv", v)} />
                    </td>
                  ) : rowType === "auto" ? (
                    <td key={id} className="c-auto"><AutoCell cell={cellFor(id)} /></td>
                  ) : (
                    <td key={id} className="c-pc">
                      <PctInput cell={cellFor(id)} onChange={(v) => setCell(st.id, id, "pc", v)} />
                    </td>
                  )
                );
              };
              return (
                <FragmentRows
                  key={st.id}
                  name={st.name}
                  band={band}
                  onRemove={() => removeStudent(st)}
                  rows={[
                    {
                      type: "lv",
                      cells: groups.flatMap((g) => groupCells(g, "lv")),
                      trailing: (
                        <>
                          <ResultCell pct={r.pp} cls="r-purple" />
                          <ResultCell pct={r.hj} cls="r-purple" />
                          <ResultCell pct={r.gtFinal} cls="r-black" />
                        </>
                      ),
                    },
                    {
                      type: "auto",
                      cells: groups.flatMap((g) => groupCells(g, "auto")),
                    },
                    {
                      type: "pc",
                      cells: groups.flatMap((g) => groupCells(g, "pc")),
                    },
                  ]}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

// Renders one student's 2-3 rows with merged name + row-type labels
function FragmentRows({ name, band, rows, trailing, onRemove }) {
  const labels = { lv: "Level", auto: "% from level", pc: "% direct" };
  return (
    <>
      {rows.map((row, i) => (
        <tr key={row.type}>
          {i === 0 && (
            <td rowSpan={rows.length} className={`name-col${band}`}>{name}</td>
          )}
          <td className={`rowtype c-${row.type}`}>{labels[row.type]}</td>
          {row.cells}
          {i === 0 && row.trailing}
          {i === 0 && onRemove && (
            <td rowSpan={rows.length} className="x-col">
              <button className="btn small danger" title="Remove student" onClick={onRemove}>✕</button>
            </td>
          )}
        </tr>
      ))}
    </>
  );
}

// ---------- Module 2: Final Journals ----------

function FinalJournals({ cls, results, setCell }) {
  return (
    <div className="gb-wrap">
      <table className="coop">
        <thead>
          <tr className="hrA">
            <th className="name-col" rowSpan={2}>Student</th>
            <th className="rowtype-col" rowSpan={2}></th>
            <th className="h-blue" colSpan={FJ_WEEKS.length}>FINAL JOURNALS — WEEKS 7–15</th>
            <th className="h-purple" rowSpan={2}>Average Level</th>
            <th className="h-purple" rowSpan={2}>Average %</th>
          </tr>
          <tr className="hrB">
            {FJ_WEEKS.map((w) => (
              <th key={w} className="sub h-blue-lt">Week {w}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cls.students.map((st, idx) => {
            const r = results[st.id];
            const band = idx % 2 === 1 ? " band" : "";
            const cellFor = (w) => cls.cells?.[st.id]?.[`fj.${w}`];
            return (
              <FragmentRows
                key={st.id}
                name={st.name}
                band={band}
                rows={[
                  {
                    type: "lv",
                    cells: FJ_WEEKS.map((w) => (
                      <td key={w} className="c-lv">
                        <LevelInput
                          cell={cellFor(w)}
                          onChange={(v) => setCell(st.id, `fj.${w}`, "lv", v)}
                        />
                      </td>
                    )),
                    trailing: (
                      <>
                        <td rowSpan={2} className="result r-purple">
                          <div className="result-lv big">{r.fjAvg === null ? "—" : r.fjLevel}</div>
                        </td>
                        <ResultCell pct={r.fjAvg} rows={2} cls="r-purple" />
                      </>
                    ),
                  },
                  {
                    type: "auto",
                    cells: FJ_WEEKS.map((w) => (
                      <td key={w} className="c-auto"><AutoCell cell={cellFor(w)} /></td>
                    )),
                  },
                ]}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- Module 3: Final Co-op Marking Sheet ----------

function FinalCoop({ cls, results, setCell }) {
  return (
    <div className="gb-wrap">
      <table className="coop">
        <thead>
          <tr className="hrA">
            <th className="name-col" rowSpan={2}>Student</th>
            <th className="rowtype-col" rowSpan={2}></th>
            {FC_COLS.map((c) => (
              <th key={c.id} className={c.auto ? "h-grey" : "h-blue"}>
                {c.label}
                {c.auto ? <span className="auto-tag">auto</span> : null}
              </th>
            ))}
            <th className="h-black" rowSpan={2}>Final Level</th>
            <th className="h-black" rowSpan={2}>Final %</th>
          </tr>
          <tr className="hrB">
            {FC_COLS.map((c) => (
              <th key={c.id} className={`sub ${c.auto ? "h-grey" : "h-blue-lt"}`}>
                {Math.round(c.weight * 100)}%
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cls.students.map((st, idx) => {
            const r = results[st.id];
            const band = idx % 2 === 1 ? " band" : "";
            const cellFor = (id) => cls.cells?.[st.id]?.[id];
            return (
              <FragmentRows
                key={st.id}
                name={st.name}
                band={band}
                rows={[
                  {
                    type: "lv",
                    cells: FC_COLS.map((c) =>
                      c.auto ? (
                        <td key={c.id} rowSpan={3} className="c-grey">
                          {r.fcParts[c.id] === null ? "—" : fmtPct(r.fcParts[c.id])}
                        </td>
                      ) : (
                        <td key={c.id} className="c-lv">
                          <LevelInput cell={cellFor(c.id)} onChange={(v) => setCell(st.id, c.id, "lv", v)} />
                        </td>
                      )
                    ),
                    trailing: (
                      <>
                        <td rowSpan={3} className="result r-black">
                          <div className="result-lv big">{r.fcFinal === null ? "—" : r.fcLevel}</div>
                        </td>
                        <ResultCell pct={r.fcFinal} cls="r-black" />
                      </>
                    ),
                  },
                  {
                    type: "auto",
                    cells: FC_COLS.filter((c) => !c.auto).map((c) => (
                      <td key={c.id} className="c-auto"><AutoCell cell={cellFor(c.id)} /></td>
                    )),
                  },
                  {
                    type: "pc",
                    cells: FC_COLS.filter((c) => !c.auto).map((c) => (
                      <td key={c.id} className="c-pc">
                        <PctInput cell={cellFor(c.id)} onChange={(v) => setCell(st.id, c.id, "pc", v)} />
                      </td>
                    )),
                  },
                ]}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ---------- CSV export ----------

function buildCsv(cls, tab) {
  const rows = [];
  if (tab === "gt") {
    const colIds = GT_GROUPS.flatMap((g) => g.cols.map((_, i) => `gt.${g.key}.${i}`));
    const labels = GT_GROUPS.flatMap((g) => g.cols);
    rows.push(["Student", ...labels, "Pre-Placement Avg", "H&J Avg", "Final Grade %", "Final Level"]);
    for (const st of cls.students) {
      const r = calcStudent(cls.cells?.[st.id]);
      rows.push([
        st.name,
        ...colIds.map((id) => {
          const v = effPct(cls.cells?.[st.id]?.[id]);
          return v === null ? "" : v.toFixed(1);
        }),
        r.pp === null ? "" : r.pp.toFixed(1),
        r.hj === null ? "" : r.hj.toFixed(1),
        r.gtFinal === null ? "" : r.gtFinal.toFixed(1),
        r.gtFinal === null ? "" : pctToLevel(r.gtFinal),
      ]);
    }
  } else if (tab === "fj") {
    rows.push(["Student", ...FJ_WEEKS.map((w) => `Week ${w}`), "Average Level", "Average %"]);
    for (const st of cls.students) {
      const r = calcStudent(cls.cells?.[st.id]);
      rows.push([
        st.name,
        ...FJ_WEEKS.map((w) => cls.cells?.[st.id]?.[`fj.${w}`]?.lv ?? ""),
        r.fjAvg === null ? "" : r.fjLevel,
        r.fjAvg === null ? "" : r.fjAvg.toFixed(1),
      ]);
    }
  } else {
    rows.push(["Student", ...FC_COLS.map((c) => `${c.label} (${Math.round(c.weight * 100)}%)`), "Final Level", "Final %"]);
    for (const st of cls.students) {
      const r = calcStudent(cls.cells?.[st.id]);
      rows.push([
        st.name,
        ...FC_COLS.map((c) => (r.fcParts[c.id] === null ? "" : r.fcParts[c.id].toFixed(1))),
        r.fcFinal === null ? "" : r.fcLevel,
        r.fcFinal === null ? "" : r.fcFinal.toFixed(1),
      ]);
    }
  }
  return rows;
}

// ---------- Roster upload (unchanged behaviour) ----------

function UploadModal({ onClose, onApply }) {
  const [students, setStudents] = useState([]);
  const [mode, setMode] = useState("replace");
  const [error, setError] = useState("");
  const [over, setOver] = useState(false);
  const fileRef = useRef(null);

  const handleFile = async (file) => {
    setError("");
    try {
      const name = file.name.toLowerCase();
      let parsed = [];
      if (/\.(xlsx|xls|csv|tsv|ods)$/.test(name)) {
        const XLSX = await import("xlsx");
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf);
        const ws = wb.Sheets[wb.SheetNames[0]];
        parsed = parseRosterRows(XLSX.utils.sheet_to_json(ws, { header: 1, raw: false }));
      } else {
        parsed = parseRosterText(await file.text());
      }
      if (!parsed.length) {
        setError("Couldn't find any student names in that file. Try a CSV/Excel file with a Name column, or paste the names below.");
      }
      setStudents(parsed.slice(0, MAX_STUDENTS));
    } catch (e) {
      setError(`Sorry, that file couldn't be read (${e.message}).`);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Upload student list</h2>
        <div
          className={`drop${over ? " over" : ""}`}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
        >
          <strong>Drop a file here or click to choose</strong>
          <div className="hint">
            Excel (.xlsx), CSV, or text — like the &quot;Student List&quot; export from the school system
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,.tsv,.txt,.ods"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </div>

        <div className="field" style={{ marginTop: 14 }}>
          <label>…or paste names (one per line)</label>
          <textarea
            rows={4}
            style={{ border: "1px solid var(--pink-300)", borderRadius: 8, padding: 8, fontSize: 13, fontFamily: "inherit" }}
            placeholder={"Smith, Jordan\nLee, Casey"}
            onChange={(e) => {
              setError("");
              setStudents(parseRosterText(e.target.value).slice(0, MAX_STUDENTS));
            }}
          />
        </div>

        {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

        {students.length > 0 && (
          <>
            <p className="hint">
              Found <strong>{students.length}</strong> student{students.length === 1 ? "" : "s"}:
            </p>
            <div className="preview-list">
              {students.map((s) => (
                <div key={s.id}>
                  {s.name}
                  {s.grade ? ` · Gr ${s.grade}` : ""}
                  {s.sid ? ` · ID ${s.sid}` : ""}
                </div>
              ))}
            </div>
            <div className="field">
              <label>How should this update the class?</label>
              <select value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="replace">Replace the roster (clears existing grades)</option>
                <option value="add">Add new students, keep everything else</option>
              </select>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn primary" disabled={!students.length} onClick={() => onApply(students, mode)}>
            Apply to class
          </button>
        </div>
      </div>
    </div>
  );
}
