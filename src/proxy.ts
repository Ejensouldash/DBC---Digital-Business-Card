import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth/server";

const intlMiddleware = createIntlMiddleware(routing);

// Paths (without locale prefix) that need a signed-in user. Admin role is checked in the admin layout.
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/activate"];
// Set by Neon Auth when a social sign-in returns to the app; the auth middleware exchanges it for a session.
const OAUTH_VERIFIER_PARAM = "neon_auth_session_verifier";

function splitLocale(pathname: string): { locale: string; path: string } {
  const [, first = ""] = pathname.split("/");
  const isLocale = (routing.locales as readonly string[]).includes(first);
  if (!isLocale) return { locale: routing.defaultLocale, path: pathname };
  return { locale: first, path: pathname.slice(first.length + 1) || "/" };
}

function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export default async function proxy(request: NextRequest) {
  const { pathname, search, searchParams } = request.nextUrl;
  const { locale, path } = splitLocale(pathname);

  if (!isProtected(path) && !searchParams.has(OAUTH_VERIFIER_PARAM)) {
    return intlMiddleware(request);
  }

  const loginPath = locale === routing.defaultLocale ? "/login" : `/${locale}/login`;
  const loginUrl = `${loginPath}?next=${encodeURIComponent(pathname + search)}`;
  const authResponse = await auth.middleware({ loginUrl })(request);
  if (authResponse.headers.has("location")) return authResponse;

  // Signed in: continue with locale routing, keeping any refreshed session cookies.
  const response = intlMiddleware(request);
  for (const cookie of authResponse.headers.getSetCookie()) {
    response.headers.append("set-cookie", cookie);
  }
  return response;
}

export const config = {
  // Everything except API routes, the NFC entry point and static files.
  matcher: ["/((?!api|c/|_next|_vercel|.*\\..*).*)"],
};
