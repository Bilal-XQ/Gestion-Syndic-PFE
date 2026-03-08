import { createClient } from "@supabase/supabase-js";

/**
 * Admin Supabase client — uses the service_role key.
 * Bypasses RLS. Required for `auth.admin.createUser()` during
 * owner registration and seed scripts.
 *
 * Server-only — never import from Client Components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
