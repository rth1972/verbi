import nodemailer from "nodemailer";

// Configure via env vars — see comments below
// SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM
// NEXT_PUBLIC_SITE_URL — used to build links in emails
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth:
    process.env.SMTP_USER && process.env.SMTP_PASS
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
});

const FROM = process.env.SMTP_FROM || "Verbi Comments <no-reply@verbi.local>";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** Notify the admin that a new top-level comment is awaiting moderation. */
export async function sendNewCommentNotification({
  adminEmail,
  authorName,
  authorEmail,
  pageKey,
  pageTitle,
  content,
}: {
  adminEmail: string;
  authorName: string;
  authorEmail: string;
  pageKey: string;
  pageTitle?: string | null;
  content: string;
}) {
  if (!process.env.SMTP_HOST) return; // not configured — skip silently

  const preview = content.slice(0, 200) + (content.length > 200 ? "..." : "");
  const adminUrl = `${SITE_URL}/admin`;
  const label = pageTitle || pageKey;

  await transporter.sendMail({
    from: FROM,
    to: adminEmail,
    subject: `New comment on "${label}" awaiting moderation`,
    text: [
      `${authorName} (${authorEmail}) posted a new comment on "${label}":`,
      "",
      preview,
      "",
      `Review it in the admin panel: ${adminUrl}`,
    ].join("\n"),
    html: `
      <p><strong>${authorName}</strong> (<a href="mailto:${authorEmail}">${authorEmail}</a>)
      posted a new comment on <em>${label}</em>:</p>
      <blockquote style="border-left:3px solid #ccc;margin:0;padding:0 12px;color:#555">
        ${preview}
      </blockquote>
      <p><a href="${adminUrl}">Review in admin panel →</a></p>
    `,
  });
}

/** Notify a commenter that someone replied to their comment. */
export async function sendReplyNotification({
  parentAuthorEmail,
  parentAuthorName,
  replyAuthorName,
  pageKey,
  pageTitle,
  replyContent,
}: {
  parentAuthorEmail: string;
  parentAuthorName: string;
  replyAuthorName: string;
  pageKey: string;
  pageTitle?: string | null;
  replyContent: string;
}) {
  if (!process.env.SMTP_HOST) return; // not configured — skip silently

  const preview =
    replyContent.slice(0, 200) + (replyContent.length > 200 ? "..." : "");
  const pageUrl = `${SITE_URL}/${pageKey}`;
  const label = pageTitle || pageKey;

  await transporter.sendMail({
    from: FROM,
    to: parentAuthorEmail,
    subject: `${replyAuthorName} replied to your comment`,
    text: [
      `Hi ${parentAuthorName},`,
      "",
      `${replyAuthorName} replied to your comment on "${label}":`,
      "",
      preview,
      "",
      `View the discussion: ${pageUrl}`,
      "",
      "— Verbi",
    ].join("\n"),
    html: `
      <p>Hi <strong>${parentAuthorName}</strong>,</p>
      <p><strong>${replyAuthorName}</strong> replied to your comment on <em>${label}</em>:</p>
      <blockquote style="border-left:3px solid #ccc;margin:0;padding:0 12px;color:#555">
        ${preview}
      </blockquote>
      <p><a href="${pageUrl}">View the discussion →</a></p>
      <p style="color:#aaa;font-size:12px">— Verbi</p>
    `,
  });
}
