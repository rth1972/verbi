"use client";

import { useState } from "react";

const EMOJIS = [
  "😀", "😂", "🤣", "😊", "😍", "🥰", "😎", "🤔",
  "👍", "👎", "❤️", "🔥", "🎉", "💯", "✅", "❌",
  "⭐", "🌟", "💡", "📌", "🙏", "👏", "🎊", "💪",
  "😢", "😤", "😡", "🤯", "🥳", "😴", "🤗", "😅",
];

export default function EmojiPicker({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        type="button"
        className="emoji-btn"
        onClick={() => setOpen(!open)}
        title="Add emoji"
      >
        😊
      </button>
      {open && (
        <div className="emoji-picker" style={{ position: "absolute", zIndex: 10 }}>
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onSelect(emoji);
                setOpen(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
