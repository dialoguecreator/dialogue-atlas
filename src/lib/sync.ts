import { create } from "zustand";
import { getDb, getSetting, setSetting } from "./db";
import { getSupabase } from "./supabase";
import type { AtlasNode } from "../types";

const TABLE = "atlas_nodes";
const PERIODIC_INTERVAL_MS = 30_000;
const PUSH_DEBOUNCE_MS = 1_500;

export interface SyncReport {
  pushed: number;
  pulled: number;
  ok: boolean;
  message?: string;
}

interface SyncStore {
  enabled: boolean;
  signedInEmail: string | null;
  lastSyncAt: number | null;
  lastError: string | null;
  isSyncing: boolean;
  init: () => Promise<void>;
  setEnabled: (next: boolean) => Promise<void>;
  triggerSync: () => void;
  syncNow: () => Promise<SyncReport>;
  signOut: () => Promise<void>;
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let periodicTimer: ReturnType<typeof setInterval> | null = null;
let onChangeRefreshFn: (() => void) | null = null;

export function registerSyncReloadHook(fn: () => void) {
  onChangeRefreshFn = fn;
}

export const useSync = create<SyncStore>((set, get) => ({
  enabled: false,
  signedInEmail: null,
  lastSyncAt: null,
  lastError: null,
  isSyncing: false,

  init: async () => {
    const enabledStr = await getSetting("sync_enabled");
    const enabled = enabledStr === "true";
    const email = await getSetting("user_email");
    const lastSyncStr = await getSetting("last_sync");
    set({
      enabled,
      signedInEmail: email,
      lastSyncAt: lastSyncStr ? Number(lastSyncStr) : null,
    });
    if (enabled) startPeriodic();
  },

  setEnabled: async (next) => {
    await setSetting("sync_enabled", String(next));
    set({ enabled: next });
    if (next) startPeriodic();
    else stopPeriodic();
  },

  triggerSync: () => {
    if (!get().enabled) return;
    if (pushTimer) clearTimeout(pushTimer);
    pushTimer = setTimeout(() => {
      void get().syncNow();
    }, PUSH_DEBOUNCE_MS);
  },

  syncNow: async () => {
    if (get().isSyncing) {
      return { pushed: 0, pulled: 0, ok: true };
    }
    set({ isSyncing: true });
    try {
      const report = await runOneSync();
      set({
        isSyncing: false,
        lastSyncAt: Date.now(),
        lastError: report.ok ? null : report.message ?? "Sync failed",
      });
      if (report.pulled > 0 && onChangeRefreshFn) onChangeRefreshFn();
      return report;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      set({ isSyncing: false, lastError: msg });
      return { pushed: 0, pulled: 0, ok: false, message: msg };
    }
  },

  signOut: async () => {
    const supabase = await getSupabase();
    if (supabase) {
      await supabase.auth.signOut();
    }
    await setSetting("sync_enabled", "false");
    set({ enabled: false, signedInEmail: null });
    stopPeriodic();
  },
}));

function startPeriodic() {
  if (periodicTimer) clearInterval(periodicTimer);
  periodicTimer = setInterval(() => {
    void useSync.getState().syncNow();
  }, PERIODIC_INTERVAL_MS);
  // Trigger an initial pull shortly after start so the UI is fresh on launch
  setTimeout(() => useSync.getState().syncNow(), 500);
}

function stopPeriodic() {
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
  if (pushTimer) {
    clearTimeout(pushTimer);
    pushTimer = null;
  }
}

async function runOneSync(): Promise<SyncReport> {
  const supabase = await getSupabase();
  if (!supabase) {
    return { pushed: 0, pulled: 0, ok: false, message: "Supabase not configured" };
  }
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return { pushed: 0, pulled: 0, ok: false, message: "Not signed in" };
  }

  const db = await getDb();

  // --- Push dirty rows ---
  const dirty = await db.select<AtlasNode[]>(
    "SELECT * FROM nodes WHERE dirty = 1 LIMIT 200",
  );

  let pushed = 0;
  if (dirty.length > 0) {
    const payload = dirty.map((n) => ({
      id: n.id,
      parent_id: n.parent_id,
      title: n.title,
      kind: n.kind,
      icon: n.icon,
      sort_order: n.sort_order,
      doc_content: n.doc_content,
      canvas_content: n.canvas_content,
      view_mode: n.view_mode,
      file_mime: n.file_mime,
      file_name: n.file_name,
      file_data: n.file_data,
      file_size: n.file_size,
      deleted_at: n.deleted_at,
      created_at: n.created_at,
      updated_at: n.updated_at,
      owner: userData.user.id,
    }));
    const { error } = await supabase.from(TABLE).upsert(payload);
    if (error) {
      return { pushed: 0, pulled: 0, ok: false, message: error.message };
    }
    // Clear dirty flags
    const ids = dirty.map((n) => n.id);
    const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
    await db.execute(
      `UPDATE nodes SET dirty = 0 WHERE id IN (${placeholders})`,
      ids,
    );
    pushed = dirty.length;
  }

  // --- Pull remote changes since last_sync ---
  const lastSyncRow = await db.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = 'last_sync'",
  );
  const lastSync = lastSyncRow[0]?.value ? Number(lastSyncRow[0].value) : 0;

  const { data: remote, error } = await supabase
    .from(TABLE)
    .select("*")
    .gt("updated_at", lastSync)
    .order("updated_at", { ascending: true })
    .limit(500);
  if (error) {
    return { pushed, pulled: 0, ok: false, message: error.message };
  }

  let pulled = 0;
  for (const r of remote ?? []) {
    await db.execute(
      `INSERT INTO nodes (id, parent_id, title, kind, icon, sort_order, doc_content, canvas_content, view_mode, file_mime, file_name, file_data, file_size, deleted_at, created_at, updated_at, dirty)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,0)
       ON CONFLICT(id) DO UPDATE SET
         parent_id = excluded.parent_id,
         title = excluded.title,
         kind = excluded.kind,
         icon = excluded.icon,
         sort_order = excluded.sort_order,
         doc_content = excluded.doc_content,
         canvas_content = excluded.canvas_content,
         view_mode = excluded.view_mode,
         file_mime = excluded.file_mime,
         file_name = excluded.file_name,
         file_data = excluded.file_data,
         file_size = excluded.file_size,
         deleted_at = excluded.deleted_at,
         updated_at = excluded.updated_at,
         dirty = 0
       WHERE excluded.updated_at > nodes.updated_at`,
      [
        r.id,
        r.parent_id,
        r.title,
        r.kind,
        r.icon,
        r.sort_order,
        r.doc_content,
        r.canvas_content,
        r.view_mode,
        r.file_mime,
        r.file_name,
        r.file_data,
        r.file_size,
        r.deleted_at,
        r.created_at ?? r.updated_at,
        r.updated_at,
      ],
    );
    pulled += 1;
  }

  await setSetting("last_sync", String(Date.now()));
  return { pushed, pulled, ok: true };
}

// Back-compat single-call sync for the title-bar sync button
export async function syncOnce(): Promise<SyncReport> {
  return useSync.getState().syncNow();
}
