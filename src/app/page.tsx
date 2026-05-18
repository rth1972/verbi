"use client";

import { useState, useEffect } from "react";
import CommentList from "@/components/CommentList";

const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
    title: "Threaded Replies",
    desc: "Nested comments with infinite depth, pagination, and clean visual hierarchy.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    title: "Markdown",
    desc: "Full GFM support — code blocks, tables, links, bold, italic, and more.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="18 15 12 9 6 15" />
      </svg>
    ),
    title: "Voting",
    desc: "Up/downvote system with live score. Sort by top or by date.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
    title: "Self-Hosted",
    desc: "Your data stays on your server. SQLite out of the box, zero telemetry.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
    ),
    title: "Moderation",
    desc: "Admin panel to approve, pin, or delete comments. Soft-delete keeps threads intact.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
    title: "Dark Mode",
    desc: "Built-in dark theme. Follows system preference or toggled manually.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Embeddable",
    desc: "One script tag for any HTML site. Or import as a React component.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "Email Alerts",
    desc: "Notify commenters on replies. Notify admins on new submissions.",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    title: "Lightweight",
    desc: "~40 KB gzipped client bundle. No heavy runtime dependencies.",
  },
];

const MOCK_COMMENTS = [
  {
    initials: "JD",
    name: "Jane Doe",
    time: "2h ago",
    body: "This is exactly what I've been looking for. Setup was under five minutes — just a div and a script tag. Love the Markdown support.",
    score: 12,
  },
  {
    initials: "MK",
    name: "Max K.",
    time: "5h ago",
    body: "Does it support nested replies? I need proper threading for my blog.",
    score: 5,
    replies: [
      {
        initials: "AD",
        name: "Admin",
        time: "4h ago",
        body: "Yes — infinite nesting with pagination. You can configure max depth in settings.",
        score: 8,
        isAdmin: true,
      },
    ],
  },
  {
    initials: "SL",
    name: "Sarah L.",
    time: "1d ago",
    body: "Migrated from Disqus yesterday. So much faster and I finally own my data.",
    score: 15,
  },
];

