import { create } from "zustand";
import type { AtlasNode, ViewMode } from "../types";
import {
  createNode as dbCreateNode,
  listNodes,
  reorderNodes as dbReorderNodes,
  softDeleteNode,
  updateNode as dbUpdateNode,
} from "./db";
import { useSync } from "./sync";

function notifySync() {
  try {
    useSync.getState().triggerSync();
  } catch {
    /* sync store may not be initialized yet */
  }
}

interface AtlasStore {
  ready: boolean;
  nodes: Record<string, AtlasNode>;
  rootIds: string[];
  childrenByParent: Record<string, string[]>;
  selectedId: string | null;
  expanded: Record<string, boolean>;

  init: () => Promise<void>;
  selectNode: (id: string | null) => void;
  toggleExpanded: (id: string) => void;
  setExpanded: (id: string, value: boolean) => void;

  createNode: (
    parentId: string | null,
    title?: string,
    options?: { select?: boolean; viewMode?: ViewMode },
  ) => Promise<string>;
  createWorkspace: (kind: "classic" | "segments", title: string) => Promise<string>;
  createFileNode: (
    parentId: string,
    file: { name: string; mime: string; data: string; size: number },
  ) => Promise<string>;
  updateFileData: (id: string, data: string, mime: string, name: string) => Promise<void>;
  renameNode: (id: string, title: string) => Promise<void>;
  setIcon: (id: string, icon: string | null) => Promise<void>;
  setDocContent: (id: string, content: string) => Promise<void>;
  setCanvasContent: (id: string, content: string) => Promise<void>;
  setViewMode: (id: string, mode: ViewMode) => Promise<void>;
  moveNode: (id: string, newParentId: string | null, newOrder: number) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
}

function iconForMime(mime: string): string {
  if (mime.startsWith("image/")) return "🖼️";
  if (mime === "application/pdf") return "📕";
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime === "text/csv")
    return "📊";
  if (mime.includes("word") || mime === "text/plain" || mime === "text/markdown")
    return "📝";
  if (mime.includes("zip") || mime.includes("compressed")) return "🗜️";
  return "📎";
}

function indexNodes(rows: AtlasNode[]) {
  const nodes: Record<string, AtlasNode> = {};
  const childrenByParent: Record<string, string[]> = {};
  const rootIds: string[] = [];

  for (const n of rows) {
    nodes[n.id] = n;
    if (n.parent_id) {
      (childrenByParent[n.parent_id] ||= []).push(n.id);
    } else {
      rootIds.push(n.id);
    }
  }
  // sort each bucket by sort_order
  const sortFn = (a: string, b: string) =>
    nodes[a].sort_order - nodes[b].sort_order;
  rootIds.sort(sortFn);
  for (const k of Object.keys(childrenByParent)) {
    childrenByParent[k].sort(sortFn);
  }

  return { nodes, childrenByParent, rootIds };
}

