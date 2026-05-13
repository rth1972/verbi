"use client";

import { useState, useEffect, useCallback } from "react";

interface CommentData {
  id: string;
  content: string;
  pageKey: string;
  isPending: boolean;
  isPinned: boolean;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export default function AdminComments({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/comments");
    if (res.ok) {
      const json = await res.json();
      setComments(json.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    const res = await fetch(`/api/comments/${id}`, { method: "DELETE" });
    if (res.ok) fetchComments();
  };

  const handleToggle = async (id: string, field: string, value: boolean) => {
    const res = await fetch(`/api/comments/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: !value }),
    });
    if (res.ok) fetchComments();
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 40, color: "var(--text-muted)" }}>
        Loading...
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Comments</h2>
        <button className="btn btn-ghost" onClick={onLogout}>
          Logout
        </button>
      </div>

      {comments.length === 0 ? (
        <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>
          No comments yet.
        </p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="comment-row">
            <div style={{ flex: 1 }}>
              <div className="meta">
                {c.user.name} &lt;{c.user.email}&gt; on {c.pageKey}
                <span
                  className={`status-badge ${c.isPending ? "status-pending" : "status-approved"}`}
                  style={{ marginLeft: 8 }}
                >
                  {c.isPending ? "Pending" : "Approved"}
                </span>
                {c.isPinned && <span style={{ marginLeft: 4 }}>📌</span>}
              </div>
              <div className="content">
                {c.content.slice(0, 150)}
                {c.content.length > 150 ? "..." : ""}
              </div>
            </div>
            <div className="actions">
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11 }}
                onClick={() => handleToggle(c.id, "isPending", c.isPending)}
              >
                {c.isPending ? "Approve" : "Unapprove"}
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11 }}
                onClick={() => handleToggle(c.id, "isPinned", c.isPinned)}
              >
                {c.isPinned ? "Unpin" : "Pin"}
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 11, color: "var(--danger)" }}
                onClick={() => handleDelete(c.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
