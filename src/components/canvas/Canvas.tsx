import "tldraw/tldraw.css";
import dagre from "@dagrejs/dagre";
import {
  DefaultFontStyle,
  Tldraw,
  createBindingId,
  createShapeId,
  toRichText,
  useEditor,
  useValue,
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
      // Default to a clean sans-serif font for new shapes & arrows (Miro/FigJam
      // style) instead of tldraw's hand-drawn "draw" font. Applies to geo,
      // arrow, note, and text shapes — anything that participates in the
      // shared DefaultFontStyle. Idempotent: persists in instanceState but
      // re-applies on every mount in case the previous value was 'draw'.
      editor.setStyleForNextShapes(DefaultFontStyle, "sans");
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
          font: "sans" as const,
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
          font: "sans" as const,
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
        components={{ OnTheCanvas: ConnectionDots }}
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

/**
 * Always-visible connection dots (Miro/FigJam style) painted on the N/S/E/W
 * edges of every geo shape. Rendered via the OnTheCanvas slot so they live
 * inside tldraw's page-space transform — coordinates here are page units,
 * not screen pixels.
 *
 * Visual affordance only: pointer events are off so dots never intercept
 * canvas interaction. Users still drag arrows the same way (arrow tool from
 * any point on the shape, or the built-in selection "create" handle).
 */
function ConnectionDots() {
  const editor = useEditor();
  const dots = useValue(
    "connection-dots",
    () => {
      if (editor.getInstanceState().isReadonly) return [];
      const out: { x: number; y: number }[] = [];
      for (const shape of editor.getCurrentPageShapes()) {
        // Only geo shapes (rectangle, oval, diamond, etc.) get connection
        // dots. Arrows, draw strokes, text, frames, images etc. don't.
        if (shape.type !== "geo") continue;
        if (editor.isShapeHidden(shape)) continue;
        const bounds = editor.getShapePageBounds(shape);
        if (!bounds) continue;
        out.push({ x: bounds.midX, y: bounds.minY }); // N
        out.push({ x: bounds.maxX, y: bounds.midY }); // E
        out.push({ x: bounds.midX, y: bounds.maxY }); // S
        out.push({ x: bounds.minX, y: bounds.midY }); // W
      }
      return out;
    },
    [editor],
  );

  // Subscribe to zoom so the dot radius stays roughly constant in screen
  // pixels regardless of how far in or out the user is zoomed.
  const zoom = useValue("zoom", () => editor.getZoomLevel(), [editor]);

  if (dots.length === 0) return null;

  // Target ~5px on screen, clamped at very high zoom (matches how tldraw's
  // own handles stop growing past 25% zoom).
  const r = 5 / Math.max(zoom, 0.25);

  return (
    <svg
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        overflow: "visible",
        pointerEvents: "none",
        zIndex: 100,
      }}
      width={1}
      height={1}
    >
      {dots.map((d, i) => (
        <circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={r}
          fill="var(--tl-color-panel)"
          stroke="var(--tl-color-selected)"
          strokeWidth={1.5}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}
