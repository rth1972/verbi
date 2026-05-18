import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const { value, email } = body;

  if (!email || (value !== 1 && value !== -1)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  // Find or create the user — someone may vote before ever posting a comment
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: email.split("@")[0],
        email,
        avatarUrl: null,
      },
    });
  }

  const existing = await prisma.vote.findUnique({
    where: { userId_commentId: { userId: user.id, commentId: id } },
  });

  if (existing) {
    if (existing.value === value) {
      // Same vote again → toggle off
      await prisma.vote.delete({ where: { id: existing.id } });
      return NextResponse.json({ data: { voted: null, previousValue: existing.value } });
    }
    // Switching vote direction
    await prisma.vote.update({ where: { id: existing.id }, data: { value } });
    return NextResponse.json({ data: { voted: value, previousValue: existing.value } });
  }

  await prisma.vote.create({
    data: { userId: user.id, commentId: id, value },
  });

  return NextResponse.json({ data: { voted: value, previousValue: null } });
}