export default function HomePage() {
  const [dark, setDark] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("verbi_theme");
    if (saved === "dark") {
      setDark(true);
      document.documentElement.classList.add("dark");
    }
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08 }
    );
    document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("verbi_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <div className="lp-root">

      {/* ── Nav ─────────────────────────────────────── */}
      <nav className={`lp-nav${scrolled ? " lp-nav--scrolled" : ""}`}>
        <a href="/" className="lp-nav__logo">
          <svg width="26" height="26" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="lp-nav__logomark">
            <rect width="32" height="32" rx="7" fill="#171717"/>
            <path d="M6 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H11l-5 4V8z" fill="#e5e5e5"/>
            <path d="M11.5 11h2l2.5 6 2.5-6h2l-3.5 9h-2z" fill="#171717"/>
          </svg>
          Verbi
        </a>
        <div className="lp-nav__links">
          <a href="#features">Features</a>
          <a href="#embed">Docs</a>
          <a href="#live-demo">Demo</a>
          <a href="/admin" className="lp-nav__cta">Dashboard →</a>
        </div>
        <button onClick={toggleDark} className="lp-nav__theme" aria-label="Toggle theme">
          {dark ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </nav>

      {/* ── Hero ────────────────────────────────────── */}
      <section className="lp-hero">
        <div className="lp-hero__label hero-fade-in">
          <svg width="18" height="18" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="7" fill="#e5e5e5"/>
            <path d="M6 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H11l-5 4V8z" fill="#171717"/>
            <path d="M11.5 11h2l2.5 6 2.5-6h2l-3.5 9h-2z" fill="#e5e5e5"/>
          </svg>
          Open-source · Self-hosted · Privacy-first
        </div>
        <h1 className="lp-hero__h1 hero-fade-in hero-fade-in-1">
          Comments that<br />
          <em>belong to you.</em>
        </h1>
        <p className="lp-hero__sub hero-fade-in hero-fade-in-2">
          Verbi is a lightweight, self-hosted comment system. Drop it into any
          site — blog, docs, portfolio — and keep full control of your data.
        </p>
        <div className="lp-hero__actions hero-fade-in hero-fade-in-3">
          <a href="#live-demo" className="lp-btn lp-btn--primary">Try the demo</a>
          <a href="#embed" className="lp-btn lp-btn--outline">Read the docs</a>
        </div>

        {/* ── Mockup ─────────────────────────────────── */}
        <div className="lp-mockup hero-fade-in hero-fade-in-4">
          <div className="lp-mockup__bar">
            <span className="lp-mockup__dot" />
            <span className="lp-mockup__dot" />
            <span className="lp-mockup__dot" />
            <span className="lp-mockup__url">comments.example.com</span>
          </div>
          <div className="lp-mockup__body">
            <div className="lp-mockup__header">
              <span className="lp-mockup__count">Comments <strong>3</strong></span>
              <div className="lp-mockup__sort">
                <button className="active">Newest</button>
                <button>Oldest</button>
                <button>Top</button>
              </div>
            </div>
            {MOCK_COMMENTS.map((c, i) => (
              <div key={i} className="lp-mockup__comment">
                <div className="lp-mockup__user">
                  <div className="lp-mockup__avatar">{c.initials}</div>
                  <span className="lp-mockup__name">{c.name}</span>
                  <span className="lp-mockup__time">{c.time}</span>
                </div>
                <p className="lp-mockup__text">{c.body}</p>
                <div className="lp-mockup__actions">
                  <span>▲ {c.score}</span>
                  <span>▼</span>
                  <span>↩ Reply</span>
                </div>
                {c.replies?.map((r, j) => (
                  <div key={j} className="lp-mockup__reply">
                    <div className="lp-mockup__user">
                      <div className={`lp-mockup__avatar${r.isAdmin ? " lp-mockup__avatar--admin" : ""}`}>{r.initials}</div>
                      <span className="lp-mockup__name">{r.name}</span>
                      {r.isAdmin && <span className="lp-mockup__badge">Admin</span>}
                      <span className="lp-mockup__time">{r.time}</span>
                    </div>
                    <p className="lp-mockup__text">{r.body}</p>
                    <div className="lp-mockup__actions">
                      <span>▲ {r.score}</span>
                      <span>▼</span>
                      <span>↩ Reply</span>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────── */}
      <div className="lp-stats scroll-reveal">
        {[
          { val: "~40 KB", label: "gzipped client" },
          { val: "SQLite", label: "zero config DB" },
          { val: "∞", label: "reply depth" },
          { val: "MIT", label: "licensed" },
        ].map((s) => (
          <div key={s.val} className="lp-stats__item">
            <strong>{s.val}</strong>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Features ────────────────────────────────── */}
      <section id="features" className="lp-section scroll-reveal">
        <div className="lp-section__head">
          <h2>Everything you need,<br /><em>nothing you don't.</em></h2>
          <p>A comment system that stays out of your way.</p>
        </div>
        <div className="lp-features">
          {FEATURES.map((f) => (
            <div key={f.title} className="lp-feature">
              <div className="lp-feature__icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Embed docs ──────────────────────────────── */}
      <section id="embed" className="lp-section lp-section--alt scroll-reveal">
        <div className="lp-section__head">
          <h2>Embed anywhere.<br /><em>In minutes.</em></h2>
          <p>One div. One script. That's it.</p>
        </div>

        <div className="lp-docs">
          <div className="lp-doc-card">
            <div className="lp-doc-card__label">HTML / Script tag</div>
            <pre className="lp-pre">{`<div id="verbi"
  data-page-key="/post/hello"
  data-page-title="Hello World"
  data-site="default"
  data-server="https://comments.example.com">
</div>
<script src="https://comments.example.com/embed.js"></script>`}</pre>
          </div>

          <div className="lp-doc-card">
            <div className="lp-doc-card__label">React / Next.js</div>
            <pre className="lp-pre">{`import VerbiEmbed from "@/components/VerbiEmbed";

<VerbiEmbed
  server="https://comments.example.com"
  pageKey="/post/hello"
  pageTitle="Hello World"
  site="default"
/>`}</pre>
          </div>

          <div className="lp-doc-card lp-doc-card--table">
            <div className="lp-doc-card__label">Configuration</div>
            <table className="lp-table">
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["data-page-key", "location.pathname", "Unique page identifier"],
                  ["data-page-title", "document.title", "Title shown in admin panel"],
                  ["data-site", '"default"', "Multi-site isolation key"],
                  ["data-server", '""', "URL of your Verbi instance"],
                ].map(([attr, def, desc]) => (
                  <tr key={attr}>
                    <td><code>{attr}</code></td>
                    <td className="lp-table__muted">{def}</td>
                    <td>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Live demo ───────────────────────────────── */}
      <section id="live-demo" className="lp-section scroll-reveal">
        <div className="lp-section__head">
          <h2>Live demo.</h2>
          <p>Try it — post a comment below. It's real.</p>
        </div>
        <div className="lp-demo-wrap">
          <CommentList pageKey="/" pageTitle="Verbi Demo" site="default" />
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────── */}
      <footer className="lp-footer">
        <a href="/" className="lp-footer__logo">
          <svg width="20" height="20" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="7" fill="#171717"/>
            <path d="M6 8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H11l-5 4V8z" fill="#e5e5e5"/>
            <path d="M11.5 11h2l2.5 6 2.5-6h2l-3.5 9h-2z" fill="#171717"/>
          </svg>
          Verbi
        </a>
        <span>Self-hosted comments for the open web.</span>
      </footer>
    </div>
  );
}
