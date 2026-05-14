import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

const ALLOWED_ORIGINS = (process.env.VERBI_ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

function isAllowedOrigin(req: NextRequest): boolean {
  if (ALLOWED_ORIGINS.length === 0) return true;
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  if (!origin && !referer) return false;
  if (origin && ALLOWED_ORIGINS.some((o) => origin.startsWith(o))) return true;
  if (referer && ALLOWED_ORIGINS.some((o) => referer.startsWith(o))) return true;
  return false;
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAuthUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAllowedOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const comment = await prisma.comment.update({
    where: { id },
    data: body,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  return NextResponse.json({ data: comment });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAuthUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAllowedOrigin(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.comment.update({
    where: { id },
    data: {
      isDeleted: true,
      deletedAt: new Date(),
      content: "[deleted]",
      raw: "[deleted]",
    },
  });

  return NextResponse.json({ success: true });
}
