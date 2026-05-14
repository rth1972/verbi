import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  sendNewCommentNotification,
  sendReplyNotification,
} from "@/lib/mailer";
import { sendTelegramNotification } from "@/lib/telegram";

// ── Persistent rate limiter ──────────────────────────────
// Max 5 comments per IP per 10 minutes, stored in SQLite.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

async function isRateLimited(ip: string): Promise<boolean> {
  const cutoff = new Date(Date.now() - RATE_WINDOW_MS);
  const recent = await prisma.rateLimitLog.count({
    where: { key: ip, timestamp: { gte: cutoff } },
  });
  if (recent >= RATE_LIMIT) return true;
  await prisma.rateLimitLog.create({ data: { key: ip } });
  return false;
}

// Prune old entries every hour to keep the DB lean
setInterval(async () => {
  const cutoff = new Date(Date.now() - RATE_WINDOW_MS);
  try {
    await prisma.rateLimitLog.deleteMany({ where: { timestamp: { lt: cutoff } } });
  } catch { /* ignore */ }
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

  if (await isRateLimited(ip)) {
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

  if (content.length > 10000) {
    return NextResponse.json({ error: "Content too long (max 10,000 chars)" }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Name too long (max 100 chars)" }, { status: 400 });
  }
  if (email.length > 320) {
    return NextResponse.json({ error: "Email too long" }, { status: 400 });
  }
  if (websiteUrl && websiteUrl.length > 500) {
    return NextResponse.json({ error: "Website URL too long" }, { status: 400 });
  }

  // Strip HTML tags from raw content (defense-in-depth for XSS)
  const cleanContent = content.replace(/<[^>]*>/g, "");

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
      content: cleanContent,
      raw: cleanContent,
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
    content: cleanContent,
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
        replyContent: cleanContent,
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
