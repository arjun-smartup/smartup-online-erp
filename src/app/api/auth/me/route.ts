import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get("smartup_session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  try {
    const userSession = JSON.parse(sessionCookie);
    return NextResponse.json({
      authenticated: true,
      user: {
        email: userSession.email,
        fullName: userSession.fullName,
        loginTime: userSession.loginTime,
        frappeUrl: userSession.frappeUrl,
      },
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
