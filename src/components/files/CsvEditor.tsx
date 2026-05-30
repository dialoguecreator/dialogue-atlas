import { Plus, Save, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { classNames } from "../../lib/utils";

interface CsvEditorProps {
  base64: string;
  onChange: (nextDataBase64: string, mime: string, name: string) => void;
  fileName: string;
  readOnly?: boolean;
}

function decodeCsv(base64: string): string[][] {
  let text = "";
  try {
    text = atob(base64);
  } catch {
    return [[""]];
  }
  return parseCsv(text);
}

// Minimal CSV parser supporting quoted fields and escaped quotes ("")
function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (inQuotes) {
      if (c === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        row.push(field);
        field = "";
      } else if (c === "\n" || c === "\r") {
        if (c === "\r" && input[i + 1] === "\n") i += 1;
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else {
        field += c;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.length > 0 ? rows : [[""]];
}

function serializeCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          if (/[",\r\n]/.test(cell)) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(","),
    )
    .join("\n");
}

function toBase64(s: string): string {
  return btoa(unescape(encodeURIComponent(s)));
}

export function CsvEditor({ base64, onChange, fileName, readOnly = false }: CsvEditorProps) {
  const initialRows = useMemo(() => {
    const parsed = decodeCsv(base64);
    // Normalize: ensure same column count across rows
    const max = parsed.reduce((m, r) => Math.max(m, r.length), 0);
    return parsed.map((r) => {
      const copy = [...r];
      while (copy.length < max) copy.push("");
      return copy;
    });
  }, [base64]);

  const [rows, setRows] = useState<string[][]>(initialRows);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setRows(initialRows);
    setDirty(false);
  }, [initialRows]);

  const colCount = rows[0]?.length ?? 1;

  const updateCell = (r: number, c: number, value: string) => {
    setRows((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = value;
      return next;
    });
    setDirty(true);
  };

  const addRow = () => {
    setRows((prev) => [...prev, Array.from({ length: colCount }, () => "")]);
    setDirty(true);
  };

  const addCol = () => {
    setRows((prev) => prev.map((row) => [...row, ""]));
    setDirty(true);
  };

  const removeRow = (r: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== r) : prev));
    setDirty(true);
  };

  const removeCol = (c: number) => {
    setRows((prev) => {
      if (colCount <= 1) return prev;
      return prev.map((row) => row.filter((_, i) => i !== c));
    });
    setDirty(true);
  };

  const save = () => {
    const csv = serializeCsv(rows);
    onChange(toBase64(csv), "text/csv", fileName);
    setDirty(false);
  };

  const [header, ...body] = rows;

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
            {rows.length} rows · {colCount} columns
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
