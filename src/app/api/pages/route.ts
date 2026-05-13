import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const site = searchParams.get("site") || "default";

  const pages = await prisma.page.findMany({
    where: { siteName: site },
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { comments: true } } },
  });

  return NextResponse.json({ data: pages });
}
