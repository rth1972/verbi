import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change-me-to-a-long-random-string";

const ADMIN_EMAIL = process.env.VERBI_ADMIN_EMAIL || "admin@verbi.local";
const ADMIN_PASSWORD = process.env.VERBI_ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.VERBI_ADMIN_NAME || "Admin";

export function getAdminDefaults() {
  return { email: ADMIN_EMAIL, password: ADMIN_PASSWORD, name: ADMIN_NAME };
}

export function verifyPassword(password: string): boolean {
  return password === ADMIN_PASSWORD;
}

export function signToken(): string {
  return jwt.sign({ userId: "admin", isAdmin: true, email: ADMIN_EMAIL, name: ADMIN_NAME }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; isAdmin: boolean; email: string; name: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; isAdmin: boolean; email: string; name: string };
  } catch {
    return null;
  }
}

export async function getAuthUser(): Promise<{ id: string; name: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("artalk_token")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !payload.isAdmin) return null;

  return { id: payload.userId, name: payload.name, email: payload.email };
}
