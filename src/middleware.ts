import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

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

export default process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  ? clerkMiddleware(async (auth, req) => {
      if (isProtectedRoute(req)) {
        await auth.protect();
      }
      if (isWidgetRoute(req)) {
        return withWidgetHeaders(NextResponse.next());
      }
    })
  : (req: NextRequest) => {
      if (isWidgetRoute(req)) {
        return withWidgetHeaders(NextResponse.next());
      }
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
