import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteEditor, type Block, type PartialBlock } from "@blocknote/core";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import DOMPurify from "isomorphic-dompurify";
import { Download, Loader2, PencilLine, RotateCcw } from "lucide-react";
import mammoth from "mammoth";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "../../lib/store";
import { debounce } from "../../lib/utils";
import { DocxViewer } from "./DocxViewer";

interface DocxEditableViewerProps {
  nodeId: string;
  base64: string;
  fileName: string;
  docContent: string | null;
}

function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

function parseBlocks(content: string | null): PartialBlock[] | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed as PartialBlock[];
  } catch {
    /* fall through */
  }
  return null;
}

export function DocxEditableViewer({
  nodeId,
  base64,
  fileName,
  docContent,
}: DocxEditableViewerProps) {
  const setDocContent = useStore((s) => s.setDocContent);

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
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const existingBlocks = parseBlocks(docContent);

  if (existingBlocks) {
    return (
      <EditableSurface
        nodeId={nodeId}
        initialBlocks={existingBlocks}
        fileName={fileName}
        downloadUrl={downloadUrl}
        onResetToOriginal={() => setDocContent(nodeId, "")}
      />
    );
  }

  return (
    <PreviewWithEnableButton
      nodeId={nodeId}
      base64={base64}
      fileName={fileName}
    />
  );
}

function PreviewWithEnableButton({
  nodeId,
  base64,
  fileName,
}: {
  nodeId: string;
  base64: string;
  fileName: string;
}) {
  const setDocContent = useStore((s) => s.setDocContent);
  const [converting, setConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const convert = async () => {
    setConverting(true);
    setError(null);
    try {
      const arrayBuffer = base64ToArrayBuffer(base64);
      const result = await mammoth.convertToHtml({ arrayBuffer });
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
      // Create a throw-away editor instance to parse HTML to BlockNote blocks
      const tempEditor = BlockNoteEditor.create();
      const blocks = await tempEditor.tryParseHTMLToBlocks(safeHtml);
      if (!blocks || blocks.length === 0) {
        // Fallback: a single empty paragraph
        await setDocContent(
          nodeId,
          JSON.stringify([{ type: "paragraph", content: [] }]),
        );
      } else {
        await setDocContent(nodeId, JSON.stringify(blocks));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-bg-panel/50 px-4 py-2 text-xs">
        <span className="text-ink-muted">
          Read-only preview of original Word file.
        </span>
        <div className="flex items-center gap-1.5">
          <button onClick={convert} disabled={converting} className="btn btn-primary">
            {converting ? (
              <>
                <Loader2 size={13} className="animate-spin" /> Converting…
              </>
            ) : (
              <>
                <PencilLine size={13} /> Edit inline
              </>
            )}
          </button>
        </div>
      </div>
      {error && (
        <div className="border-b border-red-200 bg-red-50/40 px-4 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <DocxViewer base64={base64} fileName={fileName} />
      </div>
    </div>
  );
}

function EditableSurface({
  nodeId,
  initialBlocks,
  fileName,
  downloadUrl,
  onResetToOriginal,
}: {
  nodeId: string;
  initialBlocks: PartialBlock[];
  fileName: string;
  downloadUrl: string | null;
  onResetToOriginal: () => void;
}) {
  const setDocContent = useStore((s) => s.setDocContent);
  const editor = useCreateBlockNote(
    { initialContent: initialBlocks },
    [nodeId],
  );

  const debouncedSave = useRef(
    debounce((blocks: Block[]) => {
      setDocContent(nodeId, JSON.stringify(blocks));
    }, 500),
  );

  useEffect(() => {
    debouncedSave.current = debounce((blocks: Block[]) => {
      setDocContent(nodeId, JSON.stringify(blocks));
    }, 500);
  }, [nodeId, setDocContent]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-bg-panel/50 px-4 py-2 text-xs">
        <span className="text-ink-muted">
          Editing imported Word content. Original .docx kept for download.
        </span>
        <div className="flex items-center gap-1.5">
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={fileName}
              className="btn"
              title="Download original .docx"
            >
              <Download size={13} /> Original
            </a>
          )}
          <button
            onClick={() => {
              if (
                confirm(
                  "Discard your edits and revert to the original Word preview?",
                )
              ) {
                onResetToOriginal();
              }
            }}
            className="btn"
            title="Discard edits"
          >
            <RotateCcw size={13} /> Reset
          </button>
        </div>
      </div>
      <div className="bn-container flex-1 overflow-y-auto px-12 py-8">
        <BlockNoteView
          editor={editor}
          theme="light"
          onChange={() => debouncedSave.current(editor.document)}
        />
      </div>
    </div>
  );
}
