import { Download, FileWarning } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { AtlasNode } from "../../types";
import { CsvEditor } from "./CsvEditor";
import { DocxEditableViewer } from "./DocxEditableViewer";
import { XlsxEditor } from "./XlsxEditor";

interface FileViewerProps {
  node: AtlasNode;
  onChange: (nextDataBase64: string, mime: string, name: string) => void;
  readOnly?: boolean;
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function lowerExt(name: string | null | undefined): string {
  if (!name) return "";
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

export function FileViewer({ node, onChange, readOnly = false }: FileViewerProps) {
  const mime = node.file_mime ?? "application/octet-stream";
  const data = node.file_data ?? "";
  const name = node.file_name ?? node.title ?? "file";
  const ext = lowerExt(name);

  const blobUrl = useMemo(() => {
    if (!data) return null;
    try {
      const bin = atob(data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return URL.createObjectURL(new Blob([bytes], { type: mime }));
    } catch {
      return null;
    }
  }, [data, mime]);

  // Revoke object URL when the file changes (avoids memory leaks)
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  if (!data) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-soft">
        Empty file.
      </div>
    );
  }

  if (mime === "text/csv" || ext === "csv") {
    return (
      <CsvEditor
        base64={data}
        onChange={onChange}
        fileName={name}
        readOnly={readOnly}
      />
    );
  }

  if (
    mime.includes("spreadsheet") ||
    mime.includes("excel") ||
    ext === "xlsx" ||
    ext === "xls"
  ) {
    return (
      <XlsxEditor
        base64={data}
        onChange={onChange}
        fileName={name}
        readOnly={readOnly}
      />
    );
  }

  if (mime === DOCX_MIME || ext === "docx" || ext === "doc") {
    return (
      <DocxEditableViewer
        nodeId={node.id}
        base64={data}
        fileName={name}
        docContent={node.doc_content}
      />
    );
  }

  if (mime.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
    return (
      <div className="flex h-full items-center justify-center overflow-auto bg-bg-panel/40 p-6">
        {blobUrl && (
          <img
            src={blobUrl}
            alt={name}
            className="max-h-full max-w-full rounded-lg border border-line shadow-sm"
          />
        )}
      </div>
    );
  }

  if (mime === "application/pdf" || ext === "pdf") {
    return <PdfViewer blobUrl={blobUrl} fileName={name} />;
  }

  if (mime.startsWith("text/")) {
    return (
      <div className="h-full overflow-auto px-12 py-8">
        <pre className="whitespace-pre-wrap rounded-lg border border-line bg-surface p-4 text-sm text-ink">
          {(() => {
            try {
              return atob(data);
            } catch {
              return "Cannot decode file";
            }
          })()}
        </pre>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
      <FileWarning size={28} className="text-ink-soft" />
      <h3 className="text-base font-semibold text-ink">{name}</h3>
      <p className="max-w-sm text-sm text-ink-muted">
        Inline preview is not available for this file type ({mime}). You can
        download it and open it in another app.
      </p>
      {blobUrl && (
        <a href={blobUrl} download={name} className="btn btn-primary">
          <Download size={14} /> Download
        </a>
      )}
    </div>
  );
}

function PdfViewer({ blobUrl, fileName }: { blobUrl: string | null; fileName: string }) {
  const [fallback, setFallback] = useState(false);
  if (!blobUrl) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-soft">
        Could not load PDF.
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-end border-b border-line bg-bg-panel/50 px-4 py-2">
        <a
          href={blobUrl}
          download={fileName}
          className="btn"
          title="Download PDF"
        >
          <Download size={13} /> Download
        </a>
      </div>
      <div className="flex-1 bg-bg-panel/30">
        {fallback ? (
          <object
            data={blobUrl}
            type="application/pdf"
            className="h-full w-full"
          >
            <div className="flex h-full items-center justify-center p-6 text-center text-sm text-ink-muted">
              Your viewer can't display this PDF inline. Use the Download
              button above.
            </div>
          </object>
        ) : (
          <iframe
            src={blobUrl}
            title={fileName}
            className="h-full w-full border-0"
            onError={() => setFallback(true)}
          />
        )}
      </div>
    </div>
  );
}
