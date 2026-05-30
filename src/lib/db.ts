import Database from "@tauri-apps/plugin-sql";
import { v4 as uuid } from "uuid";
import type { AtlasNode, NodeKind, ShareLink } from "../types";

let dbPromise: Promise<Database> | null = null;

export function getDb(): Promise<Database> {
  if (!dbPromise) {
    dbPromise = Database.load("sqlite:dialogue-atlas.db");
  }
  return dbPromise;
}

const now = () => Date.now();

export async function listNodes(): Promise<AtlasNode[]> {
  const db = await getDb();
  return db.select<AtlasNode[]>(
    "SELECT * FROM nodes WHERE deleted_at IS NULL ORDER BY sort_order ASC, created_at ASC",
  );
}

export async function getNode(id: string): Promise<AtlasNode | null> {
  const db = await getDb();
  const rows = await db.select<AtlasNode[]>(
    "SELECT * FROM nodes WHERE id = $1 LIMIT 1",
    [id],
  );
  return rows[0] ?? null;
}

export async function createNode(input: {
  parent_id: string | null;
  title?: string;
  kind?: NodeKind;
  icon?: string | null;
  view_mode?: AtlasNode["view_mode"];
  file_mime?: string | null;
  file_name?: string | null;
  file_data?: string | null;
  file_size?: number | null;
}): Promise<AtlasNode> {
  const db = await getDb();
  const id = uuid();
  const ts = now();
  const node: AtlasNode = {
    id,
    parent_id: input.parent_id,
    title: input.title ?? "Untitled",
    kind: input.kind ?? "doc",
    icon: input.icon ?? null,
    sort_order: ts,
    doc_content: null,
    canvas_content: null,
    view_mode: input.view_mode ?? "doc",
    created_at: ts,
    updated_at: ts,
    deleted_at: null,
    remote_id: null,
    dirty: 1,
    file_mime: input.file_mime ?? null,
    file_name: input.file_name ?? null,
    file_data: input.file_data ?? null,
    file_size: input.file_size ?? null,
  };
  await db.execute(
    `INSERT INTO nodes (id, parent_id, title, kind, icon, sort_order, doc_content, canvas_content, view_mode, created_at, updated_at, dirty, file_mime, file_name, file_data, file_size)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,1,$12,$13,$14,$15)`,
    [
      node.id,
      node.parent_id,
      node.title,
      node.kind,
      node.icon,
      node.sort_order,
      node.doc_content,
      node.canvas_content,
      node.view_mode,
      node.created_at,
      node.updated_at,
      node.file_mime,
      node.file_name,
      node.file_data,
      node.file_size,
    ],
  );
  return node;
}

export async function updateNode(
  id: string,
  patch: Partial<
    Pick<
      AtlasNode,
      | "title"
      | "kind"
      | "icon"
      | "doc_content"
      | "canvas_content"
      | "view_mode"
      | "parent_id"
      | "sort_order"
      | "file_mime"
      | "file_name"
      | "file_data"
      | "file_size"
    >
  >,
): Promise<void> {
  const db = await getDb();
  const keys = Object.keys(patch) as (keyof typeof patch)[];
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
  const values = keys.map((k) => patch[k] as unknown);
  values.push(now());
  values.push(id);
  await db.execute(
    `UPDATE nodes SET ${sets}, updated_at = $${keys.length + 1}, dirty = 1 WHERE id = $${keys.length + 2}`,
    values,
  );
}

export async function softDeleteNode(id: string): Promise<void> {
  const db = await getDb();
  const ts = now();
  console.log("[softDeleteNode] deleting", id);
  const res = await db.execute(
    "UPDATE nodes SET deleted_at = $1, updated_at = $2, dirty = 1 WHERE id = $3",
    [ts, ts, id],
  );
  console.log("[softDeleteNode] result", res);
  if (res.rowsAffected === 0) {
    console.warn("[softDeleteNode] No rows affected for id:", id);
    throw new Error(
      `Delete failed: no rows matched id ${id}. The page may already be deleted.`,
    );
  }
  const children = await db.select<{ id: string }[]>(
    "SELECT id FROM nodes WHERE parent_id = $1 AND deleted_at IS NULL",
    [id],
  );
  console.log("[softDeleteNode] cascading to children:", children);
  for (const child of children) {
    await softDeleteNode(child.id);
  }
}

export async function reorderNodes(
  updates: { id: string; parent_id: string | null; sort_order: number }[],
): Promise<void> {
  const db = await getDb();
  const ts = now();
  for (const u of updates) {
    await db.execute(
      "UPDATE nodes SET parent_id = $1, sort_order = $2, updated_at = $3, dirty = 1 WHERE id = $4",
      [u.parent_id, u.sort_order, ts, u.id],
    );
  }
}

// --- Share links ---------------------------------------------------

export async function createShareLink(input: {
  node_id: string;
  recipient_email: string;
}): Promise<ShareLink> {
  const db = await getDb();
  const link: ShareLink = {
    id: uuid(),
    node_id: input.node_id,
    recipient_email: input.recipient_email,
    token: uuid().replace(/-/g, ""),
    created_at: now(),
    revoked_at: null,
  };
  await db.execute(
    "INSERT INTO share_links (id, node_id, recipient_email, token, created_at) VALUES ($1,$2,$3,$4,$5)",
    [link.id, link.node_id, link.recipient_email, link.token, link.created_at],
  );
  return link;
}

export async function listShareLinks(nodeId: string): Promise<ShareLink[]> {
  const db = await getDb();
  return db.select<ShareLink[]>(
    "SELECT * FROM share_links WHERE node_id = $1 AND revoked_at IS NULL ORDER BY created_at DESC",
    [nodeId],
  );
}

export async function revokeShareLink(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("UPDATE share_links SET revoked_at = $1 WHERE id = $2", [
    now(),
    id,
  ]);
}

// --- Settings (key/value) -----------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const db = await getDb();
  const rows = await db.select<{ value: string }[]>(
    "SELECT value FROM settings WHERE key = $1",
    [key],
  );
  return rows[0]?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    [key, value],
  );
}
