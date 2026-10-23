import { NextRequest, NextResponse } from "next/server";
import { UserSessionData } from "@/lib/types/auth";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("smartup_session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const userSession: UserSessionData = JSON.parse(sessionCookie);

    if (!userSession.primaryRole || !userSession.permissions) {
      return NextResponse.json(
        { authenticated: false, message: "Access Restricted: No role assigned" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: userSession.email,
        fullName: userSession.fullName,
        roles: userSession.roles || [],
        primaryRole: userSession.primaryRole,
        permissions: userSession.permissions,
        loginTime: userSession.loginTime,
        frappeUrl: userSession.frappeUrl,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
