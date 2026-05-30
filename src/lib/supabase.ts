import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSetting } from "./db";

let client: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (client) return client;
  const url = await getSetting("supabase_url");
  const key = await getSetting("supabase_anon_key");
  if (!url || !key) return null;
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

export function resetSupabase() {
  client = null;
}
