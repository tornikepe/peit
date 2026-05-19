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

// File renamed from middleware.ts to proxy.ts for Next.js 16 — the
// "middleware" file convention is deprecated; proxy.ts is the same
// runtime under a clearer name.
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
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
