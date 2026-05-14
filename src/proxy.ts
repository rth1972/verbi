import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function corsHeaders(pathname: string): Record<string, string> {
  const isAdmin = pathname.startsWith("/api/admin/");
  return {
    "Access-Control-Allow-Origin": isAdmin ? "null" : "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/api/")) return NextResponse.next();

  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(pathname),
    });
  }

  const response = NextResponse.next();
  const headers = corsHeaders(pathname);
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: "/api/:path*",
};
