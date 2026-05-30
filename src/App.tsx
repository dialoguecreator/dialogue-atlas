import { useEffect, useState } from "react";
import { AuthGate } from "./components/auth/AuthGate";
import { UpdateBanner } from "./components/UpdateBanner";
import { HomePage } from "./pages/HomePage";
import { getSetting } from "./lib/db";
import { useStore } from "./lib/store";
import { getSupabase } from "./lib/supabase";
import { registerSyncReloadHook, useSync } from "./lib/sync";
import { useTheme } from "./lib/theme";
import { usePasteFiles } from "./lib/usePasteFiles";

type Phase = "boot" | "gate" | "ready";

export default function App() {
  const [phase, setPhase] = useState<Phase>("boot");
  const initTheme = useTheme((s) => s.init);
  const initSync = useSync((s) => s.init);
  const reloadStore = useStore((s) => s.init);
  usePasteFiles();

  useEffect(() => {
    initTheme();
    initSync();
    // When sync pulls in remote rows, refresh the in-memory store
    registerSyncReloadHook(() => {
      void reloadStore();
    });
  }, [initTheme, initSync, reloadStore]);

  useEffect(() => {
    (async () => {
      const enabled = await getSetting("sync_enabled");
      if (enabled === null) {
        setPhase("gate");
        return;
      }
      if (enabled === "false") {
        setPhase("ready");
        return;
      }
      const supabase = await getSupabase();
      if (!supabase) {
        setPhase("gate");
        return;
      }
      const { data } = await supabase.auth.getSession();
      setPhase(data.session ? "ready" : "gate");
    })();
  }, []);

  if (phase === "boot") {
    return (
      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
        Starting…
      </div>
    );
  }

  if (phase === "gate") {
    return (
      <>
        <AuthGate onReady={() => setPhase("ready")} />
        <UpdateBanner />
      </>
    );
  }

  return (
    <>
      <HomePage />
      <UpdateBanner />
    </>
  );
}
