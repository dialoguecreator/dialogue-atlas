import type { Editor } from "tldraw";

// Keeps a reference to the active tldraw editor instance per Mindmap node,
// so that the Export action elsewhere in the UI can reach it. Editors register
// themselves on mount and clear on unmount.
const editors = new Map<string, Editor>();

export function registerMindmapEditor(nodeId: string, editor: Editor | null): void {
  if (editor) {
    editors.set(nodeId, editor);
  } else {
    editors.delete(nodeId);
  }
}

export function getMindmapEditor(nodeId: string): Editor | undefined {
  return editors.get(nodeId);
}
