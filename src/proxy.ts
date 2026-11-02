import { NextResponse, type NextRequest } from "next/server";

import { auth } from "@/lib/auth/server";

// Paths that need a signed-in user. Admin role is checked in the admin layout.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/activate"];
// Set by Neon Auth when a social sign-in returns to the app; the auth middleware exchanges it for a session.
const OAUTH_VERIFIER_PARAM = "neon_auth_session_verifier";

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  if (!isProtected(pathname) && !searchParams.has(OAUTH_VERIFIER_PARAM)) {
    return NextResponse.next();
  }

  // Redirects to login when signed out; otherwise passes through with refreshed session cookies.
  const loginUrl = `/login?next=${encodeURIComponent(pathname + search)}`;
  return auth.middleware({ loginUrl })(request);
}

export const config = {
  // Everything except API routes, the NFC entry point and static files.
  matcher: ["/((?!api|c/|_next|_vercel|.*\\..*).*)"],
};
