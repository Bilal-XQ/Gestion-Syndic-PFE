import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Creates a Supabase client scoped to the middleware request/response cycle.
 * Refreshes the auth session by calling `supabase.auth.getUser()`.
 *
 * Returns the Supabase client, the refreshed user, and the (possibly
 * mutated) NextResponse so the caller can continue adding headers or
 * redirects before returning it.
 *
 * Never instantiate a Supabase client anywhere except the three
 * utility files: client.ts, server.ts, middleware.ts.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Do not call supabase.auth.getSession() here.
  // getUser() contacts the Supabase Auth server to revalidate the
  // session. getSession() only reads from the cookie (unverified).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user, supabaseResponse };
}
