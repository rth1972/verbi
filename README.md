# Verbi

A lightweight, self-hosted comment system. Drop it into any site — blog, docs, portfolio — and keep full control of your data.

Inspired by [Artalk](https://artalk.js.org/).

## Features

- **Threaded replies** — nested comments with infinite depth and pagination
- **Markdown** — full GFM support (headings, bold, italic, code blocks, tables, lists)
- **Voting** — upvote/downvote with live score updates
- **Self-hosted** — your data, your server, zero telemetry
- **Moderation** — approve, pin, soft-delete comments from the admin dashboard
- **Dark mode** — built-in toggle, persists in localStorage
- **Embed anywhere** — use a script tag on any HTML site, or the React component in Next.js apps
- **Notifications** — email alerts and Telegram messages on new comments
- **Lightweight** — ~40 KB gzipped client bundle

## Quick Start

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone <your-repo> && cd verbi
npm install
cp .env.example .env.local
```

Edit `.env.local` and set at minimum:

```
JWT_SECRET=pick-a-long-random-string
VERBI_ADMIN_EMAIL=admin@example.com
VERBI_ADMIN_PASSWORD=your-password
VERBI_ADMIN_NAME=Admin
```

Then run the setup:

```bash
npm run setup
npm run dev
```

Open http://localhost:3000 to see the landing page. Visit http://localhost:3000/admin to log into the dashboard.

### Configuration

| Variable | Description |
|---|---|
| `JWT_SECRET` | Secret key for admin session tokens |
| `VERBI_ADMIN_EMAIL` | Admin login email |
| `VERBI_ADMIN_PASSWORD` | Admin login password |
| `VERBI_ADMIN_NAME` | Admin display name |
| `SMTP_HOST` | SMTP server for email (blank = disabled) |
| `SMTP_PORT` | SMTP port (default 587) |
| `SMTP_SECURE` | Use TLS (`true`/`false`) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |
| `SMTP_FROM` | Sender address for notification emails |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token (blank = disabled) |
| `TELEGRAM_CHAT_ID` | Telegram chat ID for notifications |
| `NEXT_PUBLIC_SITE_URL` | URL of the site where comments are embedded (used in notification links) |
| `VERBI_SERVER_URL` | URL of the Verbi server itself (for admin links in notifications) |

## Embedding

### Method 1: Script tag (any HTML site)

```html
<div id="verbi"
  data-page-key="/post/hello"
  data-page-title="Hello World"
  data-server="https://comments.yourdomain.com">
</div>
<script src="https://comments.yourdomain.com/embed.js"></script>
```

| Attribute | Description | Default |
|---|---|---|
| `data-page-key` | Unique identifier for the page | `window.location.pathname` |
| `data-page-title` | Page title shown in the admin panel | `document.title` |
| `data-site` | Site namespace for multi-tenancy | `"default"` |
| `data-server` | Verbi server URL | — (required) |

### Method 2: React component (Next.js / React)

```bash
npm install verbi
```

```tsx
import VerbiEmbed from "verbi/components/VerbiEmbed";

<VerbiEmbed
  server="https://comments.yourdomain.com"
  pageKey="/post/hello"
  pageTitle="Hello World"
/>
```

## Admin Dashboard

Visit `/admin` on your Verbi server to:

- Review pending comments and approve or delete them
- Pin important comments to the top of a thread
- View all pages that have comments
- Toggle dark mode

Log in with the email and password set in `.env.local`.

## API

All endpoints are prefixed with `/api`.

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/comments` | — | List comments for a page (`?pageKey=&site=&sort=&page=&limit=`) |
| `POST` | `/api/comments` | — | Create a comment |
| `PUT` | `/api/comments/:id` | Admin | Update comment (approve/pin) |
| `DELETE` | `/api/comments/:id` | Admin | Soft-delete a comment |
| `POST` | `/api/comments/:id/vote` | — | Upvote or downvote |
| `GET` | `/api/pages` | — | List pages with comment counts |
| `GET` | `/api/admin/comments` | Admin | List all comments |
| `POST` | `/api/admin/login` | — | Login or logout |

## Notifications

### Email

Configure SMTP in `.env.local` to receive:
- Admin alerts when a new top-level comment is posted
- Reply notifications to the original comment author (if they provided an email)

Emails are sent via Nodemailer. Works with any SMTP provider (Gmail, Resend, Postmark, Mailgun, etc.).

### Telegram

Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env.local` to receive instant Telegram messages when someone comments. Messages include the comment preview, a link to the page, and a direct link to moderate in the admin panel.

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Using PM2

```bash
npm install -g pm2
pm2 start npm --name verbi -- start
pm2 save
```

### Database

Verbi uses SQLite via Prisma. The database file is `prisma/dev.db`. After pulling updates:

```bash
npx prisma generate
npx prisma db push
```

## Tech Stack

- [Next.js](https://nextjs.org/) 16 — App Router, API routes
- [Prisma](https://prisma.io/) 7 — ORM with SQLite adapter
- [Tailwind CSS](https://tailwindcss.com/) 4 — Styling
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) — SQLite driver
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — Admin auth
- [react-markdown](https://github.com/remarkjs/react-markdown) — Markdown rendering
- [Nodemailer](https://nodemailer.com/) — Email notifications

## License

MIT
