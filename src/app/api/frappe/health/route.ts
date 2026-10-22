import { NextResponse } from "next/server";
import { FrappeHealthCheckResponse } from "@/lib/types/frappe";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartup.m.frappe.cloud";
const FRAPPE_API_KEY = process.env.FRAPPE_API_KEY;
const FRAPPE_API_SECRET = process.env.FRAPPE_API_SECRET;

export async function GET() {
  const startTime = Date.now();
  const result: FrappeHealthCheckResponse = {
    connected: false,
    url: FRAPPE_URL,
    authenticated: false,
  };

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (FRAPPE_API_KEY && FRAPPE_API_SECRET) {
      headers["Authorization"] = `token ${FRAPPE_API_KEY}:${FRAPPE_API_SECRET}`;
    }

    // Call Frappe ping endpoint or get_logged_user
    const res = await fetch(`${FRAPPE_URL.replace(/\/$/, "")}/api/method/frappe.auth.get_logged_user`, {
      method: "GET",
      headers,
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });

    result.latencyMs = Date.now() - startTime;

    if (res.ok) {
      const data = await res.json();
      result.connected = true;
      result.authenticated = !!data?.message && data.message !== "Guest";
      result.serverTime = new Date().toISOString();
      return NextResponse.json(result, { status: 200 });
    }

    if (res.status === 401 || res.status === 403) {
      result.connected = true;
      result.authenticated = false;
      result.error = "Authentication failed (Invalid or missing API key/secret)";
      return NextResponse.json(result, { status: 200 });
    }

    result.error = `Frappe returned HTTP status ${res.status}`;
    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    result.latencyMs = Date.now() - startTime;
    result.connected = false;
    result.error = err?.message || "Failed to reach Frappe server";
    return NextResponse.json(result, { status: 200 });
  }
}
