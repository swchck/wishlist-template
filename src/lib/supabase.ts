import type { SupabaseClient } from "@supabase/supabase-js";

const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const rawUrl = import.meta.env.PUBLIC_SUPABASE_URL as string | undefined;
const url = rawUrl
  ?.trim()
  .replace(/\/+$/, "")
  .replace(/\/rest\/v1$/, "")
  .replace(/\/+$/, "");

let clientPromise: Promise<SupabaseClient | null> | null = null;

export function getSupabase(): Promise<SupabaseClient | null> {
  if (!url || !anonKey) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import("@supabase/supabase-js").then(({ createClient }) =>
      createClient(url, anonKey, { auth: { persistSession: false } }),
    );
  }
  return clientPromise;
}
