import {
  Download,
  FileCode,
  FileText,
  Image,
  Layout,
  Network,
  PencilLine,
  Printer,
  Share2,
  SquareSplitHorizontal,
} from "lucide-react";
import { useState } from "react";
import {
  exportDocAsHtml,
  exportDocAsMarkdown,
  exportDocAsPdf,
  exportMindmapAsPng,
  exportMindmapAsSvg,
} from "../../lib/export";
import { useStore } from "../../lib/store";
import { classNames } from "../../lib/utils";
import type { ViewMode } from "../../types";
import { EmojiPicker } from "../ui/EmojiPicker";

interface NodeHeaderProps {
  nodeId: string;
  onShareClick: () => void;
}

const VIEW_OPTIONS: Array<{ value: ViewMode; label: string; icon: typeof PencilLine }> = [
  { value: "doc", label: "Doc", icon: PencilLine },
  { value: "canvas", label: "Map", icon: Layout },
  { value: "mindmap", label: "Mindmap", icon: Network },
  { value: "split", label: "Split", icon: SquareSplitHorizontal },
];

export function NodeHeader({ nodeId, onShareClick }: NodeHeaderProps) {
  const node = useStore((s) => s.nodes[nodeId]);
  const renameNode = useStore((s) => s.renameNode);
  const setIcon = useStore((s) => s.setIcon);
  const setViewMode = useStore((s) => s.setViewMode);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!node) return null;

  const runExport = async (fn: () => Promise<void>) => {
    setExportError(null);
    setExportOpen(false);
    try {
      await fn();
    } catch (e) {
      setExportError(e instanceof Error ? e.message : String(e));
    }
  };

  // Build export options based on what kind of content this node is
  const exportOptions: Array<{
    label: string;
    description: string;
    icon: typeof FileText;
    run: () => Promise<void>;
  }> = [];

  if (node.kind === "file") {
    // Files have their own Download button in the viewer — skip header export.
  } else {
    if (node.view_mode === "doc" || node.view_mode === "split") {
      exportOptions.push(
        {
          label: "PDF",
          description: "Opens print dialog → Save as PDF",
          icon: Printer,
          run: () => exportDocAsPdf(node),
        },
        {
          label: "Markdown (.md)",
          description: "Plain-text version of the doc",
          icon: FileText,
          run: () => exportDocAsMarkdown(node),
        },
        {
          label: "HTML",
          description: "Standalone .html file",
          icon: FileCode,
          run: () => exportDocAsHtml(node),
        },
      );
    }
    if (node.view_mode === "mindmap") {
      exportOptions.push(
        {
          label: "PNG image",
          description: "Bitmap export of the whole canvas",
          icon: Image,
          run: () => exportMindmapAsPng(node),
        },
        {
          label: "SVG",
          description: "Scalable vector image",
          icon: FileCode,
          run: () => exportMindmapAsSvg(node),
        },
      );
    }
  }

  return (
    <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-line px-10 py-4">
      <div className="flex flex-1 items-center gap-3">
        <button
          onClick={() => setIconPickerOpen(true)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-xl hover:bg-bg-panel"
          title="Click to change icon"
        >
          {node.icon ?? "📄"}
        </button>
        <EmojiPicker
          open={iconPickerOpen}
          current={node.icon}
          onSelect={(emoji) => {
            setIcon(node.id, emoji);
            setIconPickerOpen(false);
          }}
          onClear={() => {
            setIcon(node.id, null);
            setIconPickerOpen(false);
          }}
          onClose={() => setIconPickerOpen(false)}
        />
        <input
          value={node.title}
          onChange={(e) => renameNode(node.id, e.target.value)}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-[22px] font-semibold tracking-[-0.015em] leading-tight outline-none placeholder:text-ink-soft"
        />
      </div>

      <div className="flex items-center gap-1.5">
        {node.kind !== "file" && (
          <div className="flex items-center rounded-md border border-line bg-surface p-0.5">
            {VIEW_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = node.view_mode === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setViewMode(node.id, opt.value)}
                  className={classNames(
                    "flex items-center gap-1 rounded px-2 py-1 text-xs transition",
                    active
                      ? "bg-bg-deep text-ink"
                      : "text-ink-muted hover:text-ink",
                  )}
                >
                  <Icon size={12} />
                  {opt.label}
                </button>
              );
            })}
          </div>
        )}

        {exportOptions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="btn"
              title="Export this page"
            >
              <Download size={14} />
              <span className="text-xs">Export</span>
            </button>
            {exportOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setExportOpen(false)}
                />
                <div className="atlas-menu-in absolute right-0 top-full z-40 mt-1 w-64 overflow-hidden rounded-md border border-line bg-surface py-1 text-sm shadow-lg">
                  <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                    Export as
                  </div>
                  {exportOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.label}
                        onClick={() => runExport(opt.run)}
                        className="flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-bg-panel"
                      >
                        <Icon size={14} className="mt-0.5 shrink-0 text-ink-muted" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-ink">
                            {opt.label}
                          </div>
                          <div className="text-[11px] leading-snug text-ink-muted">
                            {opt.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        <button
          onClick={onShareClick}
          className="btn"
          title="Share view-only link"
        >
          <Share2 size={14} />
          <span className="text-xs">Share</span>
        </button>
      </div>

      {exportError && (
        <div className="absolute left-12 right-12 top-full z-40 mt-1 rounded-md border border-red-200 bg-red-50/40 px-3 py-2 text-xs text-red-700 dark:bg-red-500/10">
          {exportError}
          <button
            onClick={() => setExportError(null)}
            className="ml-2 underline"
          >
            dismiss
          </button>
        </div>
      )}
    </div>
  );
}
