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
  const [voted, setVoted] = useState<number | null>(null);

  const handleVote = async (value: number) => {
    if (!userEmail) return;

    const res = await fetch(`/api/comments/${commentId}/vote`, {
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
    <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
      <button
        className={voted === 1 ? "voted" : ""}
        onClick={() => handleVote(1)}
        title="Upvote"
      >
        ▲ {score > 0 ? score : ""}
      </button>
      <button
        className={voted === -1 ? "voted" : ""}
        onClick={() => handleVote(-1)}
        title="Downvote"
      >
        ▼
      </button>
    </div>
  );
}
