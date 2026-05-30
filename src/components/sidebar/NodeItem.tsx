import { useDraggable, useDroppable } from "@dnd-kit/core";
import {
  ChevronRight,
  FileText,
  Folder,
  Layout,
  MoreHorizontal,
  Network,
  Plus,
  SquareSplitHorizontal,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CreateMenu } from "../canvas/CreateMenu";
import { exportSubtreeAsPdf, exportSubtreeAsZip } from "../../lib/export";
import { fileToUpload, filterFilesBySize } from "../../lib/files";
import { isDescendant, useStore } from "../../lib/store";
import { useExternalFileDrop } from "../../lib/useExternalFileDrop";
import { classNames } from "../../lib/utils";
import type { ViewMode } from "../../types";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { EmojiPicker } from "../ui/EmojiPicker";
import { NodeTree } from "./NodeTree";

interface NodeItemProps {
  id: string;
  depth: number;
  filteredIds: string[] | null;
  draggingId: string | null;
}

export function NodeItem({ id, depth, filteredIds, draggingId }: NodeItemProps) {
  const node = useStore((s) => s.nodes[id]);
  const isSelected = useStore((s) => s.selectedId === id);
  const isExpanded = useStore((s) => !!s.expanded[id]);
  const hasChildren = useStore((s) => (s.childrenByParent[id]?.length ?? 0) > 0);
  const toggleExpanded = useStore((s) => s.toggleExpanded);
  const selectNode = useStore((s) => s.selectNode);
  const createNode = useStore((s) => s.createNode);
  const deleteNode = useStore((s) => s.deleteNode);
  const renameNode = useStore((s) => s.renameNode);
  const setIcon = useStore((s) => s.setIcon);
  const createFileNode = useStore((s) => s.createFileNode);
  const setExpanded = useStore((s) => s.setExpanded);

  const [menuOpen, setMenuOpen] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef: setDragRef,
    isDragging,
  } = useDraggable({ id, disabled: renaming });

  // Disable drop on self or any descendant
  const isDropDisabled = draggingId ? isDescendant(draggingId, id) : false;
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id,
    disabled: isDropDisabled,
  });

  const setRowRef = (el: HTMLDivElement | null) => {
    setDragRef(el);
    setDropRef(el);
  };

  const isDropTarget = isOver && draggingId && draggingId !== id && !isDropDisabled;

  const { isExternalDragOver, dropHandlers } = useExternalFileDrop({
    onFiles: async (rawFiles) => {
      const files = filterFilesBySize(rawFiles);
      if (files.length === 0) return;
      for (const file of files) {
        const upload = await fileToUpload(file);
        await createFileNode(id, upload);
      }
      setExpanded(id, true);
    },
  });

  useEffect(() => {
    if (renaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [renaming]);

  if (!node) return null;

  const handleCreateSubcategory = async () => {
    await createNode(id, "New section", { select: false, viewMode: "canvas" });
    setExpanded(id, true);
  };

  const handleCreateOfType = async (viewMode: ViewMode) => {
    const titleByMode: Record<ViewMode, string> = {
      doc: "Untitled",
      canvas: "New map",
      mindmap: "New mindmap",
      split: "Untitled",
    };
    await createNode(id, titleByMode[viewMode], { select: false, viewMode });
    setExpanded(id, true);
  };

  const handleAddFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSidebar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    const files = filterFilesBySize(Array.from(fileList));
    if (files.length === 0) {
      e.target.value = "";
      return;
    }
    for (const file of files) {
      const upload = await fileToUpload(file);
      await createFileNode(id, upload);
    }
    setExpanded(id, true);
    e.target.value = "";
  };

  const handleDelete = () => {
    setMenuOpen(false);
    setConfirmOpen(true);
  };

  const performDelete = async () => {
    setConfirmOpen(false);
    setDeleteError(null);
    try {
      await deleteNode(id);
    } catch (e) {
      console.error("[NodeItem] delete failed:", e);
      setDeleteError(e instanceof Error ? e.message : String(e));
    }
  };

  const startRename = () => {
    setMenuOpen(false);
    setRenameValue(node.title);
    setRenaming(true);
  };

  const commitRename = () => {
    const next = renameValue.trim();
    if (next && next !== node.title) renameNode(id, next);
    setRenaming(false);
  };

  const cancelRename = () => {
    setRenameValue(node.title);
    setRenaming(false);
  };

  // Pick a sidebar icon based on what the node IS — but a user-set emoji icon
  // always wins (handled below in the render).
  const Icon = (() => {
    if (node.kind === "file") return FileText;
    if (node.kind === "folder" || node.kind === "segment") return Folder;
    if (hasChildren) return Folder;
    switch (node.view_mode) {
      case "canvas":
        return Layout;
      case "mindmap":
        return Network;
      case "split":
        return SquareSplitHorizontal;
      case "doc":
      default:
        return FileText;
    }
  })();

  return (
    <li>
      <div
        ref={setRowRef}
        {...attributes}
        {...listeners}
        {...dropHandlers}
        onClick={() => {
          if (renaming) return;
          // Containers (nodes with children) — click toggles expand/collapse only.
          // Leaf nodes (doc, file, leaf map/mindmap) — click selects to open in workspace.
          if (hasChildren) {
            toggleExpanded(id);
          } else {
            selectNode(id);
          }
        }}
        onDoubleClick={(e) => {
          // Double-click always opens in workspace, even on containers
          e.stopPropagation();
          if (!renaming) selectNode(id);
        }}
        className={classNames(
          "group relative flex cursor-pointer items-center gap-1 rounded-md py-1 pr-1 text-sm",
          isSelected
            ? "bg-bg-deep text-ink"
            : "text-ink-muted hover:bg-bg-deep/60 hover:text-ink",
          isDragging && "opacity-30",
          isDropTarget && "ring-1 ring-accent bg-accent/10",
          isExternalDragOver && "ring-1 ring-accent bg-accent/10",
        )}
        style={{ paddingLeft: depth * 12 + 6 }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) toggleExpanded(id);
          }}
          className={classNames(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded text-ink-soft",
            hasChildren ? "hover:bg-bg" : "invisible",
          )}
        >
          <ChevronRight
            size={12}
            className={classNames(
              "transition-transform duration-150 ease-out",
              isExpanded && "rotate-90",
            )}
          />
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIconPickerOpen(true);
          }}
          title="Double-click to change icon"
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-ink-soft hover:bg-bg-panel"
        >
          {node.icon ? (
            <span className="text-sm leading-none">{node.icon}</span>
          ) : (
            <Icon size={13} />
          )}
        </button>

        {renaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={commitRename}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") cancelRename();
            }}
            className="flex-1 min-w-0 bg-transparent text-sm text-ink outline-none"
          />
        ) : (
          <span
            className="flex-1 truncate"
            onDoubleClick={(e) => {
              e.stopPropagation();
              startRename();
            }}
            title="Double-click to rename"
          >
            {node.title || "Untitled"}
          </span>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="hidden h-5 w-5 items-center justify-center rounded text-ink-soft hover:bg-bg group-hover:flex"
          title="More"
        >
          <MoreHorizontal size={13} />
        </button>
        <div className="relative hidden group-hover:flex">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCreateMenuOpen((v) => !v);
            }}
            className="flex h-5 w-5 items-center justify-center rounded text-ink-soft hover:bg-bg"
            title="Add child page"
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
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.csv,.xlsx,.xls,.txt,.md,.png,.jpg,.jpeg,.gif,.webp,.svg,.docx,.doc,application/pdf,text/csv,text/plain,image/*"
          onChange={handleFilesSidebar}
          className="hidden"
        />

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
              }}
            />
            <div className="atlas-menu-in absolute right-1 top-7 z-20 w-44 overflow-hidden rounded-md border border-line bg-surface py-1 text-sm shadow-lg">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  startRename();
                }}
                className="block w-full px-3 py-1.5 text-left text-ink hover:bg-bg-panel"
              >
                Rename
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  setIconPickerOpen(true);
                }}
                className="block w-full px-3 py-1.5 text-left text-ink hover:bg-bg-panel"
              >
                Change icon
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  void handleCreateSubcategory();
                }}
                className="block w-full px-3 py-1.5 text-left text-ink hover:bg-bg-panel"
              >
                Add subcategory
              </button>
              <div className="my-1 border-t border-line" />
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  try {
                    await exportSubtreeAsZip(id);
                  } catch (err) {
                    setExportError(err instanceof Error ? err.message : String(err));
                  }
                }}
                className="block w-full px-3 py-1.5 text-left text-ink hover:bg-bg-panel"
              >
                Export as ZIP…
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  try {
                    await exportSubtreeAsPdf(id);
                  } catch (err) {
                    setExportError(err instanceof Error ? err.message : String(err));
                  }
                }}
                className="block w-full px-3 py-1.5 text-left text-ink hover:bg-bg-panel"
              >
                Export as PDF…
              </button>
              <div className="my-1 border-t border-line" />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-500/10"
              >
                Delete
              </button>
            </div>
          </>
        )}
      </div>
      {(isExpanded || filteredIds) && hasChildren && (
        <NodeTree
          parentId={id}
          depth={depth + 1}
          filteredIds={filteredIds}
          draggingId={draggingId}
        />
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
            ? "This will also delete all sub-pages inside it. This cannot be undone (you can recover from the database file)."
            : "This cannot be undone."
        }
        confirmLabel="Delete"
        danger
        onConfirm={performDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <ConfirmDialog
        open={!!deleteError}
        title="Delete failed"
        body={deleteError ?? undefined}
        confirmLabel="OK"
        cancelLabel="Dismiss"
        onConfirm={() => setDeleteError(null)}
        onCancel={() => setDeleteError(null)}
      />
      <ConfirmDialog
        open={!!exportError}
        title="Export failed"
        body={exportError ?? undefined}
        confirmLabel="OK"
        cancelLabel="Dismiss"
        onConfirm={() => setExportError(null)}
        onCancel={() => setExportError(null)}
      />
    </li>
  );
}
