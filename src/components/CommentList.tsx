"use client";

import { useState, useEffect, useCallback } from "react";
import CommentItem from "./CommentItem";
import CommentForm from "./CommentForm";
import type { CommentData } from "@/lib/types";

interface CommentListProps {
  pageKey: string;
  pageTitle?: string;
  site?: string;
  isAdmin?: boolean;
}

export default function CommentList({
  pageKey,
  pageTitle,
  site,
  isAdmin,
}: CommentListProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("artalk_email");
    setUserEmail(email);
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch(
      `/api/comments?pageKey=${encodeURIComponent(pageKey)}&site=${site || "default"}&sort=${sort}`
    );
    const json = await res.json();
    setComments(json.data);
    setTotal(json.total);
    setLoading(false);
  }, [pageKey, site, sort]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return (
    <div className="artalk-widget">
      <div className="artalk-header">
        <h3>Comments ({total})</h3>
        <div style={{ display: "flex", gap: 4 }}>
          {["newest", "oldest"].map((s) => (
            <button
              key={s}
              className={`btn ${sort === s ? "btn-primary" : "btn-ghost"}`}
              onClick={() => setSort(s)}
              style={{ fontSize: 12, padding: "4px 10px" }}
            >
              {s === "newest" ? "Newest" : "Oldest"}
            </button>
          ))}
        </div>
      </div>

      <CommentForm
        pageKey={pageKey}
        pageTitle={pageTitle}
        site={site}
        onSubmitted={fetchComments}
      />

      <div style={{ marginTop: 24 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
            Loading comments...
          </div>
        ) : comments.length === 0 ? (
          <div style={{ textAlign: "center", padding: 20, color: "var(--text-muted)" }}>
            No comments yet. Be the first!
          </div>
        ) : (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              pageKey={pageKey}
              pageTitle={pageTitle}
              site={site}
              userEmail={userEmail}
              onAction={fetchComments}
              isAdmin={isAdmin}
              onAdminAction={fetchComments}
            />
          ))
        )}
      </div>
    </div>
  );
}
