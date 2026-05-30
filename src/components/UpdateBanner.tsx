import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { Download, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";

type Phase = "idle" | "available" | "downloading" | "installed" | "error";

export function UpdateBanner() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await check();
        if (cancelled) return;
        if (result) {
          setUpdate(result);
          setPhase("available");
        }
      } catch (e) {
        // Silently ignore — running in dev, offline, or no release published yet.
        console.warn("[updater] check failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!update || dismissed) return null;

  const install = async () => {
    setPhase("downloading");
    setError(null);
    try {
      let total = 0;
      let done = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          total = event.data.contentLength ?? 0;
          setProgress({ done: 0, total });
        } else if (event.event === "Progress") {
          done += event.data.chunkLength;
          setProgress({ done, total });
        } else if (event.event === "Finished") {
          setPhase("installed");
        }
      });
      await relaunch();
    } catch (e) {
      console.error("[updater] install failed", e);
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] w-80 rounded-lg border border-line bg-surface p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <Download size={18} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-ink">
            Update available — v{update.version}
          </h3>
          {update.body && (
            <p className="mt-1 max-h-24 overflow-y-auto whitespace-pre-wrap break-words text-xs text-ink-muted">
              {update.body}
            </p>
          )}
          {phase === "available" && (
            <div className="mt-3 flex gap-2">
              <button onClick={install} className="btn btn-primary">
                <Download size={13} /> Install & relaunch
              </button>
              <button onClick={() => setDismissed(true)} className="btn">
                Later
              </button>
            </div>
          )}
          {phase === "downloading" && (
            <div className="mt-3">
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Loader2 size={12} className="animate-spin" />
                Downloading
                {progress.total > 0 &&
                  ` ${Math.round((progress.done / progress.total) * 100)}%`}
              </div>
              {progress.total > 0 && (
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-deep">
                  <div
                    className="h-full bg-accent transition-all"
                    style={{ width: `${(progress.done / progress.total) * 100}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {phase === "installed" && (
            <p className="mt-3 text-xs text-ink-muted">Restarting…</p>
          )}
          {phase === "error" && (
            <div className="mt-3">
              <p className="text-xs text-red-600">{error}</p>
              <button onClick={() => setPhase("available")} className="btn mt-2">
                Try again
              </button>
            </div>
          )}
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
