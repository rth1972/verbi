import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    email: process.env.VERBI_ADMIN_EMAIL || "admin@verbi.local",
    password: process.env.VERBI_ADMIN_PASSWORD || "admin123",
    name: process.env.VERBI_ADMIN_NAME || "Admin",
  });
}
