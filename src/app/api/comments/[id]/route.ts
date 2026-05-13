import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const admin = await getAuthUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

  // Soft-delete: keep the row so threaded replies stay intact.
  // The comment content is cleared so no user data is retained.
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
