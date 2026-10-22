import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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
    const dashboardUrl = new URL("/", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

// Intercept all routes except Next.js internals, static assets, and media files
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|eot)$).*)",
  ],
};
