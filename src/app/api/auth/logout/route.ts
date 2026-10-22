import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("smartup_session");
  response.cookies.delete("sid");
  return response;
}
