// Word (.docx) renderer for the Student Tracking Documents.
// Consumes the shared specs in trackingSpecs.js, so the Word and PDF
// outputs always match. Fully editable in Word / Google Docs.

import { buildSpecs, subtitleText, PAL, SCHOOL, TEACHER_LINE, FOOTER_LINE } from "./trackingSpecs";

const FONT = "Calibri";
const SERIF = "Playfair Display"; // elegant farmhouse serif (built into Google Docs)
const LETTER = { width: 12240, height: 15840 };
const M = 720;

export async function generateTrackingDocx(kind, students, className) {
  const D = await import("docx");
  const specs = buildSpecs(students);
  const r = renderer(D, className);

  let doc;
  let filename;
  if (kind === "workbook") {
    const sections = [r.coverSection(specs)];
    for (const s of specs) sections.push(r.templateSection(s));
    doc = new D.Document({
      styles: { default: { document: { run: { font: FONT, size: 20 } } } },
      sections,
    });
    filename = "Student Tracking Documents.docx";
  } else {
    const spec = specs.find((s) => s.key === kind);
    if (!spec) throw new Error(`Unknown document: ${kind}`);
    doc = new D.Document({
      styles: { default: { document: { run: { font: FONT, size: 20 } } } },
      sections: [r.templateSection(spec)],
    });
    filename = `${spec.file}.docx`;
  }
  const blob = await D.Packer.toBlob(doc);
  return { blob, filename };
}

