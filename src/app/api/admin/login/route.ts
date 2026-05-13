import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyPassword, getAdminDefaults } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, email, password } = body;

  if (action === "login") {
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const defaults = getAdminDefaults();
    if (email !== defaults.email || !verifyPassword(password)) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken();
    const response = NextResponse.json({ data: { id: "admin", name: defaults.name, email: defaults.email } });
    response.cookies.set("artalk_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });
    return response;
  }

  if (action === "logout") {
    const response = NextResponse.json({ success: true });
    response.cookies.set("artalk_token", "", { maxAge: 0, path: "/" });
    return response;
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
