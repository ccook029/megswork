"use client";

import { useEffect, useRef, useState } from "react";
import {
  loadState,
  saveState,
  makeStudent,
  letterFor,
  studentAverage,
  assignmentAverage,
  parseRosterRows,
  parseRosterText,
  sortRoster,
} from "../../lib/data";

export default function Gradebook() {
  const [state, setState] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (state) saveState(state);
  }, [state]);

  if (!state) {
    return <p className="page-sub">Loading your gradebook…</p>;
  }

  const cls =
    state.classes.find((c) => c.id === state.activeClassId) || state.classes[0];

  const updateClass = (updater) => {
    setState((s) => ({
      ...s,
      classes: s.classes.map((c) => (c.id === cls.id ? updater(c) : c)),
    }));
  };

  const setScore = (studentId, assignmentId, raw) => {
    updateClass((c) => ({
      ...c,
      scores: {
        ...c.scores,
        [studentId]: { ...(c.scores[studentId] || {}), [assignmentId]: raw },
      },
    }));
  };

  const addClass = () => {
    const name = prompt("Name for the new class (e.g. Period 2 — Religion):");
    if (!name) return;
    const id = Math.random().toString(36).slice(2, 10);
    setState((s) => ({
      ...s,
      classes: [
        ...s.classes,
        { id, name, students: [], assignments: [], scores: {} },
      ],
      activeClassId: id,
    }));
  };

  const renameClass = () => {
    const name = prompt("Rename this class:", cls.name);
    if (name) updateClass((c) => ({ ...c, name }));
  };

  const deleteClass = () => {
    if (state.classes.length === 1) {
      alert("You need at least one class.");
      return;
    }
    if (!confirm(`Delete "${cls.name}" and all its grades? This can't be undone.`))
      return;
    setState((s) => {
      const classes = s.classes.filter((c) => c.id !== cls.id);
      return { ...s, classes, activeClassId: classes[0].id };
    });
  };

  const addStudent = () => {
    const name = prompt('Student name (e.g. "Smith, Jordan"):');
    if (!name) return;
    updateClass((c) => ({
      ...c,
      students: sortRoster([...c.students, makeStudent(name)]),
    }));
  };

  const removeStudent = (st) => {
    if (!confirm(`Remove ${st.name} and their grades from this class?`)) return;
    updateClass((c) => {
      const scores = { ...c.scores };
      delete scores[st.id];
      return {
        ...c,
        students: c.students.filter((x) => x.id !== st.id),
        scores,
      };
    });
  };

  const removeAssignment = (a) => {
    if (!confirm(`Delete "${a.name}" and all its scores?`)) return;
    updateClass((c) => {
      const scores = {};
      for (const [sid, byAssign] of Object.entries(c.scores)) {
        const copy = { ...byAssign };
        delete copy[a.id];
        scores[sid] = copy;
      }
      return {
        ...c,
        assignments: c.assignments.filter((x) => x.id !== a.id),
        scores,
      };
    });
  };

  const exportCsv = () => {
    const header = [
      "Student ID",
      "Name",
      "Grade",
      ...cls.assignments.map((a) => `${a.name} (/${a.points})`),
      "Average %",
      "Letter",
    ];
    const lines = [header];
    for (const st of cls.students) {
      const avg = studentAverage(cls, st.id);
      lines.push([
        st.sid,
        st.name,
        st.grade,
        ...cls.assignments.map((a) => cls.scores?.[st.id]?.[a.id] ?? ""),
        avg === null ? "" : avg.toFixed(1),
        avg === null ? "" : letterFor(avg),
      ]);
    }
    const csv = lines
      .map((row) =>
        row.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${cls.name.replace(/[^\w\- ]+/g, "")} gradebook.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const classAvg = (() => {
    const vals = cls.students
      .map((st) => studentAverage(cls, st.id))
      .filter((v) => v !== null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  })();

  return (
    <>
      <h1 className="page-title">Gradebook</h1>
      <p className="page-sub">
        Marks save automatically on this device. Blank cells don&apos;t count
        against a student&apos;s average.
      </p>

      <div className="toolbar">
        <select
          value={cls.id}
          onChange={(e) =>
            setState((s) => ({ ...s, activeClassId: e.target.value }))
          }
        >
          {state.classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn small" onClick={addClass}>＋ Class</button>
        <button className="btn small" onClick={renameClass}>Rename</button>
        <button className="btn small danger" onClick={deleteClass}>Delete</button>
        <span className="spacer" />
        <button className="btn" onClick={() => setShowUpload(true)}>
          📄 Upload student list
        </button>
        <button className="btn" onClick={addStudent}>＋ Student</button>
        <button className="btn primary" onClick={() => setShowAssign(true)}>
          ＋ Assignment
        </button>
        <button className="btn" onClick={exportCsv}>⬇ Export CSV</button>
      </div>

      <div className="stats">
        <div className="stat">
          <div className="label">Students</div>
          <div className="value">{cls.students.length}</div>
        </div>
        <div className="stat">
          <div className="label">Assignments</div>
          <div className="value">{cls.assignments.length}</div>
        </div>
        <div className="stat">
          <div className="label">Class average</div>
          <div className="value">
            {classAvg === null ? "—" : `${classAvg.toFixed(1)}%`}
          </div>
        </div>
      </div>

      <div className="gb-wrap">
        <table className="gb">
          <thead>
            <tr>
              <th className="name-col">Student</th>
              {cls.assignments.map((a) => (
                <th key={a.id}>
                  <span className="assign-head">
                    <span>{a.name}</span>
                    <span className="pts">out of {a.points}</span>
                    <button
                      title="Delete assignment"
                      onClick={() => removeAssignment(a)}
                    >
                      remove
                    </button>
                  </span>
                </th>
              ))}
              <th className="avg">Average</th>
              <th>Letter</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {cls.students.length === 0 && (
              <tr>
                <td className="name-col" colSpan={cls.assignments.length + 4}>
                  No students yet — upload a student list or add one by hand.
                </td>
              </tr>
            )}
            {cls.students.map((st) => {
              const avg = studentAverage(cls, st.id);
              return (
                <tr key={st.id}>
                  <td className="name-col" title={st.sid ? `ID ${st.sid}` : ""}>
                    {st.name}
                    {st.grade ? (
                      <span style={{ color: "var(--ink-soft)", fontWeight: 400 }}>
                        {" "}
                        · Gr {st.grade}
                      </span>
                    ) : null}
                  </td>
                  {cls.assignments.map((a) => (
                    <td key={a.id} style={{ textAlign: "center" }}>
                      <input
                        className="score"
                        inputMode="decimal"
                        value={cls.scores?.[st.id]?.[a.id] ?? ""}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "" || /^\d*\.?\d*$/.test(v))
                            setScore(st.id, a.id, v);
                        }}
                        placeholder="–"
                      />
                    </td>
                  ))}
                  <td className="avg" style={{ textAlign: "center" }}>
                    {avg === null ? "—" : `${avg.toFixed(1)}%`}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {avg === null ? (
                      "—"
                    ) : (
                      <span className={`grade-pill grade-${letterFor(avg).toLowerCase()}`}>
                        {letterFor(avg)}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn small danger"
                      onClick={() => removeStudent(st)}
                      title="Remove student"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {cls.students.length > 0 && cls.assignments.length > 0 && (
            <tfoot>
              <tr>
                <td className="name-col">Class average</td>
                {cls.assignments.map((a) => {
                  const avg = assignmentAverage(cls, a.id);
                  return (
                    <td key={a.id}>
                      {avg === null ? "—" : `${avg.toFixed(1)}%`}
                    </td>
                  );
                })}
                <td>{classAvg === null ? "—" : `${classAvg.toFixed(1)}%`}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {showAssign && (
        <AssignmentModal
          onClose={() => setShowAssign(false)}
          onAdd={(name, points) => {
            updateClass((c) => ({
              ...c,
              assignments: [
                ...c.assignments,
                {
                  id: Math.random().toString(36).slice(2, 10),
                  name,
                  points,
                },
              ],
            }));
            setShowAssign(false);
          }}
        />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onApply={(students, mode) => {
            updateClass((c) => {
              if (mode === "replace") {
                return { ...c, students: sortRoster(students), scores: {} };
              }
              const existing = new Set(
                c.students.map((s) => s.name.toLowerCase())
              );
              const added = students.filter(
                (s) => !existing.has(s.name.toLowerCase())
              );
              return { ...c, students: sortRoster([...c.students, ...added]) };
            });
            setShowUpload(false);
          }}
        />
      )}
    </>
  );
}

function AssignmentModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [points, setPoints] = useState("100");
  const valid = name.trim() && Number(points) > 0;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>New assignment</h2>
        <div className="field">
          <label>Name</label>
          <input
            type="text"
            autoFocus
            value={name}
            placeholder="e.g. Unit 1 Test"
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="field">
          <label>Out of (total points)</label>
          <input
            type="number"
            min="1"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={!valid}
            onClick={() => valid && onAdd(name.trim(), Number(points))}
          >
            Add assignment
          </button>
        </div>
      </div>
    </div>
  );
}

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
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false });
        parsed = parseRosterRows(rows);
      } else {
        // .txt or anything else — treat as pasted text
        parsed = parseRosterText(await file.text());
      }
      if (!parsed.length) {
        setError(
          "Couldn't find any student names in that file. Try a CSV/Excel file with a Name column, or paste the names below."
        );
      }
      setStudents(parsed);
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
          onDragOver={(e) => {
            e.preventDefault();
            setOver(true);
          }}
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
            Excel (.xlsx), CSV, or text — like the &quot;Student List&quot;
            export from the school system
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
            style={{
              border: "1px solid var(--pink-300)",
              borderRadius: 8,
              padding: 8,
              fontSize: 13,
              fontFamily: "inherit",
            }}
            placeholder={"Smith, Jordan\nLee, Casey"}
            onChange={(e) => {
              setError("");
              setStudents(parseRosterText(e.target.value));
            }}
          />
        </div>

        {error && <p style={{ color: "var(--red)", fontSize: 13 }}>{error}</p>}

        {students.length > 0 && (
          <>
            <p className="hint">
              Found <strong>{students.length}</strong> student
              {students.length === 1 ? "" : "s"}:
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
                <option value="replace">
                  Replace the roster (clears existing grades)
                </option>
                <option value="add">Add new students, keep everything else</option>
              </select>
            </div>
          </>
        )}

        <div className="modal-actions">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button
            className="btn primary"
            disabled={!students.length}
            onClick={() => onApply(students, mode)}
          >
            Apply to class
          </button>
        </div>
      </div>
    </div>
  );
}
