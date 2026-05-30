import { Cloud, KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { getSetting, setSetting } from "../../lib/db";
import { getSupabase, resetSupabase } from "../../lib/supabase";

interface AuthGateProps {
  onReady: () => void;
}

export function AuthGate({ onReady }: AuthGateProps) {
  const [mode, setMode] = useState<"local" | "configure" | "signin">("local");
  const [supaUrl, setSupaUrl] = useState("");
  const [supaKey, setSupaKey] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const enabled = await getSetting("sync_enabled");
      if (enabled !== "true") return;
      const supabase = await getSupabase();
      if (!supabase) {
        setMode("configure");
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        onReady();
      } else {
        setMode("signin");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const useLocalOnly = async () => {
    await setSetting("sync_enabled", "false");
    onReady();
  };

  const saveConfigAndContinue = async () => {
    setError(null);
    setBusy(true);
    await setSetting("supabase_url", supaUrl.trim());
    await setSetting("supabase_anon_key", supaKey.trim());
    await setSetting("sync_enabled", "true");
    resetSupabase();
    setBusy(false);
    setMode("signin");
  };

  const signIn = async () => {
    setError(null);
    setBusy(true);
    const supabase = await getSupabase();
    if (!supabase) {
      setError("Supabase not configured.");
      setBusy(false);
      return;
    }
    const { error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (err) {
      setError(err.message);
      return;
    }
    await setSetting("user_email", email);
    onReady();
  };

  return (
    <div className="flex h-full items-center justify-center bg-bg p-8">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Dialogue Atlas</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Internal docs + canvas for Dialogue agency.
        </p>

        {mode === "local" && (
          <div className="mt-6 space-y-3">
            <button
              onClick={() => setMode("configure")}
              className="flex w-full items-center gap-3 rounded-md border border-line bg-bg-panel px-4 py-3 text-left hover:border-accent"
            >
              <Cloud size={18} className="text-accent" />
              <div>
                <div className="text-sm font-medium">
                  Set up cloud sync (recommended)
                </div>
                <div className="text-xs text-ink-muted">
                  Sync across devices and share with Bojan via Supabase.
                </div>
              </div>
            </button>
            <button
              onClick={useLocalOnly}
              className="flex w-full items-center gap-3 rounded-md border border-line bg-surface px-4 py-3 text-left hover:border-line"
            >
              <KeyRound size={18} className="text-ink-muted" />
              <div>
                <div className="text-sm font-medium">Use local only for now</div>
                <div className="text-xs text-ink-muted">
                  Everything stays on this Mac. Add sync later in Settings.
                </div>
              </div>
            </button>
          </div>
        )}

        {mode === "configure" && (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-ink-muted">
              Paste your Supabase project URL and anon key. See README for the
              one-time setup steps.
            </p>
            <input
              placeholder="https://xxxx.supabase.co"
              value={supaUrl}
              onChange={(e) => setSupaUrl(e.target.value)}
              className="input"
            />
            <input
              placeholder="anon public key"
              value={supaKey}
              onChange={(e) => setSupaKey(e.target.value)}
              className="input"
            />
            <div className="flex gap-2">
              <button onClick={() => setMode("local")} className="btn">
                Back
              </button>
              <button
                onClick={saveConfigAndContinue}
                disabled={busy || !supaUrl || !supaKey}
                className="btn btn-primary disabled:opacity-50"
              >
                Save & continue
              </button>
            </div>
          </div>
        )}

        {mode === "signin" && (
          <div className="mt-6 space-y-3">
            <input
              type="email"
              placeholder="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
            />
            <input
              type="password"
              placeholder="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
            />
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setMode("configure")} className="btn">
                Reconfigure
              </button>
              <button
                onClick={signIn}
                disabled={busy}
                className="btn btn-primary disabled:opacity-50"
              >
                Sign in
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
