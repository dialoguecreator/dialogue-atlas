import { Cloud, CloudOff, KeyRound, Loader2, LogOut, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { getSetting, setSetting } from "../lib/db";
import { useStore } from "../lib/store";
import { getSupabase, resetSupabase } from "../lib/supabase";
import { useSync } from "../lib/sync";
import { classNames, formatRelativeTime } from "../lib/utils";

declare const APP_VERSION: string;

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "sync" | "ai" | "about";

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const [tab, setTab] = useState<Tab>("sync");
  if (!open) return null;
  return (
    <div
      className="atlas-overlay-in fixed inset-0 z-[120] flex items-center justify-center bg-[var(--c-overlay)] backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="atlas-dialog-in flex h-[560px] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-atlas-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="text-sm font-semibold text-ink">Settings</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-soft hover:bg-bg-panel hover:text-ink"
          >
            <X size={14} />
          </button>
        </div>
        <div className="flex flex-1 overflow-hidden">
          <nav className="w-44 shrink-0 border-r border-line bg-bg-panel/40 p-2 text-sm">
            <TabButton current={tab} value="sync" label="Sync" onClick={setTab} />
            <TabButton current={tab} value="ai" label="AI" onClick={setTab} />
            <TabButton current={tab} value="about" label="About" onClick={setTab} />
          </nav>
          <div className="flex-1 overflow-y-auto p-5">
            {tab === "sync" && <SyncTab />}
            {tab === "ai" && <AiTab />}
            {tab === "about" && <AboutTab />}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  current,
  value,
  label,
  onClick,
}: {
  current: Tab;
  value: Tab;
  label: string;
  onClick: (v: Tab) => void;
}) {
  return (
    <button
      onClick={() => onClick(value)}
      className={classNames(
        "block w-full rounded px-2 py-1.5 text-left text-sm",
        current === value
          ? "bg-bg-deep text-ink"
          : "text-ink-muted hover:bg-bg-deep hover:text-ink",
      )}
    >
      {label}
    </button>
  );
}

