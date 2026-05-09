import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";

/** Routes that require authentication. */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/compose",
  "/queue",
  "/library",
  "/apps",
  "/safety",
  "/settings",
  "/connections",
  "/analytics",
  "/reports",
  "/inbox",
  "/listening",
];

/** Routes that should bounce signed-in users back to /dashboard. */
const PUBLIC_AUTH_ROUTES = ["/login"];

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  const email = verifySessionToken(token);

  if (PUBLIC_AUTH_ROUTES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    if (email) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  if (
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  ) {
    if (email) return NextResponse.next();
    const next = encodeURIComponent(pathname + req.nextUrl.search);
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
