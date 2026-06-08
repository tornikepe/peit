import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
const isWidgetRoute    = createRouteMatcher(["/widget(.*)", "/widget.js"]);

// Widget pages are loaded inside iframes on third-party sites — explicitly
// allow it via CSP. Other pages keep the default frame-deny posture.
function withWidgetHeaders(res: NextResponse): NextResponse {
  res.headers.set('Content-Security-Policy', "frame-ancestors *");
  // Do NOT set X-Frame-Options here — modern browsers honor CSP frame-ancestors
  // and X-Frame-Options can't express "anywhere".
  return res;
}

// NOTE: Next.js 16 deprecates the "middleware" file convention in favour
// of proxy.ts, but renaming this file to proxy.ts caused every request
// on Vercel to 500 ("Error running the exported function") even though
// the build + local dev both passed. Clerk 7.3.4 says it supports proxy
// in src/server/fs/middleware-location.js, but the runtime wrapper
// doesn't actually start. Keeping middleware.ts until either Clerk or
// Next.js fix the integration — the deprecation is a warning, not a
// breaking change.
//
// ALWAYS register clerkMiddleware. The previous build had a conditional
// (`process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? clerk : passthrough`)
// that silently broke `auth()` in server components when the env var
// wasn't visible to the build — Clerk's SDK then can't detect its
// middleware and throws the cryptic "Clerk can't detect usage of
// clerkMiddleware()" error.
//
// clerkMiddleware itself reads env vars at request time (not import time),
// so registering it unconditionally is safe even in environments without
// Clerk keys — the SDK then returns a clear "Missing publishable key"
// error from auth() instead of the confusing detect-failure one.
export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  if (isWidgetRoute(req)) {
    return withWidgetHeaders(NextResponse.next());
  }

  // Every non-widget response: deny cross-origin framing (clickjacking
  // protection). The widget is the only surface allowed to be embedded.
  const res = NextResponse.next();
  res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  res.headers.set('Content-Security-Policy', "frame-ancestors 'self'");

  // Attribution capture: a ?ref=<code> on any public link (e.g. the shared
  // /signup?ref=tornike-x7k2) is stored in a 30-day cookie. Lazy user
  // provisioning later reads it to credit the referrer. Literal cookie name —
  // middleware runs on the edge and must not import DB code.
  const ref = req.nextUrl.searchParams.get('ref');
  if (ref) {
    res.cookies.set('peit_ref', ref.trim().toLowerCase().slice(0, 40), {
      httpOnly: true, sameSite: 'lax', secure: true, path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
