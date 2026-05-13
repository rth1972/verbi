"use client";

import { useState, useEffect } from "react";
import AdminLogin from "@/components/AdminLogin";
import AdminComments from "@/components/AdminComments";

export default function AdminPage() {
  const [user, setUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [defaults, setDefaults] = useState({ email: "", password: "", name: "" });
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("artalk_theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    fetch("/api/admin/defaults")
      .then((r) => r.json())
      .then(setDefaults);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("artalk_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  if (!user) {
    return <AdminLogin onLogin={setUser} defaults={defaults} />;
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>Verbi</h2>
        <nav>
          <a href="/admin" style={{ background: "var(--bg-tertiary)", color: "var(--text)" }}>
            Comments
          </a>
          <a href="/" target="_blank">View Site</a>
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 20 }}>
          <button className="btn btn-ghost" onClick={toggleDark} style={{ fontSize: 13 }}>
            {dark ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <AdminComments onLogout={() => setUser(null)} />
      </main>
    </div>
  );
}
