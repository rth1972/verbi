import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendNewCommentNotification,
  sendReplyNotification,
} from "@/lib/mailer";
import { sendTelegramNotification } from "@/lib/telegram";

// ── In-memory rate limiter ────────────────────────────────
// Max 5 comments per IP per 10 minutes.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

const ipMap = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (ipMap.get(ip) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT) return true;
  timestamps.push(now);
  ipMap.set(ip, timestamps);
  return false;
}

// Prune old entries every hour to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of ipMap.entries()) {
    const fresh = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
    if (fresh.length === 0) ipMap.delete(ip);
    else ipMap.set(ip, fresh);
  }
}, 60 * 60 * 1000);

// ── User select helper ────────────────────────────────────
const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  websiteUrl: true,
} as const;

// ── GET ───────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pageKey = searchParams.get("pageKey");
  const siteName = searchParams.get("site") || "default";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  if (!pageKey) {
    return NextResponse.json({ error: "pageKey is required" }, { status: 400 });
  }

  const orderBy: Record<string, "asc" | "desc"> =
    sort === "oldest" ? { createdAt: "asc" } : { createdAt: "desc" };

  const where = { pageKey, siteName, parentId: null, isDeleted: false };

  const replyInclude = {
    user: { select: USER_SELECT },
    _count: { select: { votes: true } },
    votes: true,
  };

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      orderBy: [{ isPinned: "desc" }, orderBy],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: USER_SELECT },
        _count: { select: { votes: true } },
        votes: true,
        replies: {
          where: { isDeleted: false },
          include: {
            user: { select: USER_SELECT },
            _count: { select: { votes: true } },
            votes: true,
            replies: {
              where: { isDeleted: false },
              include: replyInclude,
            },
          },
        },
      },
    }),
    prisma.comment.count({ where }),
  ]);

  return NextResponse.json({ data: comments, total, page, limit });
}

// ── POST ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many comments. Please wait a few minutes." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { content, pageKey, pageTitle, site, name, email, websiteUrl, parentId } =
    body;

  if (!content || !pageKey || !name || !email) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Normalise websiteUrl — ensure it has a protocol if provided
  let cleanWebsite: string | null = null;
  if (websiteUrl && websiteUrl.trim()) {
    const w = websiteUrl.trim();
    cleanWebsite = /^https?:\/\//i.test(w) ? w : `https://${w}`;
  }

  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        websiteUrl: cleanWebsite,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
      },
    });
  } else {
    // Update name and/or websiteUrl if they changed
    const updates: Record<string, string | null> = {};
    if (user.name !== name) updates.name = name;
    if (cleanWebsite !== undefined && user.websiteUrl !== cleanWebsite)
      updates.websiteUrl = cleanWebsite;
    if (Object.keys(updates).length > 0) {
      user = await prisma.user.update({ where: { id: user.id }, data: updates });
    }
  }

  let page = await prisma.page.findUnique({ where: { pageKey } });
  if (!page) {
    page = await prisma.page.create({
      data: { pageKey, title: pageTitle || pageKey, siteName: site || "default" },
    });
  } else if (pageTitle && page.title !== pageTitle) {
    page = await prisma.page.update({
      where: { id: page.id },
      data: { title: pageTitle },
    });
  }

  let depth = 0;
  let rootId: string | null = null;
  let parentComment: {
    id: string;
    depth: number;
    rootId: string | null;
    userId: string;
  } | null = null;

  if (parentId) {
    parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
    if (parentComment) {
      depth = parentComment.depth + 1;
      rootId = parentComment.rootId || parentComment.id;
    }
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      raw: content,
      pageKey,
      siteName: site || "default",
      userId: user.id,
      parentId: parentId || null,
      rootId,
      depth,
      isPending: true,
    },
    include: { user: { select: USER_SELECT } },
  });

  // ── Notifications (fire-and-forget) ───────────────────
  const notifPayload = {
    authorName: name,
    authorEmail: email,
    pageKey,
    pageTitle: page.title,
    content,
  };

  if (parentComment) {
    const parentUser = await prisma.user.findUnique({
      where: { id: parentComment.userId },
    });
    if (parentUser && parentUser.email !== email) {
      sendReplyNotification({
        parentAuthorEmail: parentUser.email,
        parentAuthorName: parentUser.name,
        replyAuthorName: name,
        pageKey,
        pageTitle: page.title,
        replyContent: content,
      }).catch(console.error);
    }
  } else {
    const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
    if (admin) {
      sendNewCommentNotification({
        adminEmail: admin.email,
        ...notifPayload,
      }).catch(console.error);
    }
  }

  sendTelegramNotification({
    type: parentComment ? "reply" : "comment",
    ...notifPayload,
  }).catch(console.error);

  return NextResponse.json({ data: comment }, { status: 201 });
}
