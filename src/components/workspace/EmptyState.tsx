import { FileText, Layout, Plus, Share2 } from "lucide-react";
import { useState } from "react";
import { useStore } from "../../lib/store";
import { NewWorkspaceDialog, type WorkspaceKind } from "../sidebar/NewWorkspaceDialog";

export function EmptyState() {
  const createWorkspace = useStore((s) => s.createWorkspace);
  const [open, setOpen] = useState(false);

  const handleCreate = (kind: WorkspaceKind, title: string) => {
    setOpen(false);
    createWorkspace(kind, title);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center px-12 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-ink">
        Welcome to Dialogue Atlas
      </h1>
      <p className="mt-3 max-w-md text-sm text-ink-muted">
        Internal documentation, brainstorming and flowcharts for the Dialogue
        agency. Create a page on the left to get started.
      </p>

      <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 text-left sm:grid-cols-3">
        <Tile
          icon={<FileText size={18} />}
          title="Rich documents"
          body="Notion-style blocks, headings, tables, checklists and slash menu."
        />
        <Tile
          icon={<Layout size={18} />}
          title="Canvas + flowcharts"
          body="Drag blocks, draw arrows, build mindmaps and flowcharts on an infinite canvas."
        />
        <Tile
          icon={<Share2 size={18} />}
          title="View-only sharing"
          body="Send read-only links of specific SOPs to teammates. Watermarked."
        />
      </div>

      <button onClick={() => setOpen(true)} className="btn btn-primary mt-8">
        <Plus size={14} />
        Create your first workspace
      </button>

      <NewWorkspaceDialog
        open={open}
        onCreate={handleCreate}
        onCancel={() => setOpen(false)}
      />
    </div>
  );
}

function Tile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-bg-panel text-ink">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-ink-muted">{body}</p>
    </div>
  );
}
