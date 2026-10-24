import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { UserSessionData } from "@/lib/types/auth";

// Public routes accessible without authentication
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/frappe/health",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Verify SmartUp session or Frappe sid cookie
  const sessionCookie = request.cookies.get("smartup_session")?.value;
  const sidCookie = request.cookies.get("sid")?.value;
  const isAuthenticated = Boolean(sessionCookie || sidCookie);

  // Check if current route is explicitly public
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  // 1. Unauthenticated users accessing protected routes -> Redirect directly to /login
  if (!isAuthenticated && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Authenticated users attempting to visit /login -> Redirect to Dashboard
  if (isAuthenticated && pathname === "/login") {
    // If user has an explicit no_role error query, let them view /login
    if (request.nextUrl.searchParams.get("error") === "no_role") {
      const res = NextResponse.next();
      res.cookies.delete("smartup_session");
      res.cookies.delete("sid");
      return res;
    }
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  // 3. Role-Based Route Protection for authenticated users
  if (isAuthenticated && sessionCookie) {
    try {
      const userSession: UserSessionData = JSON.parse(sessionCookie);

      // Block users without an authorized primary role
      if (!userSession.primaryRole) {
        const loginUrl = new URL("/login?error=no_role", request.url);
        const res = NextResponse.redirect(loginUrl);
        res.cookies.delete("smartup_session");
        res.cookies.delete("sid");
        return res;
      }

      const isSalesUser = userSession.primaryRole === "Sales User";
      const canViewFees = userSession.permissions?.canViewFees ?? !isSalesUser;
      const canViewSettings = userSession.permissions?.canViewSystemStatus ?? !isSalesUser;

      // Fees & Collections: Protected for Director and Operations roles
      if (!canViewFees && (pathname === "/fees" || pathname.startsWith("/fees/"))) {
        const redirectUrl = new URL("/students?access=restricted_fees", request.url);
        return NextResponse.redirect(redirectUrl);
      }

      // Frappe System & Cloud Settings: Protected for Director and Operations roles
      if (!canViewSettings && (pathname === "/settings" || pathname.startsWith("/settings/"))) {
        const redirectUrl = new URL("/students?access=restricted_settings", request.url);
        return NextResponse.redirect(redirectUrl);
      }
    } catch {
      // If parsing fails, allow standard flow
    }
  }

  return NextResponse.next();
}

// Intercept all routes except Next.js internals, static assets, and media files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$).*)",
  ],
};
