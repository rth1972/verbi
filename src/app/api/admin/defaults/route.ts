import { NextResponse } from "next/server";
import { getAdminDefaults } from "@/lib/auth";

export async function GET() {
  const { email, name } = getAdminDefaults();
  return NextResponse.json({ email, name });
}
