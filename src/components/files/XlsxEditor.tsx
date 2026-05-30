import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { classNames } from "../../lib/utils";

interface XlsxEditorProps {
  base64: string;
  onChange: (nextDataBase64: string, mime: string, name: string) => void;
  fileName: string;
  readOnly?: boolean;
}

interface SheetState {
  name: string;
  rows: string[][];
}

const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function decodeWorkbook(base64: string): SheetState[] {
  try {
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const wb = XLSX.read(bytes, { type: "array" });
    return wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      const data = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        defval: "",
        blankrows: false,
      }) as unknown[][];
      const rows = data.map((row) =>
        row.map((v) => (v == null ? "" : String(v))),
      );
      const max = rows.reduce((m, r) => Math.max(m, r.length), 0);
      return {
        name,
        rows: rows.map((r) => {
          const c = [...r];
          while (c.length < max) c.push("");
          return c;
        }),
      };
    });
  } catch (e) {
    console.warn("[xlsx] decode failed:", e);
    return [{ name: "Sheet1", rows: [[""]] }];
  }
}

function encodeWorkbook(sheets: SheetState[]): string {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name);
  }
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as Uint8Array;
  let binary = "";
  for (let i = 0; i < out.length; i++) binary += String.fromCharCode(out[i]);
  return btoa(binary);
}

export function XlsxEditor({ base64, onChange, fileName, readOnly = false }: XlsxEditorProps) {
  const initial = useMemo(() => decodeWorkbook(base64), [base64]);
  const [sheets, setSheets] = useState<SheetState[]>(initial);
  const [activeSheet, setActiveSheet] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setSheets(initial);
    setActiveSheet(0);
    setDirty(false);
  }, [initial]);

  const sheet = sheets[activeSheet];
  const colCount = sheet?.rows[0]?.length ?? 1;

  const updateCell = (r: number, c: number, value: string) => {
    setSheets((prev) =>
      prev.map((s, i) => {
        if (i !== activeSheet) return s;
        const rows = s.rows.map((row) => [...row]);
        rows[r][c] = value;
        return { ...s, rows };
      }),
    );
    setDirty(true);
  };

  const addRow = () => {
    setSheets((prev) =>
      prev.map((s, i) => {
        if (i !== activeSheet) return s;
        return {
          ...s,
          rows: [...s.rows, Array.from({ length: colCount }, () => "")],
        };
      }),
    );
    setDirty(true);
  };

  const addCol = () => {
    setSheets((prev) =>
      prev.map((s, i) => {
        if (i !== activeSheet) return s;
        return { ...s, rows: s.rows.map((row) => [...row, ""]) };
      }),
    );
    setDirty(true);
  };

  const removeRow = (r: number) => {
    setSheets((prev) =>
      prev.map((s, i) => {
        if (i !== activeSheet) return s;
        if (s.rows.length <= 1) return s;
        return { ...s, rows: s.rows.filter((_, j) => j !== r) };
      }),
    );
    setDirty(true);
  };

  const removeCol = (c: number) => {
    setSheets((prev) =>
      prev.map((s, i) => {
        if (i !== activeSheet) return s;
        if (colCount <= 1) return s;
        return { ...s, rows: s.rows.map((row) => row.filter((_, j) => j !== c)) };
      }),
    );
    setDirty(true);
  };

  const save = () => {
    onChange(encodeWorkbook(sheets), XLSX_MIME, fileName);
    setDirty(false);
  };

  if (!sheet) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-soft">
        Empty workbook.
      </div>
    );
  }

  const [header, ...body] = sheet.rows;

  return (
    <div className="flex h-full flex-col">
      {!readOnly && (
        <div className="flex items-center gap-2 border-b border-line bg-bg-panel px-4 py-2">
          <button onClick={addRow} className="btn">
            <Plus size={13} /> Row
          </button>
          <button onClick={addCol} className="btn">
            <Plus size={13} /> Column
          </button>
          <div className="flex-1" />
          <span className="text-[11px] text-ink-soft">
            {sheet.rows.length} rows · {colCount} columns
          </span>
          <button
            onClick={save}
            disabled={!dirty}
            className={classNames("btn", dirty ? "btn-primary" : "opacity-50")}
          >
            <Save size={13} /> {dirty ? "Save" : "Saved"}
          </button>
        </div>
      )}

      {sheets.length > 1 && (
        <div className="flex gap-1 border-b border-line bg-bg-panel/50 px-3 py-1.5">
          {sheets.map((s, i) => (
            <button
              key={s.name + i}
              onClick={() => setActiveSheet(i)}
              className={classNames(
                "rounded px-2.5 py-0.5 text-xs",
                i === activeSheet
                  ? "bg-accent text-white"
                  : "text-ink-muted hover:bg-bg-deep hover:text-ink",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <table className="min-w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-bg-panel">
            <tr>
              <th className="w-10 border border-line bg-bg-deep px-2 py-1 text-[10px] text-ink-soft">
                #
              </th>
              {(header ?? []).map((cell, c) => (
                <th
                  key={c}
                  className="group min-w-[120px] border border-line bg-bg-deep px-2 py-1 text-left"
                >
                  <div className="flex items-center gap-1">
                    <input
                      readOnly={readOnly}
                      value={cell}
                      onChange={(e) => updateCell(0, c, e.target.value)}
                      placeholder={`Col ${c + 1}`}
                      className="w-full bg-transparent text-xs font-semibold text-ink outline-none"
                    />
                    {!readOnly && (
                      <button
                        onClick={() => removeCol(c)}
                        className="opacity-0 transition group-hover:opacity-100 text-ink-soft hover:text-red-600"
                        title="Delete column"
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, r) => (
              <tr key={r} className="group">
                <td className="w-10 border border-line bg-bg-panel/50 px-2 py-1 text-center text-[10px] text-ink-soft">
                  <span className="group-hover:hidden">{r + 1}</span>
                  {!readOnly && (
                    <button
                      onClick={() => removeRow(r + 1)}
                      className="hidden group-hover:inline text-red-600"
                      title="Delete row"
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </td>
                {row.map((cell, c) => (
                  <td key={c} className="border border-line p-0">
                    <input
                      readOnly={readOnly}
                      value={cell}
                      onChange={(e) => updateCell(r + 1, c, e.target.value)}
                      className="w-full bg-transparent px-2 py-1 text-xs text-ink outline-none focus:bg-accent/10"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
