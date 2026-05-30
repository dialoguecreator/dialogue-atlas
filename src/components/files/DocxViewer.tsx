import mammoth from "mammoth";
import DOMPurify from "isomorphic-dompurify";
import { Download, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

interface DocxViewerProps {
  base64: string;
  fileName: string;
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

export function DocxViewer({ base64, fileName }: DocxViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const downloadUrl = useMemo(() => {
    try {
      const bin = atob(base64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return URL.createObjectURL(
        new Blob([bytes], {
          type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }),
      );
    } catch {
      return null;
    }
  }, [base64]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setHtml(null);
    (async () => {
      try {
        const arrayBuffer = base64ToArrayBuffer(base64);
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Title'] => h1.docx-title:fresh",
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
            ],
          },
        );
        if (cancelled) return;
        const safeHtml = DOMPurify.sanitize(result.value, {
          USE_PROFILES: { html: true },
          FORBID_TAGS: [
            "script",
            "style",
            "iframe",
            "object",
            "embed",
            "form",
            "input",
            "button",
          ],
          FORBID_ATTR: [
            "onerror",
            "onload",
            "onclick",
            "onmouseover",
            "onmouseout",
            "onfocus",
            "onblur",
            "style",
          ],
        });
        setHtml(safeHtml);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [base64]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-ink-soft">
        <Loader2 size={14} className="animate-spin" />
        Converting Word document…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
        <h3 className="text-base font-semibold text-ink">
          Cannot read this Word file
        </h3>
        <p className="max-w-sm text-sm text-ink-muted">{error}</p>
        {downloadUrl && (
          <a href={downloadUrl} download={fileName} className="btn btn-primary">
            <Download size={14} /> Download
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-line bg-bg-panel/50 px-4 py-2 text-xs text-ink-muted">
        <span>
          Read-only preview. Word editing is not supported inline — open in
          another app to edit.
        </span>
        {downloadUrl && (
          <a
            href={downloadUrl}
            download={fileName}
            className="btn"
            title="Download original"
          >
            <Download size={13} /> Download
          </a>
        )}
      </div>
      <div className="flex-1 overflow-auto px-12 py-8">
        <div
          className="docx-content mx-auto max-w-3xl text-ink"
          dangerouslySetInnerHTML={{ __html: html ?? "" }}
        />
      </div>
    </div>
  );
}
