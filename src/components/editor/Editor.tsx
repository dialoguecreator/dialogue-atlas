import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import type { Block, PartialBlock } from "@blocknote/core";
import { useEffect, useMemo, useRef } from "react";
import { debounce } from "../../lib/utils";

interface EditorProps {
  nodeId: string;
  initialContent: string | null;
  onChange: (content: string) => void;
  readOnly?: boolean;
}

function parseInitial(content: string | null): PartialBlock[] | undefined {
  if (!content) return undefined;
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed as PartialBlock[];
    }
  } catch (e) {
    console.warn("[Editor] Failed to parse stored content:", e);
  }
  return undefined;
}

export function Editor({ nodeId, initialContent, onChange, readOnly = false }: EditorProps) {
  // Re-key on nodeId so a fresh editor instance is built per page.
  const initial = useMemo(() => parseInitial(initialContent), [nodeId, initialContent]);

  const editor = useCreateBlockNote(
    initial ? { initialContent: initial } : {},
    [nodeId],
  );

  const debouncedSave = useRef(
    debounce((blocks: Block[]) => {
      onChange(JSON.stringify(blocks));
    }, 500),
  );

  useEffect(() => {
    debouncedSave.current = debounce((blocks: Block[]) => {
      onChange(JSON.stringify(blocks));
    }, 500);
  }, [onChange]);

  return (
    <div className="bn-container h-full overflow-y-auto px-12 py-10">
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        theme="light"
        onChange={() => debouncedSave.current(editor.document)}
      />
    </div>
  );
}
