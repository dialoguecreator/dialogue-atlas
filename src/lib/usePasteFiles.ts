import { useEffect } from "react";
import { fileToUpload, inferMime } from "./files";
import { useStore } from "./store";

function targetIsEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  // ProseMirror / BlockNote editor surfaces
  if (target.closest(".ProseMirror, [contenteditable='true']")) return true;
  return false;
}

function isPlainTextOnly(types: ReadonlyArray<string>): boolean {
  if (types.length === 0) return false;
  return types.every(
    (t) =>
      t === "text/plain" ||
      t === "text/html" ||
      t === "text/uri-list" ||
      t.startsWith("application/x-vnd."),
  );
}

function extractFiles(clipboardData: DataTransfer): File[] {
  const result: File[] = [];
  if (clipboardData.files && clipboardData.files.length > 0) {
    for (const f of Array.from(clipboardData.files)) result.push(f);
  }
  if (result.length === 0 && clipboardData.items) {
    for (const item of Array.from(clipboardData.items)) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) result.push(f);
      }
    }
  }
  return result;
}

export function usePasteFiles() {
  useEffect(() => {
    const handler = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;

      // Let inputs/editors handle text paste themselves.
      const types = Array.from(e.clipboardData.types ?? []);
      if (targetIsEditable(e.target) && isPlainTextOnly(types)) return;

      const files = extractFiles(e.clipboardData);
      if (files.length === 0) return;

      // If the user is typing into an editor and the clipboard has both files
      // and text, let the editor decide (text wins for editors).
      if (targetIsEditable(e.target) && types.includes("text/plain") && files.length === 0) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const state = useStore.getState();
      let parentId = state.selectedId;
      if (!parentId) {
        // Fallback to first root workspace
        parentId = state.rootIds[0] ?? null;
      }
      if (!parentId) return;
      const target = state.nodes[parentId];
      if (target?.kind === "file" && target.parent_id) {
        parentId = target.parent_id;
      }

      let lastId: string | null = null;
      for (const file of files) {
        const fallbackName = file.name?.trim()
          ? file.name
          : `Pasted ${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.${guessExt(file)}`;
        const upload = await fileToUpload(
          file.name ? file : new File([file], fallbackName, { type: file.type }),
          fallbackName,
        );
        lastId = await state.createFileNode(parentId, upload);
      }
      if (files.length === 1 && lastId) state.selectNode(lastId);
    };

    window.addEventListener("paste", handler);
    return () => window.removeEventListener("paste", handler);
  }, []);
}

function guessExt(file: File): string {
  const mime = inferMime({ name: file.name, type: file.type });
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/gif") return "gif";
  if (mime === "image/webp") return "webp";
  if (mime === "image/svg+xml") return "svg";
  if (mime === "application/pdf") return "pdf";
  if (mime === "text/csv") return "csv";
  if (mime.startsWith("text/")) return "txt";
  return "bin";
}