function renderer(D, className) {
  const {
    Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType,
    AlignmentType, BorderStyle, PageOrientation, Footer, PageNumber,
    VerticalAlign, HeightRule, TableLayoutType, PageBreak,
  } = D;

  const bd = { style: BorderStyle.SINGLE, size: 4, color: PAL.border };
  const TABLE_BORDERS = {
    top: bd, bottom: bd, left: bd, right: bd, insideHorizontal: bd, insideVertical: bd,
  };

  const run = (text, o = {}) =>
    new TextRun({
      text,
      font: o.serif ? SERIF : FONT,
      size: o.size ?? 20,
      bold: o.bold ?? false,
      italics: o.italics ?? false,
      color: o.color ?? PAL.ink,
      allCaps: o.caps ?? false,
    });

  const cell = (text, o = {}) =>
    new TableCell({
      width: { size: o.width, type: WidthType.DXA },
      shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill } : undefined,
      verticalAlign: o.vAlign ?? VerticalAlign.CENTER,
      columnSpan: o.colSpan,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      children: [
        new Paragraph({
          alignment: o.align ?? AlignmentType.LEFT,
          keepNext: o.keepNext ?? false,
          children: text === "" ? [] : [run(text, o)],
        }),
      ],
    });

  // Uniform header row: every cell top-aligned so first lines sit level
  const headRow = (head, widths) =>
    new TableRow({
      tableHeader: true,
      height: { value: 700, rule: HeightRule.ATLEAST },
      children: head.map((h, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: PAL.headFill },
          verticalAlign: VerticalAlign.TOP,
          margins: { top: 60, bottom: 40, left: 60, right: 60 },
          children: [
            new Paragraph({
              alignment: i === 0 ? AlignmentType.LEFT : AlignmentType.CENTER,
              children: h.text === "" ? [] : [run(h.text, { bold: true, color: PAL.main, size: 17 })],
            }),
            ...(h.sub
              ? [new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [run(h.sub, { color: PAL.main, size: 13 })],
                })]
              : []),
          ],
        })
      ),
    });

  const bodyRow = (row, widths, spec, tbl) => {
    if (row.band !== undefined) {
      return new TableRow({
        height: { value: 420, rule: HeightRule.ATLEAST },
        children: [
          cell(row.band, {
            width: widths.reduce((a, b) => a + b, 0),
            fill: PAL.band, bold: true, color: PAL.dark, size: 19,
            colSpan: widths.length,
          }),
        ],
      });
    }
    const zebra = row.zebra ? PAL.alt : undefined;
    return new TableRow({
      height: { value: tbl.rowH ?? 400, rule: HeightRule.ATLEAST },
      cantSplit: !!tbl.keepTogether,
      children: row.cells.map((v, i) =>
        cell(v, {
          width: widths[i],
          fill: zebra,
          size: i === 0 ? 18 : 19,
          bold: i === 0 && row.firstBold,
          color: i === 0 && row.firstBold ? PAL.main : undefined,
          keepNext: !!tbl.keepTogether && !row.lastOfBlock,
          align: i === 0 && !tbl.centerFirst ? AlignmentType.LEFT : AlignmentType.CENTER,
        })
      ),
    });
  };

  const renderTable = (tbl, spec) => {
    // zebra-stripe only rows that carry a student name
    let dataIdx = 0;
    const rows = tbl.rows.map((row, ri) => {
      if (tbl.keepTogether && ri === tbl.rows.length - 1) row = { ...row, lastOfBlock: true };
      if (row.band === undefined && row.cells[0] && !row.firstBold) {
        row = { ...row, zebra: dataIdx % 2 === 1 };
        dataIdx++;
      }
      return bodyRow(row, tbl.widths, spec, tbl);
    });
    return new Table({
      columnWidths: tbl.widths,
      width: { size: tbl.widths.reduce((a, b) => a + b, 0), type: WidthType.DXA },
      layout: TableLayoutType.FIXED,
      borders: TABLE_BORDERS,
      rows: [headRow(tbl.head, tbl.widths), ...rows],
    });
  };

  const items = (spec) =>
    spec.items.map((it) => {
      if (it.t === "note")
        return new Paragraph({
          spacing: { before: 60, after: 160 },
          children: [run(it.text, { size: 17, italics: true, color: PAL.soft })],
        });
      if (it.t === "h2")
        return new Paragraph({
          spacing: { before: 240, after: 100 },
          children: [run(it.text, { serif: true, size: 26, bold: true, color: PAL.main })],
        });
      if (it.t === "pagebreak") return new Paragraph({ children: [new PageBreak()] });
      if (it.t === "visithead")
        return new Paragraph({
          spacing: { before: 260, after: 60 },
          keepNext: true,
          children: [
            run(it.name, { serif: true, size: 24, bold: true, color: PAL.dark }),
            run("     Placement: ______________________________________", { size: 19, color: PAL.soft }),
          ],
        });
      return renderTable(it, spec);
    });

  const masthead = (title) => [
    new Paragraph({
      spacing: { after: 40 },
      children: [run(TEACHER_LINE, { size: 16, bold: true, color: PAL.eyebrow, caps: true })],
    }),
    new Paragraph({
      spacing: { after: 60 },
      children: [run(title, { serif: true, size: 44, bold: true, color: PAL.dark })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: PAL.band, space: 4 } },
      children: [run(subtitleText(className), { size: 19, color: PAL.soft })],
    }),
  ];

  const footer = () =>
    new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: PAL.band, space: 4 } },
          children: [
            run(`${FOOTER_LINE}  •  Page `, { size: 15, color: PAL.footer }),
            new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 15, color: PAL.footer }),
            run(" of ", { size: 15, color: PAL.footer }),
            new TextRun({ children: [PageNumber.TOTAL_PAGES], font: FONT, size: 15, color: PAL.footer }),
          ],
        }),
      ],
    });

  const sectionProps = (landscape) => ({
    page: {
      size: landscape ? { ...LETTER, orientation: PageOrientation.LANDSCAPE } : LETTER,
      margin: { top: M, bottom: M + 200, left: M, right: M },
    },
  });

  const templateSection = (spec) => ({
    properties: sectionProps(spec.landscape),
    footers: { default: footer() },
    children: [...masthead(spec.title), ...items(spec)],
  });

  const coverSection = (specs) => ({
    properties: sectionProps(false),
    footers: { default: footer() },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 3000 } }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [run(TEACHER_LINE, { size: 20, bold: true, color: PAL.eyebrow })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 160 },
        children: [run("Student Tracking Documents", { serif: true, size: 58, bold: true, color: PAL.dark })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 500 },
        children: [run(subtitleText(className), { size: 24, color: PAL.soft })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 8, color: PAL.band, space: 10 },
          bottom: { style: BorderStyle.SINGLE, size: 8, color: PAL.band, space: 10 },
        },
        spacing: { after: 0 },
        children: [run(specs.map((t) => t.title).join("   •   "), { size: 19, color: PAL.main })],
      }),
      // Blank back page so the cover prints double-sided cleanly
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({ children: [] }),
    ],
  });

  return { templateSection, coverSection };
}
