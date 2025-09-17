// lib/supabaseBrowser.ts
"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * These MUST be set in your environment (and be NEXT_PUBLIC_ so they are exposed
 * to the browser). In Vercel: Project → Settings → Environment Variables.
 *
 * NEXT_PUBLIC_SUPABASE_URL       = https://xxxxxxxxxxxx.supabase.co
 * NEXT_PUBLIC_SUPABASE_ANON_KEY  = <anon key>
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase env. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
}

/**
 * Browser factory. Use this inside client components/pages:
 *   const sb = useMemo(() => createBrowserSupabaseClient(), []);
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
}

export type { SupabaseClient };
