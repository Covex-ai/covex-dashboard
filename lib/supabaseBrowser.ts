// lib/supabaseBrowser.ts
import { createClient } from "@supabase/supabase-js";

// Pull credentials from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Export a single browser client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
