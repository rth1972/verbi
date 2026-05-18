"use client";

import { useState } from "react";

interface VoteButtonsProps {
  commentId: string;
  initialScore: number;
  userEmail: string | null;
}

export default function VoteButtons({
  commentId,
  initialScore,
  userEmail,
}: VoteButtonsProps) {
  const [score, setScore] = useState(initialScore);
  const [voted, setVoted] = useState<1 | -1 | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVote = async (value: 1 | -1) => {
    if (!userEmail || loading) return;

    // Optimistic update
    const prevVoted = voted;
    const prevScore = score;

    if (voted === value) {
      // Toggle off
      setVoted(null);
      setScore((s) => s - value);
    } else if (voted !== null) {
      // Switch direction: remove old vote, add new
      setVoted(value);
      setScore((s) => s - voted + value);
    } else {
      // Fresh vote
      setVoted(value);
      setScore((s) => s + value);
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/comments/${commentId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value, email: userEmail }),
      });

      if (!res.ok) {
        // Roll back on failure
        setVoted(prevVoted);
        setScore(prevScore);
      }
    } catch {
      setVoted(prevVoted);
      setScore(prevScore);
    } finally {
      setLoading(false);
    }
  };

  const noEmail = !userEmail;
  const title = noEmail ? "Enter your email when commenting to vote" : undefined;

  return (
    <span
      className="vote-buttons"
      style={{ display: "inline-flex", alignItems: "center", gap: 2 }}
      title={title}
    >
      <button
        className={`vote-btn${voted === 1 ? " vote-btn--active" : ""}`}
        onClick={() => handleVote(1)}
        disabled={noEmail || loading}
        aria-label="Upvote"
      >
        ▲
      </button>
      <span className="vote-score" style={{
        fontSize: 12,
        minWidth: 16,
        textAlign: "center",
        color: voted === 1
          ? "var(--success)"
          : voted === -1
          ? "var(--danger)"
          : "var(--text-secondary)",
        fontWeight: score !== 0 ? 600 : 400,
      }}>
        {score}
      </span>
      <button
        className={`vote-btn${voted === -1 ? " vote-btn--active vote-btn--down" : ""}`}
        onClick={() => handleVote(-1)}
        disabled={noEmail || loading}
        aria-label="Downvote"
      >
        ▼
      </button>
    </span>
  );
}
