"use client";

import { useState, useEffect } from "react";
import EmojiPicker from "./EmojiPicker";

interface CommentFormProps {
  pageKey: string;
  pageTitle?: string;
  site?: string;
  parentId?: string;
  onSubmitted: () => void;
  onCancel?: () => void;
}

export default function CommentForm({
  pageKey,
  pageTitle,
  site,
  parentId,
  onSubmitted,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: content.trim(),
        pageKey,
        pageTitle,
        site: site || "default",
        name: name.trim(),
        email: email.trim(),
        websiteUrl: website.trim() || null,
        parentId,
      }),
    });

    setSubmitting(false);

    if (res.status === 429) {
      setError("Too many comments — please wait a few minutes.");
      return;
    }

    if (res.ok) {
      setContent("");
      onSubmitted();
    }
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment... (Markdown supported)"
        required
      />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
        <EmojiPicker onSelect={(emoji) => setContent((c) => c + emoji)} />
        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
          {content.length} chars
        </span>
      </div>
      <div className="input-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name *"
          required
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email *"
          type="email"
          required
        />
        <input
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="Website (optional)"
          type="url"
        />
      </div>
      {error && (
        <p style={{ color: "var(--danger)", fontSize: 13, margin: "6px 0 0" }}>
          {error}
        </p>
      )}
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Posting..." : parentId ? "Reply" : "Comment"}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
