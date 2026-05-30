import { FileText, Layout, X } from "lucide-react";
import { useState } from "react";
import { classNames } from "../../lib/utils";

export type WorkspaceKind = "classic" | "segments";

interface NewWorkspaceDialogProps {
  open: boolean;
  onCreate: (kind: WorkspaceKind, title: string) => void;
  onCancel: () => void;
}

export function NewWorkspaceDialog({
  open,
  onCreate,
  onCancel,
}: NewWorkspaceDialogProps) {
  const [kind, setKind] = useState<WorkspaceKind>("classic");
  const [title, setTitle] = useState("");

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = title.trim() || (kind === "segments" ? "New segments" : "New workspace");
    onCreate(kind, name);
    setTitle("");
    setKind("classic");
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">Create new workspace</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 px-4 py-4 sm:grid-cols-2">
          <KindCard
            active={kind === "classic"}
            icon={<FileText size={18} />}
            title="Classic"
            description="Hierarchy in sidebar, rich documents in the main pane. Like Notion."
            onClick={() => setKind("classic")}
          />
          <KindCard
            active={kind === "segments"}
            icon={<Layout size={18} />}
            title="Segments"
            description="Map/cards in the main pane. Drag categories, attach files (PDF, Excel, CSV) and edit them inline."
            onClick={() => setKind("segments")}
          />
        </div>

        <div className="border-t border-line px-4 py-3">
          <label className="block text-xs font-medium text-ink-muted">
            Workspace name
          </label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === "segments" ? "e.g. Dialogue System" : "e.g. Marketing"}
            className="input mt-1"
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-line bg-bg-panel/40 px-4 py-3">
          <button type="button" onClick={onCancel} className="btn">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}

interface KindCardProps {
  active: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}

function KindCard({ active, icon, title, description, onClick }: KindCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={classNames(
        "flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition",
        active
          ? "border-accent bg-accent/10"
          : "border-line bg-bg-panel/50 hover:border-ink-soft",
      )}
    >
      <span
        className={classNames(
          "flex h-8 w-8 items-center justify-center rounded-md",
          active ? "bg-accent text-white" : "bg-bg-deep text-ink-muted",
        )}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold text-ink">{title}</span>
      <span className="text-xs text-ink-muted">{description}</span>
    </button>
  );
}
