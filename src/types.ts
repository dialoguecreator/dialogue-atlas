export type NodeKind = "folder" | "doc" | "canvas" | "segment" | "file";
export type ViewMode = "doc" | "canvas" | "mindmap" | "split";

export interface AtlasNode {
  id: string;
  parent_id: string | null;
  title: string;
  kind: NodeKind;
  icon: string | null;
  sort_order: number;
  doc_content: string | null;
  canvas_content: string | null;
  view_mode: ViewMode;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
  remote_id: string | null;
  dirty: number;
  file_mime: string | null;
  file_name: string | null;
  file_data: string | null;
  file_size: number | null;
}

export interface ShareLink {
  id: string;
  node_id: string;
  recipient_email: string;
  token: string;
  created_at: number;
  revoked_at: number | null;
}

export interface AppSettings {
  supabase_url?: string;
  supabase_anon_key?: string;
  sync_enabled?: boolean;
  user_email?: string;
  user_id?: string;
}
