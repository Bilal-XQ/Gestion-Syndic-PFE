import { type NextRequest, NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { updateSession } from "@/utils/supabase/middleware";

// ---------------------------------------------------------------------------
// Rate limiter — 5 attempts / 60 s sliding window on the login route.
// Constructed lazily so the app still boots when Upstash env vars are absent
// (e.g. in local dev without Redis).
// ---------------------------------------------------------------------------
let ratelimit: Ratelimit | null = null;

function getRatelimiter(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    ratelimit = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "60 s"),
      prefix: "syndic:login",
    });
  }
  return ratelimit;
}

// ---------------------------------------------------------------------------
// Auth-protected route prefixes
// ---------------------------------------------------------------------------
const SYNDIC_PREFIX = "/dashboard";
const OWNER_PREFIXES = ["/portal", "/payments", "/notifications"];
const LOGIN_PATH = "/login";

function isOwnerRoute(pathname: string): boolean {
  return OWNER_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Rate-limit the login route (POST only — form submissions)
  if (pathname === LOGIN_PATH && request.method === "POST") {
    const limiter = getRatelimiter();
    if (limiter) {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
      const { success, limit, remaining, reset } = await limiter.limit(ip);

      if (!success) {
        return new NextResponse("Trop de tentatives. Réessayez plus tard.", {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        });
      }
    }
  }

  // 2. Refresh session & get user (token refresh is handled inside updateSession)
  const { user, supabaseResponse } = await updateSession(request);

  // 3. Unauthenticated users trying to access protected routes → login
  const isProtected =
    pathname.startsWith(SYNDIC_PREFIX) || isOwnerRoute(pathname);

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("redirectedFrom", pathname);
    return NextResponse.redirect(url);
  }

  // 4. Role-based route protection (JWT only — no DB query)
  if (user) {
    const role = user.app_metadata?.user_role as
      | "syndic"
      | "proprietaire"
      | undefined;

    // Syndic-only routes
    if (pathname.startsWith(SYNDIC_PREFIX) && role !== "syndic") {
      const url = request.nextUrl.clone();
      url.pathname = role === "proprietaire" ? "/portal" : LOGIN_PATH;
      return NextResponse.redirect(url);
    }

    // Owner-only routes
    if (isOwnerRoute(pathname) && role !== "proprietaire") {
      const url = request.nextUrl.clone();
      url.pathname = role === "syndic" ? SYNDIC_PREFIX : LOGIN_PATH;
      return NextResponse.redirect(url);
    }

    // Authenticated users hitting /login → redirect to their home
    if (pathname === LOGIN_PATH) {
      const url = request.nextUrl.clone();
      url.pathname = role === "syndic" ? SYNDIC_PREFIX : "/portal";
      return NextResponse.redirect(url);
    }
  }

  // 5. Return the (possibly cookie-mutated) response
  return supabaseResponse;
}

// ---------------------------------------------------------------------------
// Matcher — skip static files and Next.js internals
// ---------------------------------------------------------------------------
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - public folder assets
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
