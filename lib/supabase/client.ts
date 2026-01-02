import { createBrowserClient } from "@supabase/ssr";
import { type Database } from "@/database.types";
import { assertSupabasePublicEnv } from "@/lib/supabase/env";

export function createClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = assertSupabasePublicEnv();
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
