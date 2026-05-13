import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { value, email } = body;

  if (!email || (value !== 1 && value !== -1)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await prisma.vote.findUnique({
    where: { userId_commentId: { userId: user.id, commentId: id } },
  });

  if (existing) {
    if (existing.value === value) {
      await prisma.vote.delete({ where: { id: existing.id } });
      return NextResponse.json({ data: { voted: null } });
    }
    await prisma.vote.update({ where: { id: existing.id }, data: { value } });
    return NextResponse.json({ data: { voted: value } });
  }

  await prisma.vote.create({
    data: { userId: user.id, commentId: id, value },
  });

  return NextResponse.json({ data: { voted: value } });
}
