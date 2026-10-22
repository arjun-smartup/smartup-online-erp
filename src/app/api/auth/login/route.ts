import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const CONFIGURED_API_KEY = process.env.FRAPPE_API_KEY;
const CONFIGURED_API_SECRET = process.env.FRAPPE_API_SECRET;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { usr, pwd, authMode } = body;

    // 1. Quick Sign-In with configured API Key & Secret
    if (authMode === "api_key" && CONFIGURED_API_KEY && CONFIGURED_API_SECRET) {
      const verifyRes = await fetch(
        `${FRAPPE_URL.replace(/\/$/, "")}/api/method/frappe.auth.get_logged_user`,
        {
          method: "GET",
          headers: {
            Authorization: `token ${CONFIGURED_API_KEY}:${CONFIGURED_API_SECRET}`,
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      if (verifyRes.ok) {
        const data = await verifyRes.json();
        const loggedUser = data.message || "apikey@gmail.com";
        return createAuthSessionResponse(loggedUser, loggedUser, "api_token_session");
      }
    }

    if (!usr || !pwd) {
      return NextResponse.json(
        { success: false, message: "Please provide both username/email and password" },
        { status: 400 }
      );
    }

    // 2. Test standard Frappe username/password login
    const frappeRes = await fetch(`${FRAPPE_URL.replace(/\/$/, "")}/api/method/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ usr: usr.trim(), pwd: pwd.trim() }),
    });

    const data = await frappeRes.json().catch(() => ({}));

    if (frappeRes.ok) {
      const rawSetCookie = frappeRes.headers.get("set-cookie") || "";
      const sidMatch = rawSetCookie.match(/sid=([^;]+)/);
      const sid = sidMatch ? sidMatch[1] : "";
      return createAuthSessionResponse(usr.trim(), data.full_name || usr.trim(), sid);
    }

    // 3. Fallback: Check if user passed an API Key and API Secret
    const apiVerifyRes = await fetch(
      `${FRAPPE_URL.replace(/\/$/, "")}/api/method/frappe.auth.get_logged_user`,
      {
        method: "GET",
        headers: {
          Authorization: `token ${usr.trim()}:${pwd.trim()}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    if (apiVerifyRes.ok) {
      const apiData = await apiVerifyRes.json();
      const verifiedEmail = apiData.message || usr.trim();
      return createAuthSessionResponse(verifiedEmail, verifiedEmail, "api_token_session");
    }

    return NextResponse.json(
      {
        success: false,
        message: data.message || "Invalid login credentials. Please check your Frappe user or password.",
      },
      { status: 401 }
    );
  } catch (error: any) {
    console.error("Login API Error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Failed to communicate with Frappe authentication server",
      },
      { status: 500 }
    );
  }
}

function createAuthSessionResponse(email: string, fullName: string, sid: string) {
  const userSession = {
    email,
    fullName,
    sid,
    loginTime: new Date().toISOString(),
    frappeUrl: FRAPPE_URL,
  };

  const response = NextResponse.json({
    success: true,
    message: "Authentication successful",
    user: {
      email,
      fullName,
    },
  });

  response.cookies.set("smartup_session", JSON.stringify(userSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  if (sid) {
    response.cookies.set("sid", sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }

  return response;
}
