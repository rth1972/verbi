import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

const JWT_SECRET = requireEnv("JWT_SECRET");
const ADMIN_EMAIL = requireEnv("VERBI_ADMIN_EMAIL");
const ADMIN_PASSWORD = requireEnv("VERBI_ADMIN_PASSWORD");
const ADMIN_NAME = process.env.VERBI_ADMIN_NAME || "Admin";

const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

export function getAdminDefaults() {
  return { email: ADMIN_EMAIL, name: ADMIN_NAME };
}

export function verifyPassword(password: string): boolean {
  return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
}

export function signToken(): string {
  return jwt.sign(
    { userId: "admin", isAdmin: true, email: ADMIN_EMAIL, name: ADMIN_NAME },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
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
