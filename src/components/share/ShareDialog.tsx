import { Copy, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  createShareLink,
  listShareLinks,
  revokeShareLink,
} from "../../lib/db";
import { useStore } from "../../lib/store";
import type { ShareLink } from "../../types";
import { formatRelativeTime } from "../../lib/utils";

interface ShareDialogProps {
  nodeId: string;
  onClose: () => void;
}

const VIEW_BASE_URL =
  (import.meta.env.VITE_VIEW_BASE_URL as string | undefined) ||
  "https://atlas.dialogue.app/view";

export function ShareDialog({ nodeId, onClose }: ShareDialogProps) {
  const node = useStore((s) => s.nodes[nodeId]);
  const [email, setEmail] = useState("");
  const [links, setLinks] = useState<ShareLink[]>([]);
  const [creating, setCreating] = useState(false);

  const refresh = async () => {
    const rows = await listShareLinks(nodeId);
    setLinks(rows);
  };

  useEffect(() => {
    refresh();
  }, [nodeId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setCreating(true);
    await createShareLink({ node_id: nodeId, recipient_email: email.trim() });
    setEmail("");
    setCreating(false);
    refresh();
  };

  const handleRevoke = async (id: string) => {
    if (!confirm("Revoke this share link?")) return;
    await revokeShareLink(id);
    refresh();
  };

  const handleCopy = (link: ShareLink) => {
    const url = `${VIEW_BASE_URL}/${link.token}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="atlas-overlay-in fixed inset-0 z-50 flex items-center justify-center bg-[var(--c-overlay)] backdrop-blur-sm p-4">
      <div className="atlas-dialog-in w-full max-w-lg rounded-xl border border-line bg-surface shadow-atlas-lg">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold">Share view-only link</h2>
            <p className="text-xs text-ink-muted">
              {node?.title ?? "Untitled"}
            </p>
          </div>
          <button onClick={onClose} className="rounded p-1 hover:bg-bg-panel">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <form onSubmit={handleCreate} className="flex gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@dialogue.app"
              className="input flex-1"
            />
            <button
              type="submit"
              disabled={creating}
              className="btn btn-primary disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create link"}
            </button>
          </form>

          <p className="mt-2 text-[11px] leading-relaxed text-ink-soft">
            Recipients open the link in a browser. The page is watermarked with
            their email and access is logged. Note: screenshots cannot be
            technically prevented on macOS — watermarking deters but does not
            block them.
          </p>

          <div className="mt-5">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
              Active links ({links.length})
            </h3>
            {links.length === 0 && (
              <p className="text-xs text-ink-muted">No active share links.</p>
            )}
            <ul className="flex flex-col gap-2">
              {links.map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-md border border-line bg-bg-panel px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {l.recipient_email}
                    </div>
                    <div className="text-[11px] text-ink-soft">
                      Created {formatRelativeTime(l.created_at)} · token{" "}
                      <code className="text-[10px]">
                        {l.token.slice(0, 8)}…
                      </code>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(l)}
                      className="rounded p-1.5 text-ink-soft hover:bg-bg hover:text-ink"
                      title="Copy link"
                    >
                      <Copy size={13} />
                    </button>
                    <button
                      onClick={() => handleRevoke(l.id)}
                      className="rounded p-1.5 text-ink-soft hover:bg-red-50 hover:text-red-600"
                      title="Revoke"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
