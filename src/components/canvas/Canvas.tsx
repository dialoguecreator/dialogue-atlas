import "tldraw/tldraw.css";
import dagre from "@dagrejs/dagre";
import {
  Tldraw,
  createBindingId,
  createShapeId,
  toRichText,
  type Editor,
  type TLShapeId,
} from "tldraw";
import { Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { registerMindmapEditor } from "../../lib/mindmapRegistry";
import { useTheme } from "../../lib/theme";
import { AiMindmapDialog } from "./AiMindmapDialog";
import type { AiGraph } from "../../lib/aiMindmap";

interface CanvasProps {
  nodeId: string;
  // initialContent / onChange are kept on the prop type for compatibility,
  // but tldraw uses its own IndexedDB-backed persistence via persistenceKey.
  initialContent?: string | null;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

const NODE_W = 220;
const NODE_H = 80;

export function Canvas({ nodeId, readOnly = false }: CanvasProps) {
  const editorRef = useRef<Editor | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const theme = useTheme((s) => s.theme);

  const handleMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      registerMindmapEditor(nodeId, editor);
      editor.user.updateUserPreferences({ colorScheme: theme });
      editor.updateInstanceState({ isGridMode: true });
      if (readOnly) {
        editor.updateInstanceState({ isReadonly: true });
      }
    },
    [theme, readOnly, nodeId],
  );

  // Cleanup registry on unmount or nodeId change
  useEffect(() => {
    return () => {
      registerMindmapEditor(nodeId, null);
    };
  }, [nodeId]);

  // Keep tldraw theme in sync with app theme
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.user.updateUserPreferences({ colorScheme: theme });
    }
  }, [theme]);

  const handleAiResult = useCallback((graph: AiGraph) => {
    const editor = editorRef.current;
    if (!editor) return;

    // Run dagre for proper hierarchical layout with generous spacing
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir: "TB",
      nodesep: 80,   // horizontal gap between sibling nodes
      ranksep: 140,  // vertical gap between levels
      marginx: 40,
      marginy: 40,
    });
    for (const n of graph.nodes) {
      g.setNode(n.id, { width: NODE_W, height: NODE_H });
    }
    for (const e of graph.edges) {
      g.setEdge(e.from, e.to);
    }
    dagre.layout(g);

    // Offset for new graph: place below any existing shapes
    const existingBounds = editor.getCurrentPageBounds();
    const offsetX = 100;
    const offsetY =
      existingBounds && editor.getCurrentPageShapes().length > 0
        ? existingBounds.maxY + 120
        : 100;

    const idMap = new Map<string, TLShapeId>();
    for (const n of graph.nodes) idMap.set(n.id, createShapeId());

    // Create geo (rectangle) shapes from the laid-out positions
    const shapesToCreate = graph.nodes.map((n) => {
      const pos = g.node(n.id);
      // dagre returns center coords; tldraw uses top-left
      const x = offsetX + pos.x - NODE_W / 2;
      const y = offsetY + pos.y - NODE_H / 2;
      return {
        id: idMap.get(n.id)!,
        type: "geo" as const,
        x,
        y,
        props: {
          geo: "rectangle" as const,
          w: NODE_W,
          h: NODE_H,
          richText: toRichText(n.label),
          color: "black" as const,
          size: "s" as const,
        },
      };
    });

    editor.createShapes(shapesToCreate);

    // Create elbow arrows AND bind them to source/target shapes so they
    // route around boxes and re-attach automatically when shapes move.
    for (const e of graph.edges) {
      const sourceId = idMap.get(e.from);
      const targetId = idMap.get(e.to);
      if (!sourceId || !targetId) continue;

      const arrowId = createShapeId();
      editor.createShape({
        id: arrowId,
        type: "arrow",
        props: {
          kind: "elbow" as const,
        },
      });

      editor.createBindings([
        {
          id: createBindingId(),
          type: "arrow",
          fromId: arrowId,
          toId: sourceId,
          props: {
            terminal: "start" as const,
            normalizedAnchor: { x: 0.5, y: 0.5 },
            isPrecise: false,
            isExact: false,
          },
        },
        {
          id: createBindingId(),
          type: "arrow",
          fromId: arrowId,
          toId: targetId,
          props: {
            terminal: "end" as const,
            normalizedAnchor: { x: 0.5, y: 0.5 },
            isPrecise: false,
            isExact: false,
          },
        },
      ]);
    }

    setTimeout(() => editor.zoomToFit({ animation: { duration: 300 } }), 100);
  }, []);

  return (
    <div className="relative h-full w-full">
      <Tldraw
        persistenceKey={`atlas-mindmap-${nodeId}`}
        onMount={handleMount}
      />

      {!readOnly && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-[200] flex justify-center">
          <button
            onClick={() => setAiOpen(true)}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-accent shadow-md transition hover:bg-accent/10"
            title="Generate mindmap with AI"
          >
            <Sparkles size={13} /> Generate with AI
          </button>
        </div>
      )}

      <AiMindmapDialog
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onResult={handleAiResult}
      />
    </div>
  );
}
