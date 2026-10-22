import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartup.m.frappe.cloud";
const FRAPPE_API_KEY = process.env.FRAPPE_API_KEY;
const FRAPPE_API_SECRET = process.env.FRAPPE_API_SECRET;

/**
 * SmartUp Secure Frappe REST API Proxy
 * - Appends Server-Side API Key & Secret
 * - Enforces Protected Backend Data Policy (strictly blocks DELETE)
 * - Avoids CORS issues in frontend client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxyRequest(request, params, "PUT");
}

/**
 * 🔒 Protected Backend Data Policy: Strictly Block All DELETE Requests
 */
export async function DELETE() {
  return NextResponse.json(
    {
      error: "Forbidden",
      message:
        "DELETE operations are strictly blocked by SmartUp Protected Backend Data Policy. To delete or archive records, please use Frappe Desk or consult the system administrator.",
    },
    { status: 403 }
  );
}

async function handleProxyRequest(
  request: NextRequest,
  paramsPromise: Promise<{ path: string[] }>,
  method: "GET" | "POST" | "PUT"
) {
  try {
    const { path } = await paramsPromise;
    const searchParams = request.nextUrl.searchParams.toString();
    const joinedPath = path.join("/");
    const targetUrl = `${FRAPPE_URL.replace(/\/$/, "")}/api/${joinedPath}${
      searchParams ? `?${searchParams}` : ""
    }`;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (FRAPPE_API_KEY && FRAPPE_API_SECRET) {
      headers["Authorization"] = `token ${FRAPPE_API_KEY}:${FRAPPE_API_SECRET}`;
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      cache: "no-store",
    };

    if (method !== "GET") {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch {
        // Body was empty or non-JSON
      }
    }

    const response = await fetch(targetUrl, fetchOptions);
    const contentType = response.headers.get("content-type");

    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      return NextResponse.json(data, { status: response.status });
    }

    const textData = await response.text();
    return new NextResponse(textData, {
      status: response.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  } catch (error: any) {
    console.error("Frappe Proxy Error:", error);
    return NextResponse.json(
      {
        error: "Frappe Proxy Error",
        message: error?.message || "Failed to communicate with Frappe backend",
        targetUrl: FRAPPE_URL,
      },
      { status: 502 }
    );
  }
}