function SyncTab() {
  const enabled = useSync((s) => s.enabled);
  const email = useSync((s) => s.signedInEmail);
  const lastSyncAt = useSync((s) => s.lastSyncAt);
  const lastError = useSync((s) => s.lastError);
  const isSyncing = useSync((s) => s.isSyncing);
  const setEnabled = useSync((s) => s.setEnabled);
  const syncNow = useSync((s) => s.syncNow);
  const signOut = useSync((s) => s.signOut);
  const reloadStore = useStore((s) => s.init);

  const [step, setStep] = useState<"status" | "configure" | "signin">("status");
  const [supaUrl, setSupaUrl] = useState("");
  const [supaKey, setSupaKey] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const u = await getSetting("supabase_url");
      const k = await getSetting("supabase_anon_key");
      setSupaUrl(u ?? "");
      setSupaKey(k ?? "");
    })();
  }, []);

  const saveSupabase = async () => {
    setBusy(true);
    setError(null);
    await setSetting("supabase_url", supaUrl.trim());
    await setSetting("supabase_anon_key", supaKey.trim());
    resetSupabase();
    setBusy(false);
    setStep("signin");
  };

  const signIn = async () => {
    setBusy(true);
    setError(null);
    const supabase = await getSupabase();
    if (!supabase) {
      setError("Supabase not configured.");
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: authPassword,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await setSetting("user_email", authEmail);
    await setEnabled(true);
    setStep("status");
    // Pull immediately
    await syncNow();
    await reloadStore();
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h3 className="text-base font-semibold text-ink">Cloud sync</h3>
        <p className="mt-1 text-xs text-ink-muted">
          Sync your workspace to Supabase so you and Bojan see the same content
          on both Macs. Everything stays end-to-end private to your Supabase
          project.
        </p>
      </header>

      {step === "status" && (
        <>
          <div className="rounded-md border border-line bg-bg-panel/40 p-4">
            <div className="flex items-center gap-3">
              {enabled ? (
                <Cloud size={20} className="text-accent" />
              ) : (
                <CloudOff size={20} className="text-ink-soft" />
              )}
              <div className="flex-1">
                <div className="text-sm font-medium text-ink">
                  {enabled ? "Sync is on" : "Local only — sync is off"}
                </div>
                <div className="mt-0.5 text-xs text-ink-muted">
                  {enabled ? (
                    <>
                      Signed in as {email ?? "—"}.
                      {lastSyncAt
                        ? ` Last sync ${formatRelativeTime(lastSyncAt)}.`
                        : " Not synced yet."}
                    </>
                  ) : (
                    "Turn on sync to connect to your Supabase project."
                  )}
                </div>
                {lastError && (
                  <div className="mt-1 text-xs text-red-600">{lastError}</div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {enabled ? (
                <>
                  <button
                    onClick={() => syncNow()}
                    disabled={isSyncing}
                    className="btn"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 size={13} className="animate-spin" /> Syncing…
                      </>
                    ) : (
                      <>
                        <RefreshCw size={13} /> Sync now
                      </>
                    )}
                  </button>
                  <button onClick={() => signOut()} className="btn">
                    <LogOut size={13} /> Sign out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setStep(supaUrl ? "signin" : "configure")}
                  className="btn btn-primary"
                >
                  <Cloud size={13} /> Set up sync
                </button>
              )}
            </div>
          </div>

          <details className="rounded-md border border-line p-3 text-xs">
            <summary className="cursor-pointer text-ink">
              Initial Supabase setup steps (run once)
            </summary>
            <ol className="mt-2 list-decimal pl-5 leading-relaxed text-ink-muted">
              <li>
                Create a free project at{" "}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline"
                >
                  supabase.com
                </a>
                .
              </li>
              <li>
                In <b>SQL Editor</b>, paste the SQL from the project README
                (creates the <code>atlas_nodes</code> table + RLS policies).
              </li>
              <li>
                In <b>Authentication → Users</b>, add accounts for you and
                Bojan (email + password).
              </li>
              <li>
                In <b>SQL Editor</b>, insert your two user IDs into{" "}
                <code>atlas_workspace_members</code> (see README).
              </li>
              <li>
                In <b>Project Settings → API</b>, copy the Project URL and the{" "}
                <code>anon</code> public key. Paste them on the next screen.
              </li>
            </ol>
          </details>
        </>
      )}

      {step === "configure" && (
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-ink-muted">
            Project URL
          </label>
          <input
            value={supaUrl}
            onChange={(e) => setSupaUrl(e.target.value)}
            placeholder="https://xxxx.supabase.co"
            className="input"
          />
          <label className="mt-2 text-xs font-medium text-ink-muted">
            Anon public key
          </label>
          <input
            value={supaKey}
            onChange={(e) => setSupaKey(e.target.value)}
            placeholder="eyJhbGciOi…"
            className="input"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button onClick={() => setStep("status")} className="btn">
              Cancel
            </button>
            <button
              onClick={saveSupabase}
              disabled={busy || !supaUrl || !supaKey}
              className="btn btn-primary disabled:opacity-50"
            >
              Save & continue
            </button>
          </div>
        </div>
      )}

      {step === "signin" && (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-ink-muted">
            Sign in with the email/password you added in Supabase Authentication.
          </p>
          <input
            type="email"
            value={authEmail}
            onChange={(e) => setAuthEmail(e.target.value)}
            placeholder="email"
            className="input"
          />
          <input
            type="password"
            value={authPassword}
            onChange={(e) => setAuthPassword(e.target.value)}
            placeholder="password"
            className="input"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex justify-between gap-2">
            <button onClick={() => setStep("configure")} className="btn">
              Reconfigure
            </button>
            <button
              onClick={signIn}
              disabled={busy}
              className="btn btn-primary disabled:opacity-50"
            >
              {busy ? "Signing in…" : "Sign in"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AiTab() {
  const [key, setKey] = useState("");
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSetting("anthropic_api_key").then((k) => setHasKey(!!k));
  }, []);

  const save = async () => {
    setSaving(true);
    await setSetting("anthropic_api_key", key.trim());
    setHasKey(!!key.trim());
    setKey("");
    setSaving(false);
  };

  const clear = async () => {
    await setSetting("anthropic_api_key", "");
    setHasKey(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h3 className="text-base font-semibold text-ink">AI mindmap key</h3>
        <p className="mt-1 text-xs text-ink-muted">
          The "Generate with AI" button in Mindmap mode uses your Anthropic API
          key. Stored locally on this Mac, never sent anywhere except directly
          to Anthropic.
        </p>
      </header>
      <div className="flex items-center gap-2 rounded-md border border-line bg-bg-panel/40 p-3 text-sm">
        <KeyRound size={16} className={hasKey ? "text-accent" : "text-ink-soft"} />
        {hasKey ? "Key is set." : "No key yet."}
      </div>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="sk-ant-…"
        className="input"
      />
      <div className="flex justify-end gap-2">
        {hasKey && (
          <button onClick={clear} className="btn">
            Remove key
          </button>
        )}
        <button
          onClick={save}
          disabled={saving || !key.trim()}
          className="btn btn-primary disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save key"}
        </button>
      </div>
      <p className="text-[11px] text-ink-soft">
        Get a key at{" "}
        <a
          href="https://console.anthropic.com"
          target="_blank"
          rel="noreferrer"
          className="text-accent underline"
        >
          console.anthropic.com
        </a>
        .
      </p>
    </div>
  );
}

function AboutTab() {
  const version = APP_VERSION;
  return (
    <div className="flex flex-col gap-3 text-sm">
      <h3 className="text-base font-semibold text-ink">Dialogue Atlas</h3>
      <p className="text-xs text-ink-muted">
        Internal documentation, brainstorming and flowcharts for Dialogue
        agency.
      </p>
      <div className="rounded-md border border-line bg-bg-panel/40 p-3 text-xs">
        Version {version} · Built for Daniel and Bojan
      </div>
    </div>
  );
}
