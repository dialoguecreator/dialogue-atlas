import { ExternalLink, Loader2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { setSetting } from "../../lib/db";
import {
  AiNotConfiguredError,
  type AiGraph,
  generateMindmap,
  getAiKey,
} from "../../lib/aiMindmap";

interface AiMindmapDialogProps {
  open: boolean;
  onClose: () => void;
  onResult: (graph: AiGraph) => void;
}

const EXAMPLE_PROMPTS = [
  "Customer onboarding flow for our agency: lead → first call → contract → kickoff",
  "Decision flow for handling a complaint from a Bumble user",
  "Mindmap of skills a new chatter needs to learn in their first month",
  "Hiring process for a new supervisor — from posting the job to first day",
];

export function AiMindmapDialog({ open, onClose, onResult }: AiMindmapDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [savingKey, setSavingKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    getAiKey().then((k) => setHasKey(!!k));
    setError(null);
  }, [open]);

  if (!open) return null;

  const saveKey = async () => {
    if (!apiKey.trim()) return;
    setSavingKey(true);
    await setSetting("anthropic_api_key", apiKey.trim());
    setHasKey(true);
    setApiKey("");
    setSavingKey(false);
  };

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const graph = await generateMindmap(prompt);
      onResult(graph);
      setPrompt("");
      onClose();
    } catch (e) {
      if (e instanceof AiNotConfiguredError) {
        setHasKey(false);
        setError("Please set your Anthropic API key first.");
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-lg border border-line bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-ink">
              Generate mindmap with AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>

        {!hasKey ? (
          <div className="px-5 py-4">
            <h3 className="text-sm font-semibold text-ink">
              First-time setup
            </h3>
            <p className="mt-1 text-xs text-ink-muted">
              Paste your Anthropic API key. It's stored locally on this Mac (in
              your SQLite database) and never sent anywhere except directly to
              Anthropic. Get a key at{" "}
              <a
                href="https://console.anthropic.com"
                target="_blank"
                rel="noreferrer"
                className="text-accent underline"
              >
                console.anthropic.com
                <ExternalLink size={10} className="ml-0.5 inline" />
              </a>
              .
            </p>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-…"
              className="input mt-3"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={onClose} className="btn">
                Cancel
              </button>
              <button
                onClick={saveKey}
                disabled={savingKey || !apiKey.trim()}
                className="btn btn-primary disabled:opacity-50"
              >
                {savingKey ? "Saving…" : "Save key"}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 py-4">
            <label className="block text-xs font-medium text-ink-muted">
              Describe the mindmap or flowchart you want
            </label>
            <textarea
              autoFocus
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Customer onboarding flow for our agency"
              rows={4}
              className="input mt-1 resize-none font-sans"
            />

            <div className="mt-3">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
                Examples
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EXAMPLE_PROMPTS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPrompt(p)}
                    className="rounded-md border border-line bg-bg-panel px-2 py-1 text-[11px] text-ink-muted hover:border-accent hover:text-accent"
                  >
                    {p.length > 60 ? p.slice(0, 60) + "…" : p}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="mt-3 rounded-md border border-red-200 bg-red-50/40 px-3 py-2 text-xs text-red-700">
                {error}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setHasKey(false)}
                className="text-[11px] text-ink-soft hover:text-ink"
              >
                Change API key
              </button>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn">
                  Cancel
                </button>
                <button
                  onClick={generate}
                  disabled={loading || !prompt.trim()}
                  className="btn btn-primary disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles size={13} />
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
