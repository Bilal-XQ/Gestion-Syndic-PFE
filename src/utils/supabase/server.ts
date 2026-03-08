import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server Supabase client — for Server Components, Server Actions,
 * and Route Handlers.
 *
 * `cookies()` in Next.js 16 returns a Promise, so this helper is async.
 * The `setAll` handler writes back refreshed auth tokens to the
 * response automatically via `cookieStore.set(...)`.
 *
 * Never instantiate a Supabase client anywhere except the three
 * utility files: client.ts, server.ts, middleware.ts.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method is called from a Server Component where
            // cookies cannot be set. This can be ignored if you have
            // middleware that refreshes user sessions.
          }
        },
      },
    }
  );
}
