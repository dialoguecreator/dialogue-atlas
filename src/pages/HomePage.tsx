import { useEffect } from "react";
import { Sidebar } from "../components/sidebar/Sidebar";
import { TitleBar } from "../components/TitleBar";
import { Workspace } from "../components/workspace/Workspace";
import { useStore } from "../lib/store";

export function HomePage() {
  const init = useStore((s) => s.init);
  const ready = useStore((s) => s.ready);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="flex h-full flex-col">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        {ready ? (
          <>
            <Sidebar />
            <Workspace />
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-ink-muted">
            Loading workspace…
          </div>
        )}
      </div>
    </div>
  );
}
