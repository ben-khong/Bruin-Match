# Bruin Match

A full-stack web application for UCLA students to find and connect with compatible roommates. Users sign up, complete a lifestyle survey, browse other students ranked by compatibility score, send roommate requests, form groups, and receive notifications on request activity.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, React Router 7, Vite 7 |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL 14+ |
| Auth | JSON Web Tokens (JWT), bcrypt |

---

## Features

- **Secure authentication** — signup and login with username, email, and password (bcrypt hashing, JWT sessions with 7-day expiry)
- **Multi-step onboarding** — 4-step profile form + 10-question lifestyle survey
- **Compatibility scoring** — all browse results are server-ranked across 14 lifestyle and housing dimensions
- **Compatibility explanation** — each card shows exactly which factors you share with that person.
- **Browse & filter** — filter by academic year, major, housing type, room type, move-in term, sleep time, noise tolerance, and more
- **Saved filter presets** — save named filter sets and re-apply them in one click.
- **Match requests** — send, accept, decline, and cancel roommate requests
- **Roommate groups** — ACID-transactional group formation and merging on request acceptance; leave group support
- **Notifications center** — sidebar badge with live unread count, per-notification read state, mark-all-as-read.

---

## Project Structure

```
bruin-match/
├── setup.sh                        # One-command setup and launch script
├── backend/
│   ├── .env                        # Environment variables (do not commit) — see below
│   ├── server.js                   # Express app entry point
│   ├── schema.sql                  # Full database schema (all 8 tables)
│   ├── config/
│   │   ├── db.js                   # PostgreSQL connection pool
│   │   └── initDb.js               # Runs schema.sql + column migrations on startup
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   └── routes/
│       ├── auth.js                 # POST /api/auth/signup  POST /api/auth/login
│       ├── profile.js              # GET/POST /api/profile
│       ├── users.js                # GET /api/users  GET /api/users/:id
│       ├── matches.js              # Match requests and roommate group management
│       ├── filters.js              # Saved filter presets
│       └── notifications.js        # Notifications CRUD
└── frontend/
    └── src/
        ├── App.jsx                 # Route definitions
        ├── components/
        │   ├── Sidebar.jsx         # Nav sidebar with live notification badge
        │   └── SidebarLayout.jsx   # Layout wrapper for authenticated pages
        ├── constants/
        │   └── profileOptions.js   # Dropdown option lists for profile/survey fields
        └── pages/
            ├── Home.jsx            # (/)
            ├── Signup.jsx          # (/signup)
            ├── Login.jsx           # (/login)
            ├── Onboarding.jsx      # (/onboarding)
            ├── Dashboard.jsx       # (/dashboard)
            ├── Browse.jsx          # (/browse)
            ├── Matches.jsx         # (/matches)
            ├── Notifications.jsx   # (/notifications)
            └── Profile.jsx         # (/profile)
```

---

## Prerequisites

- **Node.js v20+** — download from https://nodejs.org (npm is included)
- **PostgreSQL v14+** — download from https://www.postgresql.org/download/

**Windows** — download and run the installer from https://www.postgresql.org/download/windows/. During installation, set a password for the `postgres` user and keep the default port (5432). After installation, PostgreSQL runs automatically as a Windows service. You can verify or restart it from **Services** (`services.msc`) or via PowerShell (run as Administrator):
```powershell
Get-Service postgresql*
Start-Service postgresql*   # if not already running
```

**macOS** — install and start via Homebrew:
```bash
brew install postgresql
brew services start postgresql
```

Verify it's running:
```bash
pg_isready
# expected: /tmp/.s.PGSQL.5432 - accepting connections
```

---

## Environment File (`backend/.env`)

`backend/.env` is included in the project tarball but not committed to git. Its default contents:

```env
PORT=3001
JWT_SECRET=bruin_match_super_secret_2026
PGUSER=postgres
PGHOST=127.0.0.1
PGDATABASE=bruin_match
PGPASSWORD=postgres
PGPORT=5432
```

If your local PostgreSQL uses a different username or password, update `PGUSER` and `PGPASSWORD` before starting the backend.

> **Finding your PostgreSQL username:** Run `psql -c "\du"` to list roles. On Windows the installer creates a `postgres` role with whatever password you set during installation. On macOS (Homebrew) the default role matches your system username, not `postgres`.

---

## Setup & Running

### Option 1 — Automated (macOS only)

```bash
cd bruin-match
bash setup.sh
```

The script checks PostgreSQL, creates the database, installs all dependencies, and starts both servers. When you see:
```
App is ready!  Open: http://localhost:5173
```
open **http://localhost:5173** in your browser. The script is safe to re-run.

> **Windows users:** `setup.sh` is a bash script and won't run natively on Windows. Use Option 2 below, or run the script inside [Git Bash](https://gitforwindows.org/) or WSL.

---

### Option 2 — Manual (macOS and Windows)

#### 1. Create the database

**macOS:**
```bash
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE bruin_match;"
```

**Windows** (run in Command Prompt or PowerShell):
```powershell
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE bruin_match;"
```

If `psql` is not recognized on Windows, add PostgreSQL's `bin` folder to your PATH (e.g. `C:\Program Files\PostgreSQL\16\bin`), or run the command from that directory directly.

If the database already exists this prints an error — that's fine, continue.

#### 2. Install dependencies

```bash
cd bruin-match/backend && npm install
cd ../frontend && npm install
```

#### 3. Start the backend

```bash
cd bruin-match/backend
npm start
# Server running on http://localhost:3001
```

On startup the server automatically creates all 8 database tables from `schema.sql` — you do not need to run it manually.

#### 4. Start the frontend

In a second terminal:

```bash
cd bruin-match/frontend
npm run dev
# App running on http://localhost:5173
```

---

## Troubleshooting

### "Something went wrong" on signup or login

The frontend can't reach the backend. Check:

1. Is `node server.js` still running in its terminal?
2. Is PostgreSQL running? Run `pg_isready` (macOS) or check Services (Windows)
3. Test the backend directly: `curl http://localhost:3001/api/test` — should return `{"message":"Backend is working!"}`

### Backend exits immediately on startup

| Error | Fix |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL isn't running. macOS: `brew services start postgresql` — Windows: start the service via `services.msc` or `Start-Service postgresql*` in PowerShell |
| `password authentication failed` | Update `PGUSER`/`PGPASSWORD` in `backend/.env` to match your local credentials |
| `database "bruin_match" does not exist` | Run `psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE bruin_match;"` |
| `Cannot find module` | Run `npm install` inside `backend/` |

### Port already in use

**macOS:**
```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null
```

**Windows** (PowerShell):
```powershell
Stop-Process -Id (Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue).OwningProcess -Force 2>$null
Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -Force 2>$null
```

Then restart both servers.

---

## Database Schema

`schema.sql` is the canonical schema definition. `initDb.js` runs it on every server start using `CREATE TABLE IF NOT EXISTS`, so existing data is never affected.

**To add a new column:**
1. Add it to `schema.sql` (for fresh installs).
2. Add a corresponding `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` block to the migrations section in `backend/config/initDb.js` (for existing installs).
