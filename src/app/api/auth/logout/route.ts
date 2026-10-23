import { NextRequest, NextResponse } from "next/server";

const COOKIES_TO_CLEAR = [
  "smartup_session",
  "sid",
  "user_id",
  "system_user",
  "full_name",
  "user_image",
];

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });

  for (const cookieName of COOKIES_TO_CLEAR) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}

export async function GET(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  const response = NextResponse.redirect(loginUrl);

  for (const cookieName of COOKIES_TO_CLEAR) {
    response.cookies.set(cookieName, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
    });
  }

  return response;
}
