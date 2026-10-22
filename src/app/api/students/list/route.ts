import { NextRequest, NextResponse } from "next/server";

const FRAPPE_URL = process.env.NEXT_PUBLIC_FRAPPE_URL || "https://smartupedu.frappe.cloud";
const API_KEY = process.env.FRAPPE_API_KEY || "39f71c6530cd462";
const API_SECRET = process.env.FRAPPE_API_SECRET || "064f8d6fb2fb0bc";

const AUTH_HEADER = `token ${API_KEY}:${API_SECRET}`;

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${FRAPPE_URL}/api/resource/SmartUp%20Student?fields=["name","student_name","guardian_name","guardian_phone","country","billing_currency","status","admission_date","program","class_level","course_type","delivery_mode","batch_name"]&order_by=creation%20desc&limit_page_length=1000`, {
      headers: {
        Authorization: AUTH_HEADER,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: "Failed to fetch students from Frappe", details: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ data: data.data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
