import {
  FileText,
  FolderPlus,
  Layout,
  Network,
  Paperclip,
  SquareSplitHorizontal,
} from "lucide-react";
import type { ViewMode } from "../../types";

interface CreateMenuProps {
  open: boolean;
  /** Anchor: where to position. "top-right" places below the trigger right-aligned. */
  anchor?: "below-right" | "below-left" | "center";
  onClose: () => void;
  /** Default subcategory: same view_mode as the parent. */
  onCreateSubcategory: () => void;
  onCreate: (viewMode: ViewMode) => void;
  onFile: () => void;
}

interface MenuItem {
  key: string;
  icon: typeof FileText;
  label: string;
  description: string;
  onClick: () => void;
  separatorBefore?: boolean;
}

export function CreateMenu({
  open,
  anchor = "below-right",
  onClose,
  onCreateSubcategory,
  onCreate,
  onFile,
}: CreateMenuProps) {
  if (!open) return null;

  const items: MenuItem[] = [
    {
      key: "subcategory",
      icon: FolderPlus,
      label: "Subcategory",
      description: "Opens as a writable Doc — start typing right away.",
      onClick: onCreateSubcategory,
    },
    {
      key: "doc",
      icon: FileText,
      label: "Doc",
      description: "Rich text page (Notion-style blocks).",
      onClick: () => onCreate("doc"),
      separatorBefore: true,
    },
    {
      key: "map",
      icon: Layout,
      label: "Map",
      description: "Slab-style categories and subcategories.",
      onClick: () => onCreate("canvas"),
    },
    {
      key: "mindmap",
      icon: Network,
      label: "Mindmap",
      description: "Freeform boxes connected by arrows.",
      onClick: () => onCreate("mindmap"),
    },
    {
      key: "split",
      icon: SquareSplitHorizontal,
      label: "Split",
      description: "Doc on the left, Map on the right.",
      onClick: () => onCreate("split"),
    },
    {
      key: "file",
      icon: Paperclip,
      label: "File",
      description: "Upload PDF, Excel, CSV, image, …",
      onClick: onFile,
      separatorBefore: true,
    },
  ];

  const positionClass =
    anchor === "below-left"
      ? "left-0"
      : anchor === "center"
        ? "left-1/2 -translate-x-1/2"
        : "right-0";

  return (
    <>
      <div
        className="fixed inset-0 z-30"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className={`absolute top-full mt-1 z-40 w-56 overflow-hidden rounded-md border border-line bg-surface py-1 text-sm shadow-lg ${positionClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
          Add to this page
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.key}>
              {item.separatorBefore && <div className="my-1 border-t border-line" />}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                  item.onClick();
                }}
                className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-bg-panel"
              >
                <Icon size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink">{item.label}</div>
                  <div className="text-[11px] leading-snug text-ink-muted">
                    {item.description}
                  </div>
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}
