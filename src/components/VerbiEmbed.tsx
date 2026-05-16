"use client";

import { useState, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// ─── Types ───────────────────────────────────────────────

interface CommentUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  websiteUrl: string | null;
}

interface VoteInfo {
  id: string;
  userId: string;
  commentId: string;
  value: number;
}

interface CommentData {
  id: string;
  content: string;
  pageKey: string;
  userId: string;
  parentId: string | null;
  depth: number;
  isPinned: boolean;
  isDeleted: boolean;
  createdAt: string;
  user: CommentUser;
  replies?: CommentData[];
  votes?: VoteInfo[];
}

// ─── Config ───────────────────────────────────────────────

export interface VerbiConfig {
  server: string;       // e.g. "https://comments.example.com"
  site?: string;        // site name (default: "default")
  pageKey: string;      // unique page identifier
  pageTitle?: string;   // optional page title
}

// ─── Helpers ──────────────────────────────────────────────

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

const EMOJIS = [
  "😀","😂","🤣","😊","😍","🥰","😎","🤔",
  "👍","👎","❤️","🔥","🎉","💯","✅","❌","🙏","👏","💪","😢",
];

// ─── VoteButtons ──────────────────────────────────────────

function VoteButtons({
  commentId,
  initialScore,
  server,
  userEmail,
}: {
  commentId: string;
  initialScore: number;
  server: string;
  userEmail: string | null;
}) {
  const [score, setScore] = useState(initialScore);
  const [voted, setVoted] = useState<number | null>(null);

  const handleVote = async (value: number) => {
    if (!userEmail) return;
    const res = await fetch(`${server}/api/comments/${commentId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value, email: userEmail }),
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data.voted === null) {
        setVoted(null);
        setScore((s) => s - value);
      } else if (json.data.voted === value) {
        if (voted === value) {
          setVoted(null);
          setScore((s) => s - value);
        } else {
          setVoted(value);
          setScore((s) => (voted ? s - voted + value : s + value));
        }
      }
    }
  };

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      <button style={{ ...btn, color: voted === 1 ? "var(--primary)" : undefined }} onClick={() => handleVote(1)}>▲</button>
      {score !== 0 && <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{score}</span>}
      <button style={{ ...btn, color: voted === -1 ? "var(--primary)" : undefined }} onClick={() => handleVote(-1)}>▼</button>
    </span>
  );
}

// ─── CommentItem ──────────────────────────────────────────

function CommentItem({
  comment,
  server,
  site,
  pageKey,
  pageTitle,
  userEmail,
  onAction,
  depth = 0,
}: {
  comment: CommentData;
  server: string;
  site?: string;
  pageKey: string;
  pageTitle?: string;
  userEmail: string | null;
  onAction: () => void;
  depth?: number;
}) {
  const [replying, setReplying] = useState(false);
  const totalScore = comment.votes?.reduce((s, v) => s + v.value, 0) || 0;
  const isDeleted = comment.isDeleted;

  return (
    <div style={{ ...styles.comment, marginLeft: depth > 0 ? 20 : 0, borderLeft: depth > 0 ? "2px solid var(--border)" : undefined, paddingLeft: depth > 0 ? 16 : 0 }}>
      {comment.isPinned && !isDeleted && <span style={{ fontSize: 11, color: "var(--accent)" }}>📌 Pinned</span>}
      <div style={styles.userRow}>
        <div style={styles.avatar}>{isDeleted ? "✕" : getInitials(comment.user.name)}</div>
        <span style={{ fontSize: 13, fontWeight: 500, color: isDeleted ? "var(--text-muted)" : undefined, fontStyle: isDeleted ? "italic" : undefined }}>
          {isDeleted ? "[deleted]" : comment.user.websiteUrl ? (
            <a href={comment.user.websiteUrl} target="_blank" rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
              {comment.user.name}
            </a>
          ) : comment.user.name}
        </span>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(comment.createdAt)}</span>
      </div>
      <div style={{ ...styles.content, color: isDeleted ? "var(--text-muted)" : undefined, fontStyle: isDeleted ? "italic" : undefined }}>
        {isDeleted ? (
          <p style={{ margin: 0 }}>[deleted]</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content.replace(/^(#{1,6})(?!#)(\S)/gm, "$1 $2")}</ReactMarkdown>
        )}
      </div>
      {!isDeleted && (
        <div style={styles.actions}>
          <VoteButtons commentId={comment.id} initialScore={totalScore} server={server} userEmail={userEmail} />
          <button style={btn} onClick={() => setReplying(!replying)}>↩ Reply</button>
        </div>
      )}
      {replying && (
        <div style={{ marginTop: 8 }}>
          <CommentForm server={server} site={site} pageKey={pageKey} pageTitle={pageTitle} parentId={comment.id} onSubmitted={() => { setReplying(false); onAction(); }} onCancel={() => setReplying(false)} />
        </div>
      )}
      {comment.replies?.map((r) => (
        <CommentItem key={r.id} comment={r} server={server} site={site} pageKey={pageKey} pageTitle={pageTitle} userEmail={userEmail} onAction={onAction} depth={depth + 1} />
      ))}
    </div>
  );
}

// ─── CommentForm ──────────────────────────────────────────

function CommentForm({
  server,
  site,
  pageKey,
  pageTitle,
  parentId,
  onSubmitted,
  onCancel,
}: {
  server: string;
  site?: string;
  pageKey: string;
  pageTitle?: string;
  parentId?: string;
  onSubmitted: () => void;
  onCancel?: () => void;
}) {
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(localStorage.getItem("verbi_name") || "");
    setEmail(localStorage.getItem("verbi_email") || "");
    setWebsite(localStorage.getItem("verbi_website") || "");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !name.trim() || !email.trim()) return;
    setError("");
    localStorage.setItem("verbi_name", name);
    localStorage.setItem("verbi_email", email);
    localStorage.setItem("verbi_website", website);
    setSubmitting(true);
    const res = await fetch(`${server}/api/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: content.trim(), pageKey, pageTitle, site: site || "default", name: name.trim(), email: email.trim(), websiteUrl: website.trim() || null, parentId }),
    });
    setSubmitting(false);
    if (res.status === 429) {
      setError("Too many comments — please wait a few minutes.");
      return;
    }
    if (res.ok) { setContent(""); onSubmitted(); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write a comment... (Markdown supported)" required style={styles.textarea} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
        <div style={{ position: "relative" }}>
          <button type="button" style={emojiBtn} onClick={() => setShowEmoji(!showEmoji)}>😊</button>
          {showEmoji && (
            <div style={styles.emojiPicker}>
              {EMOJIS.map((e) => (
                <button key={e} type="button" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, padding: 2 }} onClick={() => { setContent((c) => c + e); setShowEmoji(false); }}>{e}</button>
              ))}
            </div>
          )}
        </div>
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{content.length} chars</span>
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name *" required style={styles.input} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email *" type="email" required style={styles.input} />
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <button type="submit" disabled={submitting} style={{ ...styles.primaryBtn, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Posting..." : parentId ? "Reply" : "Comment"}</button>
        {onCancel && <button type="button" style={styles.ghostBtn} onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

// ─── Main Embed Component ─────────────────────────────────

export default function VerbiEmbed({ server, site, pageKey, pageTitle }: VerbiConfig) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    setUserEmail(localStorage.getItem("ma_email"));
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${server}/api/comments?pageKey=${encodeURIComponent(pageKey)}&site=${site || "default"}&sort=${sort}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setComments(json.data || []);
      setTotal(json.total || 0);
    } catch {
      setComments([]);
      setTotal(0);
    }
    setLoading(false);
  }, [server, pageKey, site, sort]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', color: "var(--text, #ffffff)", maxWidth: 700, margin: "0 auto", padding: "20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--border, #505050)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Comments ({total})</h3>
        <div style={{ display: "flex", gap: 4 }}>
          {["newest", "oldest"].map((s) => (
            <button key={s} onClick={() => setSort(s)} style={{ ...styles.sortBtn, background: sort === s ? "var(--primary, #f3ba40)" : "transparent", color: sort === s ? "#fff" : "var(--text-secondary, #cccccc)" }}>{s === "newest" ? "Newest" : "Oldest"}</button>
          ))}
        </div>
      </div>

      <CommentForm server={server} site={site} pageKey={pageKey} pageTitle={pageTitle} onSubmitted={fetchComments} />

      <div style={{ marginTop: 20 }}>
        {loading ? (
          <p style={{ textAlign: "center", padding: 20, color: "var(--text-muted, #888888)" }}>Loading comments...</p>
        ) : comments.length === 0 ? (
          <p style={{ textAlign: "center", padding: 20, color: "var(--text-muted, #888888)" }}>No comments yet. Be the first!</p>
        ) : (
          comments.map((c) => (
            <CommentItem key={c.id} comment={c} server={server} site={site} pageKey={pageKey} pageTitle={pageTitle} userEmail={userEmail} onAction={fetchComments} />
          ))
        )}
      </div>
      <p style={{ fontSize: 11, color: "var(--text-muted, #888888)", textAlign: "center", marginTop: 16 }}>
        Powered by <a href="https://github.com/your-repo/verbi" style={{ color: "var(--primary, #f3ba40)" }}>Verbi</a>
      </p>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────

const btn: React.CSSProperties = {
  background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary, #cccccc)", fontSize: 12, padding: "2px 4px",
};

const emojiBtn: React.CSSProperties = {
  ...btn, fontSize: 18,
};

const styles: Record<string, React.CSSProperties> = {
  comment: {
    padding: "14px 0", borderBottom: "1px solid var(--border, #505050)",
  },
  userRow: {
    display: "flex", alignItems: "center", gap: 6, marginBottom: 4,
  },
  avatar: {
    width: 26, height: 26, borderRadius: "50%", background: "var(--primary-light, rgba(243,186,64,0.12))", color: "var(--primary, #f3ba40)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600,
  },
  content: {
    fontSize: 14, lineHeight: 1.6, margin: "4px 0 6px",
  },
  actions: {
    display: "flex", alignItems: "center", gap: 10, fontSize: 12,
  },
  textarea: {
    width: "100%", minHeight: 90, padding: 10, border: "1px solid var(--border, #505050)", borderRadius: 6, background: "var(--bg, #19171c)", color: "var(--text, #ffffff)", fontSize: 14, resize: "vertical" as const, outline: "none", boxSizing: "border-box" as const,
  },
  input: {
    flex: 1, padding: "8px 10px", border: "1px solid var(--border, #505050)", borderRadius: 6, background: "var(--bg, #19171c)", color: "var(--text, #ffffff)", fontSize: 13, outline: "none",
  },
  primaryBtn: {
    padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 600, border: "none", cursor: "pointer", background: "var(--primary, #f3ba40)", color: "#353535",
  },
  ghostBtn: {
    padding: "7px 16px", borderRadius: 6, fontSize: 13, fontWeight: 500, border: "none", cursor: "pointer", background: "transparent", color: "var(--text-secondary, #cccccc)",
  },
  sortBtn: {
    padding: "4px 10px", borderRadius: 6, fontSize: 12, border: "none", cursor: "pointer", fontWeight: 500,
  },
  emojiPicker: {
    position: "absolute" as const, zIndex: 10, display: "flex", flexWrap: "wrap" as const, gap: 4, padding: 8, border: "1px solid var(--border, #505050)", borderRadius: 6, background: "var(--bg, #19171c)", marginTop: 4, width: 220,
  },
};
