// lib/supabaseBrowser.ts
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Factory used by client components/pages.
 * Matches imports like:  import { createBrowserSupabaseClient } from "@/lib/supabaseBrowser";
 */
export function createBrowserSupabaseClient(): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Singleton client for simple modules that import { supabase } directly.
 * Matches imports like:  import { supabase } from "@/lib/supabaseBrowser";
 */
export const supabase: SupabaseClient = createBrowserSupabaseClient();

export type { SupabaseClient };
