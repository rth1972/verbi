"use client";

import { useState } from "react";

export default function AdminLogin({
  onLogin,
  defaults,
}: {
  onLogin: (user: { id: string; name: string; email: string }) => void;
  defaults: { email: string; name: string };
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", email, password }),
    });

    if (res.ok) {
      const json = await res.json();
      onLogin(json.data);
    } else {
      setError("Invalid credentials");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "var(--bg-secondary)",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--bg)",
          padding: 32,
          borderRadius: 12,
          boxShadow: "var(--shadow-lg)",
          width: 340,
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Admin Login</h2>
        {/* <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 20 }}>
          Default: {defaults.email} / {defaults.password}
        </p> */}

        {error && (
          <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
            }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            type="password"
            required
            style={{
              padding: "10px 12px",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              background: "var(--bg)",
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            style={{ padding: "10px", fontSize: 14 }}
          >
            Sign In
          </button>
        </div>
      </form>
    </div>
  );
}
