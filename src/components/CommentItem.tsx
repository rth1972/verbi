"use client";

import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import VoteButtons from "./VoteButtons";
import CommentForm from "./CommentForm";
import type { CommentData } from "@/lib/types";

interface CommentItemProps {
  comment: CommentData;
  pageKey: string;
  pageTitle?: string;
  site?: string;
  userEmail: string | null;
  onAction: () => void;
  isAdmin?: boolean;
  onAdminAction?: () => void;
}

function getInitials(name: string) {
  return name.slice(0, 2).toUpperCase();
}

function timeAgo(date: string) {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function CommentItem({
  comment,
  pageKey,
  pageTitle,
  site,
  userEmail,
  onAction,
  isAdmin,
  onAdminAction,
}: CommentItemProps) {
  const [replying, setReplying] = useState(false);

  const rendered = useMemo(() => {
    return comment.content.replace(/^(#{1,6})(?!#)(\S)/gm, "$1 $2");
  }, [comment.content]);

  const totalScore =
    comment.votes?.reduce((s, v) => s + v.value, 0) || 0;

  const isDeleted = comment.isDeleted;

  return (
    <div className={`comment-item ${comment.depth > 0 ? "nested" : ""}`}>
      {comment.isPinned && !isDeleted && (
        <div className="pinned-badge">📌 Pinned</div>
      )}
      <div className="comment-user">
        <div className="comment-avatar">{isDeleted ? "✕" : getInitials(comment.user.name)}</div>
        <span className="comment-name" style={isDeleted ? { color: "var(--text-muted)", fontStyle: "italic" } : undefined}>
          {isDeleted ? "[deleted]" : comment.user.websiteUrl ? (
            <a href={comment.user.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "none" }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>
              {comment.user.name}
            </a>
          ) : comment.user.name}
        </span>
        {!isDeleted && comment.user.email === "admin@artalk.local" && (
          <span className="comment-badge">Admin</span>
        )}
        <span className="comment-time">{timeAgo(comment.createdAt)}</span>
      </div>
      <div className="comment-content" style={isDeleted ? { color: "var(--text-muted)", fontStyle: "italic" } : undefined}>
        {isDeleted ? (
          <p style={{ margin: 0 }}>[deleted]</p>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {rendered}
          </ReactMarkdown>
        )}
      </div>
      {!isDeleted && (
        <div className="comment-actions">
          <VoteButtons
            commentId={comment.id}
            initialScore={totalScore}
            userEmail={userEmail}
          />
          <button onClick={() => setReplying(!replying)}>
            ↩ Reply
          </button>
          {isAdmin && onAdminAction && (
            <>
              <button
                onClick={async () => {
                  await fetch(`/api/comments/${comment.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPinned: !comment.isPinned }),
                  });
                  onAdminAction();
                }}
              >
                📌 {comment.isPinned ? "Unpin" : "Pin"}
              </button>
              <button
                onClick={async () => {
                  await fetch(`/api/comments/${comment.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ isPending: !comment.isPending }),
                  });
                  onAdminAction();
                }}
              >
                {comment.isPending ? "✅ Approve" : "⏳ Unapprove"}
              </button>
              <button
                onClick={async () => {
                  if (confirm("Delete this comment? It will show as [deleted] but replies are preserved.")) {
                    await fetch(`/api/comments/${comment.id}`, {
                      method: "DELETE",
                    });
                    onAdminAction();
                  }
                }}
                style={{ color: "var(--danger)" }}
              >
                🗑 Delete
              </button>
            </>
          )}
        </div>
      )}
      {replying && (
        <div style={{ marginTop: 12 }}>
          <CommentForm
            pageKey={pageKey}
            pageTitle={pageTitle}
            site={site}
            parentId={comment.id}
            onSubmitted={() => {
              setReplying(false);
              onAction();
            }}
            onCancel={() => setReplying(false)}
          />
        </div>
      )}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              pageKey={pageKey}
              pageTitle={pageTitle}
              site={site}
              userEmail={userEmail}
              onAction={onAction}
              isAdmin={isAdmin}
              onAdminAction={onAdminAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
