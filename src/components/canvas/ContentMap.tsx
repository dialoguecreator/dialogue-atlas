import { ChevronDown, ChevronRight, ChevronsUpDown, Edit3, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useStore } from "../../lib/store";
import { fileToUpload } from "../../lib/files";
import { useExternalFileDrop } from "../../lib/useExternalFileDrop";
import type { ViewMode } from "../../types";
import { classNames } from "../../lib/utils";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmojiPicker } from "../ui/EmojiPicker";
import { CreateMenu } from "./CreateMenu";

const EMPTY_IDS: readonly string[] = Object.freeze([]) as unknown as readonly string[];

interface ContentMapProps {
  parentId: string;
  readOnly?: boolean;
}


export function ContentMap({ parentId, readOnly = false }: ContentMapProps) {
  const childIds = useStore((s) => s.childrenByParent[parentId] ?? EMPTY_IDS);
  const createNode = useStore((s) => s.createNode);
  const createFileNode = useStore((s) => s.createFileNode);
  const selectNode = useStore((s) => s.selectNode);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const { isExternalDragOver, dropHandlers } = useExternalFileDrop({
    disabled: readOnly,
    onFiles: async (files) => {
      let lastId: string | null = null;
      for (const file of files) {
        const upload = await fileToUpload(file);
        lastId = await createFileNode(parentId, upload);
      }
      if (files.length === 1 && lastId) selectNode(lastId);
    },
  });

  const handleAddOfType = async (viewMode: ViewMode) => {
    if (readOnly) return;
    const titleByMode: Record<ViewMode, string> = {
      doc: "Untitled",
      canvas: "New map",
      mindmap: "New mindmap",
      split: "Untitled",
    };
    await createNode(parentId, titleByMode[viewMode], {
      select: false,
      viewMode,
    });
  };

  const handleAddSubcategory = async () => {
    if (readOnly) return;
    // Subcategory is a container — opens the Map view of its children, not a doc editor.
    await createNode(parentId, "New section", {
      select: false,
      viewMode: "canvas",
    });
  };

  const handleAddFile = () => {
    if (readOnly) return;
    fileInputRef.current?.click();
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      const upload = await fileToUpload(file);
      const newId = await createFileNode(parentId, upload);
      if (files.length === 1) selectNode(newId);
    }
    e.target.value = "";
  };

  return (
    <div
      {...dropHandlers}
      className={classNames(
        "relative flex h-full overflow-hidden",
        isExternalDragOver && "ring-2 ring-inset ring-accent",
      )}
    >
      {isExternalDragOver && (
        <div className="pointer-events-none absolute inset-4 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-accent bg-accent/10 text-sm font-medium text-accent">
          Drop files to add them here
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.xlsx,.xls,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.svg,application/pdf,text/csv,text/plain,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleFiles}
        className="hidden"
      />

      {childIds.length === 0 ? (
        <div className="flex flex-1 items-center justify-center overflow-y-auto px-8 py-6">
          <EmptyState
            onAdd={(mode) => handleAddOfType(mode)}
            onAddSubcategory={handleAddSubcategory}
            onAddFile={handleAddFile}
            readOnly={readOnly}
          />
        </div>
      ) : (
        <div className="w-[460px] shrink-0 overflow-y-auto px-6 py-6">
          <div className="flex flex-col gap-1.5">
            {childIds.map((id) => (
              <TopicCard key={id} id={id} depth={0} readOnly={readOnly} />
            ))}
            {!readOnly && (
              <div className="relative mt-3 inline-block">
                <button
                  onClick={() => setAddMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-md border border-dashed border-line bg-transparent px-3 py-2 text-sm text-ink-muted hover:border-accent hover:text-accent"
                >
                  <Plus size={14} /> Add
                  <ChevronsUpDown size={12} />
                </button>
                <CreateMenu
                  open={addMenuOpen}
                  anchor="below-left"
                  onClose={() => setAddMenuOpen(false)}
                  onCreateSubcategory={handleAddSubcategory}
                  onCreate={(mode) => handleAddOfType(mode)}
                  onFile={handleAddFile}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({
  onAdd,
  onAddSubcategory,
  onAddFile,
  readOnly,
}: {
  onAdd: (mode: ViewMode) => void;
  onAddSubcategory: () => void;
  onAddFile: () => void;
  readOnly: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-panel">
        <Plus size={20} className="text-ink-soft" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink">
        Create a new subtopic
      </h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">
        Use additional subtopics to organize posts, files (PDF, Excel, CSV,
        images), and other subtopics within this workspace.
      </p>
      {!readOnly && (
        <div className="relative mt-4 inline-block">
          <button onClick={() => setMenuOpen((v) => !v)} className="btn btn-primary">
            <Plus size={14} /> Add subtopic
            <ChevronsUpDown size={12} />
          </button>
          <CreateMenu
            open={menuOpen}
            anchor="center"
            onClose={() => setMenuOpen(false)}
            onCreateSubcategory={onAddSubcategory}
            onCreate={(mode) => onAdd(mode)}
            onFile={onAddFile}
          />
        </div>
      )}
    </div>
  );
}

interface TopicCardProps {
  id: string;
  depth: number;
  readOnly: boolean;
}

function TopicCard({ id, depth, readOnly }: TopicCardProps) {
  const node = useStore((s) => s.nodes[id]);
  const subIds = useStore((s) => s.childrenByParent[id] ?? EMPTY_IDS);
  const selectNode = useStore((s) => s.selectNode);
  const createNode = useStore((s) => s.createNode);
  const createFileNode = useStore((s) => s.createFileNode);
  const deleteNode = useStore((s) => s.deleteNode);
  const renameNode = useStore((s) => s.renameNode);
  const setIcon = useStore((s) => s.setIcon);

  const [expanded, setExpanded] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isExternalDragOver: isCardDragOver, dropHandlers: cardDropHandlers } =
    useExternalFileDrop({
      onFiles: async (files) => {
        for (const file of files) {
          const upload = await fileToUpload(file);
          await createFileNode(id, upload);
        }
        setExpanded(true);
      },
    });

  if (!node) return null;

  const hasChildren = subIds.length > 0;
  const indent = depth * 28;

  const handleOpen = () => {
    if (renaming) return;
    selectNode(id);
  };

  const handleCreateOfType = async (viewMode: ViewMode) => {
    const titleByMode: Record<ViewMode, string> = {
      doc: "Untitled",
      canvas: "New map",
      mindmap: "New mindmap",
      split: "Untitled",
    };
    await createNode(id, titleByMode[viewMode], { select: false, viewMode });
    setExpanded(true);
  };

  const handleCreateSubcategory = async () => {
    // Subcategory is a container — opens the Map view of its children, not a doc editor.
    await createNode(id, "New section", { select: false, viewMode: "canvas" });
    setExpanded(true);
  };

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    let lastId: string | null = null;
    for (const file of Array.from(files)) {
      const upload = await fileToUpload(file);
      lastId = await createFileNode(id, upload);
    }
    setExpanded(true);
    if (files.length === 1 && lastId) selectNode(lastId);
    e.target.value = "";
  };

  const startRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setRenameValue(node.title);
    setRenaming(true);
  };

  const commitRename = () => {
    const next = renameValue.trim();
    if (next && next !== node.title) renameNode(id, next);
    setRenaming(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    setConfirmOpen(false);
    try {
      await deleteNode(id);
    } catch (err) {
      console.error("[ContentMap] delete failed:", err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.csv,.xlsx,.xls,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.svg,application/pdf,text/csv,text/plain,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        onChange={handleFiles}
        className="hidden"
      />
      <div
        {...cardDropHandlers}
        className={classNames(
          "group relative flex items-center gap-2 rounded-md border border-line bg-surface px-3 py-2.5 text-sm shadow-sm transition hover:border-ink-soft",
          isCardDragOver && "ring-1 ring-accent bg-accent/10",
        )}
        style={{ marginLeft: indent }}
        onClick={handleOpen}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setExpanded((v) => !v);
          }}
          className={classNames(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-soft hover:bg-bg-panel",
            !hasChildren && "invisible",
          )}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIconPickerOpen(true);
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-base hover:bg-bg-panel"
          title="Change icon"
        >
          {node.icon || "📄"}
        </button>

        {renaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            className="flex-1 min-w-0 bg-transparent text-sm font-medium text-ink outline-none"
          />
        ) : (
          <span
            className="flex-1 cursor-pointer truncate text-sm font-medium text-ink"
            onDoubleClick={startRename}
            title="Double-click to rename"
          >
            {node.title || "Untitled"}
          </span>
        )}

        {hasChildren && (
          <span className="rounded-full bg-bg-deep px-1.5 py-0.5 text-[10px] text-ink-muted">
            {subIds.length}
          </span>
        )}

        {!readOnly && (
          <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCreateMenuOpen((v) => !v);
                }}
                className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
                title="Add inside this card"
              >
                <Plus size={13} />
              </button>
              <CreateMenu
                open={createMenuOpen}
                anchor="below-right"
                onClose={() => setCreateMenuOpen(false)}
                onCreateSubcategory={handleCreateSubcategory}
                onCreate={(mode) => handleCreateOfType(mode)}
                onFile={handleAddFileClick}
              />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
              title="More"
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        )}

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="absolute right-2 top-10 z-20 w-44 overflow-hidden rounded-md border border-line bg-surface py-1 text-sm shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  handleOpen();
                }}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ink hover:bg-bg-panel"
              >
                Open
              </button>
              <button
                onClick={startRename}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-ink hover:bg-bg-panel"
              >
                <Edit3 size={13} /> Rename
              </button>
              <div className="my-1 border-t border-line" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-red-600 hover:bg-red-500/10"
              >
                <Trash2 size={13} /> Delete topic
              </button>
            </div>
          </>
        )}
      </div>

      {expanded && hasChildren && (
        <div className="mt-1.5 flex flex-col gap-1.5">
          {subIds.map((sid) => (
            <TopicCard
              key={sid}
              id={sid}
              depth={depth + 1}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}

      <EmojiPicker
        open={iconPickerOpen}
        current={node.icon}
        onSelect={(emoji) => {
          setIcon(id, emoji);
          setIconPickerOpen(false);
        }}
        onClear={() => {
          setIcon(id, null);
          setIconPickerOpen(false);
        }}
        onClose={() => setIconPickerOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${node.title}"?`}
        body={
          hasChildren
            ? "This will also delete all subtopics inside it. This cannot be undone."
            : "This cannot be undone."
        }
        confirmLabel="Delete"
        danger
        onConfirm={performDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={!!errorMsg}
        title="Delete failed"
        body={errorMsg ?? undefined}
        confirmLabel="OK"
        cancelLabel="Dismiss"
        onConfirm={() => setErrorMsg(null)}
        onCancel={() => setErrorMsg(null)}
      />
    </div>
  );
}
