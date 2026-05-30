import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Plus, Search, Settings } from "lucide-react";

declare const APP_VERSION: string;
import { useMemo, useState } from "react";
import { isDescendant, useStore } from "../../lib/store";
import { useTheme } from "../../lib/theme";
import { SettingsDialog } from "../SettingsDialog";
import { ThemeToggle } from "../ThemeToggle";
import { NewWorkspaceDialog, type WorkspaceKind } from "./NewWorkspaceDialog";
import { NodeTree } from "./NodeTree";

export function Sidebar() {
  const ready = useStore((s) => s.ready);
  const nodes = useStore((s) => s.nodes);
  const createWorkspace = useStore((s) => s.createWorkspace);
  const moveNode = useStore((s) => s.moveNode);
  const theme = useTheme((s) => s.theme);
  const [query, setQuery] = useState("");
  const [newWorkspaceOpen, setNewWorkspaceOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const handleDragStart = (e: DragStartEvent) => {
    setDraggingId(String(e.active.id));
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    setDraggingId(null);
    const activeId = String(e.active.id);
    const overId = e.over ? String(e.over.id) : null;
    if (!overId) return;
    if (activeId === overId) return;

    if (overId === "ROOT") {
      // Drop on root sidebar drop zone → promote to top level
      await moveNode(activeId, null, Date.now());
      return;
    }

    // Target node check: cannot drop into self or any descendant
    if (isDescendant(activeId, overId)) return;
    await moveNode(activeId, overId, Date.now());
  };

  const filteredIds = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return Object.values(nodes)
      .filter((n) => n.title.toLowerCase().includes(q))
      .map((n) => n.id);
  }, [nodes, query]);

  const handleNew = () => setNewWorkspaceOpen(true);

  const handleCreateWorkspace = async (kind: WorkspaceKind, title: string) => {
    setNewWorkspaceOpen(false);
    await createWorkspace(kind, title);
  };

  return (
    <aside className="flex h-full w-64 flex-col border-r border-line bg-bg-panel">
      <div className="px-3 pt-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full rounded-md border border-line bg-surface py-1.5 pl-7 pr-2 text-sm outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
          Workspace
        </span>
        <button
          onClick={handleNew}
          className="rounded p-1 text-ink-soft hover:bg-bg-deep hover:text-ink"
          title="New page"
        >
          <Plus size={14} />
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="mt-1 flex-1 overflow-y-auto px-1 pb-3">
          {!ready && (
            <div className="px-3 py-6 text-xs text-ink-soft">Loading…</div>
          )}
          {ready && filteredIds && filteredIds.length === 0 && (
            <div className="px-3 py-6 text-xs text-ink-soft">No matches.</div>
          )}
          {ready && (
            <NodeTree
              parentId={null}
              filteredIds={filteredIds}
              draggingId={draggingId}
            />
          )}
          {ready && Object.keys(nodes).length === 0 && !filteredIds && (
            <button
              onClick={handleNew}
              className="mx-2 mt-2 flex w-[calc(100%-1rem)] items-center gap-2 rounded-md border border-dashed border-line px-3 py-3 text-sm text-ink-soft hover:border-accent hover:text-accent"
            >
              <Plus size={14} />
              Create your first page
            </button>
          )}
          {ready && draggingId && <RootDropZone />}
        </div>
        <DragOverlay>
          {draggingId && nodes[draggingId] ? (
            <div className="pointer-events-none flex items-center gap-1.5 rounded-md border border-accent bg-surface px-2 py-1 text-sm text-ink shadow-lg">
              <span>{nodes[draggingId].icon ?? "📄"}</span>
              <span className="truncate">
                {nodes[draggingId].title || "Untitled"}
              </span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
        <ThemeToggle />
        <span className="text-[11px] text-ink-soft">
          {theme === "dark" ? "Dark" : "Light"}
        </span>
        <div className="flex-1" />
        <span
          className="text-[10px] text-ink-soft tabular-nums"
          title="App version"
        >
          v{APP_VERSION}
        </span>
        <button
          onClick={() => setSettingsOpen(true)}
          className="rounded p-1 text-ink-soft hover:bg-bg-deep hover:text-ink"
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>

      <NewWorkspaceDialog
        open={newWorkspaceOpen}
        onCreate={handleCreateWorkspace}
        onCancel={() => setNewWorkspaceOpen(false)}
      />
      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </aside>
  );
}

function RootDropZone() {
  const { isOver, setNodeRef } = useDroppable({ id: "ROOT" });
  return (
    <div
      ref={setNodeRef}
      className={`mx-2 mt-3 rounded-md border-2 border-dashed py-3 text-center text-[11px] transition ${
        isOver
          ? "border-accent bg-accent/10 text-accent"
          : "border-line text-ink-soft"
      }`}
    >
      Drop here to move to top level
    </div>
  );
}
