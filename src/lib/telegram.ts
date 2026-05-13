const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function sendTelegramNotification({
  type,
  authorName,
  authorEmail,
  pageKey,
  pageTitle,
  content,
}: {
  type: "comment" | "reply";
  authorName: string;
  authorEmail: string;
  pageKey: string;
  pageTitle?: string | null;
  content: string;
}) {
  if (!BOT_TOKEN || !CHAT_ID) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const verbiUrl = process.env.VERBI_SERVER_URL || siteUrl;
  const pageLink = `${siteUrl}${pageKey}`;
  const adminLink = `${verbiUrl}/admin`;
  const label = type === "reply" ? "💬 New Reply" : "💬 New Comment";

  const text = [
    `<b>${escapeHtml(label)}</b>`,
    ``,
    `<b>Author:</b> ${escapeHtml(authorName)} (${escapeHtml(authorEmail)})`,
    `<b>Page:</b> <a href="${escapeHtml(pageLink)}">${escapeHtml(pageTitle || pageKey)}</a>`,
    ``,
    `<pre>${escapeHtml(content.slice(0, 500))}</pre>`,
    ``,
    `<a href="${escapeHtml(adminLink)}">Moderate →</a>`,
  ].join("\n");

  try {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
  } catch {
    // fire-and-forget, never throw
  }
}