export const useStore = create<AtlasStore>((set, get) => ({
  ready: false,
  nodes: {},
  rootIds: [],
  childrenByParent: {},
  selectedId: null,
  expanded: {},

  init: async () => {
    const rows = await listNodes();
    const indexed = indexNodes(rows);
    // ALWAYS preserve existing expanded state. Only fill in defaults for
    // newly-seen root nodes (so first launch auto-expands root level but
    // any subsequent reload — sync pull, race during initial open, etc.
    // — never collapses what the user has expanded).
    const expanded: Record<string, boolean> = { ...get().expanded };
    for (const id of indexed.rootIds) {
      if (expanded[id] === undefined) expanded[id] = true;
    }
    set({
      ...indexed,
      ready: true,
      expanded,
    });
  },

  selectNode: (id) => set({ selectedId: id }),

  toggleExpanded: (id) =>
    set((s) => ({ expanded: { ...s.expanded, [id]: !s.expanded[id] } })),

  setExpanded: (id, value) =>
    set((s) => ({ expanded: { ...s.expanded, [id]: value } })),

  createNode: async (parentId, title = "Untitled", options) => {
    const select = options?.select ?? true;
    // Inherit view_mode from parent unless explicitly overridden.
    let view_mode: ViewMode = options?.viewMode ?? "doc";
    if (!options?.viewMode && parentId) {
      const parent = get().nodes[parentId];
      if (parent) view_mode = parent.view_mode;
    }
    const node = await dbCreateNode({ parent_id: parentId, title, view_mode });
    const next = [...Object.values(get().nodes), node];
    set({
      ...indexNodes(next),
      ...(select ? { selectedId: node.id } : {}),
    });
    if (parentId) {
      set((s) => ({ expanded: { ...s.expanded, [parentId]: true } }));
    }
    notifySync();
    return node.id;
  },

  createWorkspace: async (kind, title) => {
    const node = await dbCreateNode({
      parent_id: null,
      title,
      kind: kind === "segments" ? "segment" : "doc",
      view_mode: kind === "segments" ? "canvas" : "doc",
      icon: kind === "segments" ? "🗂️" : "📁",
    });
    const next = [...Object.values(get().nodes), node];
    set({
      ...indexNodes(next),
      selectedId: node.id,
      expanded: { ...get().expanded, [node.id]: true },
    });
    notifySync();
    return node.id;
  },

  createFileNode: async (parentId, file) => {
    const node = await dbCreateNode({
      parent_id: parentId,
      title: file.name,
      kind: "file",
      file_mime: file.mime,
      file_name: file.name,
      file_data: file.data,
      file_size: file.size,
      icon: iconForMime(file.mime),
    });
    const next = [...Object.values(get().nodes), node];
    set({
      ...indexNodes(next),
      expanded: { ...get().expanded, [parentId]: true },
    });
    notifySync();
    return node.id;
  },

  updateFileData: async (id, data, mime, name) => {
    await dbUpdateNode(id, {
      file_data: data,
      file_mime: mime,
      file_name: name,
      file_size: data.length,
    });
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: {
          ...s.nodes[id],
          file_data: data,
          file_mime: mime,
          file_name: name,
          file_size: data.length,
          updated_at: Date.now(),
        },
      },
    }));
    notifySync();
  },

  renameNode: async (id, title) => {
    await dbUpdateNode(id, { title });
    set((s) => ({
      nodes: { ...s.nodes, [id]: { ...s.nodes[id], title, updated_at: Date.now() } },
    }));
    notifySync();
  },

  setIcon: async (id, icon) => {
    await dbUpdateNode(id, { icon });
    set((s) => ({
      nodes: { ...s.nodes, [id]: { ...s.nodes[id], icon, updated_at: Date.now() } },
    }));
    notifySync();
  },

  setDocContent: async (id, content) => {
    await dbUpdateNode(id, { doc_content: content });
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: { ...s.nodes[id], doc_content: content, updated_at: Date.now() },
      },
    }));
    notifySync();
  },

  setCanvasContent: async (id, content) => {
    await dbUpdateNode(id, { canvas_content: content });
    set((s) => ({
      nodes: {
        ...s.nodes,
        [id]: { ...s.nodes[id], canvas_content: content, updated_at: Date.now() },
      },
    }));
    notifySync();
  },

  setViewMode: async (id, view_mode) => {
    await dbUpdateNode(id, { view_mode });
    set((s) => ({
      nodes: { ...s.nodes, [id]: { ...s.nodes[id], view_mode } },
    }));
    notifySync();
  },

  moveNode: async (id, newParentId, newOrder) => {
    await dbReorderNodes([{ id, parent_id: newParentId, sort_order: newOrder }]);
    const all = Object.values(get().nodes).map((n) =>
      n.id === id ? { ...n, parent_id: newParentId, sort_order: newOrder } : n,
    );
    set({ ...indexNodes(all) });
    notifySync();
  },

  deleteNode: async (id) => {
    try {
      await softDeleteNode(id);
    } catch (err) {
      console.error("[store.deleteNode] DB error", err);
      throw err;
    }
    const rows = await listNodes();
    const indexed = indexNodes(rows);
    const prevSelected = get().selectedId;
    const newSelected =
      prevSelected && !indexed.nodes[prevSelected] ? null : prevSelected;
    set({
      ...indexed,
      selectedId: newSelected,
    });
    notifySync();
  },
}));

export function getChildren(id: string | null): string[] {
  const s = useStore.getState();
  if (id === null) return s.rootIds;
  return s.childrenByParent[id] ?? [];
}

export function isDescendant(ancestorId: string, candidateId: string): boolean {
  if (ancestorId === candidateId) return true;
  const s = useStore.getState();
  let cur: AtlasNode | undefined = s.nodes[candidateId];
  while (cur?.parent_id) {
    if (cur.parent_id === ancestorId) return true;
    cur = s.nodes[cur.parent_id];
  }
  return false;
}

export function getDepth(id: string): number {
  const s = useStore.getState();
  let depth = 0;
  let cur = s.nodes[id];
  while (cur?.parent_id) {
    depth += 1;
    cur = s.nodes[cur.parent_id];
  }
  return depth;
}
