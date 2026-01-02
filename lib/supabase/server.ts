import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { type Database } from "@/database.types";
import { assertSupabasePublicEnv } from "@/lib/supabase/env";

export async function createClient() {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = assertSupabasePublicEnv();

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
