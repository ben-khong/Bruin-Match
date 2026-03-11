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
- **Compatibility explanation** — each card shows exactly which factors you share with that person (FR-8)
- **Browse & filter** — filter by academic year, major, housing type, room type, move-in term, sleep time, noise tolerance, and more
- **Saved filter presets** — save named filter sets and re-apply them in one click (FR-9)
- **Match requests** — send, accept, decline, and cancel roommate requests
- **Roommate groups** — ACID-transactional group formation and merging on request acceptance; leave group support
- **Notifications center** — sidebar badge with live unread count, per-notification read state, mark-all-as-read (FR-10)

---

## Project Structure

```
bruin-match/
├── setup.sh                        # One-command setup and launch script
├── README.md
├── backend/
│   ├── .env                        # Environment variables (credentials) — see below
│   ├── package.json
│   ├── server.js                   # Express app entry point
│   ├── schema.sql                  # Full database schema (all 8 tables)
│   ├── config/
│   │   ├── db.js                   # PostgreSQL connection pool (reads from .env)
│   │   └── initDb.js               # Runs schema.sql + column migrations on startup
│   ├── middleware/
│   │   └── auth.js                 # JWT authentication middleware
│   └── routes/
│       ├── auth.js                 # POST /api/auth/signup  POST /api/auth/login
│       ├── profile.js              # GET/POST /api/profile
│       ├── users.js                # GET /api/users  GET /api/users/:id
│       ├── matches.js              # Match requests and roommate group management
│       ├── filters.js              # Saved filter presets (FR-9)
│       └── notifications.js        # Notifications CRUD (FR-10)
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx                 # Route definitions
        ├── components/
        │   ├── Sidebar.jsx         # Nav sidebar with live notification badge
        │   └── SidebarLayout.jsx   # Layout wrapper for authenticated pages
        ├── constants/
        │   └── profileOptions.js   # Dropdown option lists for profile/survey fields
        └── pages/
            ├── Home.jsx            # Landing page (/)
            ├── Signup.jsx          # (/signup)
            ├── Login.jsx           # (/login)
            ├── Onboarding.jsx      # (/onboarding)
            ├── Dashboard.jsx       # (/dashboard)
            ├── Browse.jsx          # (/browse) — filter, presets, compatibility cards
            ├── Matches.jsx         # (/matches) — sent/incoming requests, group view
            ├── Notifications.jsx   # (/notifications)
            └── Profile.jsx         # (/profile)
```

---

## Prerequisites

Install these before running the app:

**Node.js v20+**
Download from https://nodejs.org — npm is included.

Verify:
```bash
node -v    # should print v20.x.x or higher
npm -v     # should print 8.x.x or higher
```

**PostgreSQL v14+**

On macOS with Homebrew:
```bash
brew install postgresql
brew services start postgresql
```

Verify it is running:
```bash
pg_isready
# expected: /tmp/.s.PGSQL.5432 - accepting connections
```

---

## Environment File (`backend/.env`)

The file `backend/.env` stores database credentials and the JWT signing secret. It is **included in the project tarball** but is not committed to git (listed in `.gitignore`).

Its contents are:

```env
PORT=3001
JWT_SECRET=bruin_match_super_secret_2026
PGUSER=postgres
PGHOST=127.0.0.1
PGDATABASE=bruin_match
PGPASSWORD=postgres
PGPORT=5432
```

If your local PostgreSQL uses a different username or password, edit `PGUSER` and `PGPASSWORD` to match before starting the backend.

> **How to find your PostgreSQL username:** Run `psql -c "\du"` and look at the list of roles. The default macOS Homebrew install creates a role matching your system username, not `postgres`.

---

## Setup & Running

### Option 1 — Automated (recommended)

A single script handles everything: checks PostgreSQL, creates the database, installs all npm packages, and starts both servers.

```bash
cd bruin-match
bash setup.sh
```

When you see the line:
```
App is ready!  Open: http://localhost:5173
```
open **http://localhost:5173** in your browser.

The script is safe to re-run. It kills any leftover processes on ports 3001 and 5173 before starting fresh.

---

### Option 2 — Manual (step by step)

#### Step 1 — Start PostgreSQL

```bash
brew services start postgresql
```

#### Step 2 — Create the database

```bash
psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE bruin_match;"
```

If the database already exists this prints an error — that is fine, continue.

#### Step 3 — Install backend dependencies

`node_modules` is not included in the tarball and must be generated from `package.json`:

```bash
cd bruin-match/backend
npm install
```

This reads `backend/package.json` and downloads all backend packages into `backend/node_modules/`. Packages installed:

| Package | Purpose |
|---|---|
| express | Web server framework |
| pg | PostgreSQL client |
| bcrypt | Password hashing |
| jsonwebtoken | JWT creation and verification |
| dotenv | Loads `.env` into `process.env` |
| cors | Allows frontend (port 5173) to call backend (port 3001) |

#### Step 4 — Install frontend dependencies

```bash
cd bruin-match/frontend
npm install
```

This reads `frontend/package.json` and downloads all frontend packages into `frontend/node_modules/`. Packages installed:

| Package | Purpose |
|---|---|
| react, react-dom | UI framework |
| react-router-dom | Client-side page routing |
| vite | Dev server and build tool |
| @vitejs/plugin-react | React JSX support for Vite |

#### Step 5 — Start the backend

Open a terminal tab and run:

```bash
cd bruin-match/backend
node server.js
```

Expected output:
```
Server running on http://localhost:3001
```

What happens on startup:
1. Loads `backend/.env` into environment variables
2. Connects to PostgreSQL using those credentials
3. Runs `schema.sql` via `initDb.js` — creates all 8 tables if they do not already exist (`CREATE TABLE IF NOT EXISTS`)
4. Applies any column-level migrations (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`)
5. Starts listening on port 3001

You do **not** need to run `schema.sql` manually. The server handles all table creation automatically.

#### Step 6 — Start the frontend

Open a second terminal tab and run:

```bash
cd bruin-match/frontend
npm run dev
```

Expected output:
```
  VITE v7.x.x  ready in Xms

  ➜  Local:   http://localhost:5173/
```

#### Step 7 — Open the app

Go to **http://localhost:5173** in your browser.

`localhost` means "this computer." Both servers run entirely on your local machine — no internet connection is required after dependencies are installed.

---

## API Overview

All API routes are served by the backend on port 3001. The frontend calls them via `fetch('http://localhost:3001/api/...')`.

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | /api/auth/signup | No | Create account |
| POST | /api/auth/login | No | Login, receive JWT |
| GET | /api/profile | Yes | Get own profile |
| POST | /api/profile | Yes | Save/update profile |
| GET | /api/users | Yes | Browse users (filtered, ranked) |
| GET | /api/users/:id | Yes | Single user detail |
| GET | /api/matches | Yes | Sent, incoming, group members |
| POST | /api/matches/request/:userId | Yes | Send match request |
| POST | /api/matches/accept/:requestId | Yes | Accept request (atomic) |
| POST | /api/matches/decline/:requestId | Yes | Decline request |
| DELETE | /api/matches/cancel/:requestId | Yes | Cancel sent request |
| DELETE | /api/matches/leave | Yes | Leave roommate group |
| GET | /api/filters/saved | Yes | List saved filter presets |
| POST | /api/filters/saved | Yes | Save a filter preset |
| DELETE | /api/filters/saved/:id | Yes | Delete a filter preset |
| GET | /api/notifications | Yes | List notifications + unread count |
| PATCH | /api/notifications/read-all | Yes | Mark all notifications read |
| PATCH | /api/notifications/:id/read | Yes | Mark one notification read |

Authenticated routes require the header: `Authorization: Bearer <token>`

---

## Troubleshooting

### "Something went wrong. Please try again." on signup or login

This means the frontend's network request to the backend failed entirely. The backend is not reachable.

Check in this order:

1. **Is the backend running?** The terminal running `node server.js` must show `Server running on http://localhost:3001` and must not have exited.

2. **Is PostgreSQL running?** Run `pg_isready` — it must say `accepting connections`. If not: `brew services start postgresql`

3. **Test the backend directly:**
   ```bash
   curl http://localhost:3001/api/test
   ```
   Should return: `{"message":"Backend is working!"}`

### Backend exits immediately on startup

Read the error message printed before it exits:

| Error message | Fix |
|---|---|
| `ECONNREFUSED 127.0.0.1:5432` | PostgreSQL is not running. Run `brew services start postgresql` |
| `password authentication failed for user "postgres"` | Your PostgreSQL does not have a `postgres` user with password `postgres`. Update `PGUSER` and `PGPASSWORD` in `backend/.env` to match your local PostgreSQL credentials. |
| `database "bruin_match" does not exist` | Run `psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE bruin_match;"` |
| `Cannot find module '...'` | Run `npm install` inside the `backend/` folder |

### Frontend shows blank page or "Cannot GET /"

Run `npm install` inside the `frontend/` folder, then `npm run dev` again.

### Port already in use

```bash
lsof -ti:3001 | xargs kill -9 2>/dev/null; lsof -ti:5173 | xargs kill -9 2>/dev/null
```

Then restart both servers.

### PostgreSQL username is not "postgres"

On a fresh Homebrew install, the default PostgreSQL role matches your macOS username (e.g. `qiqi`), not `postgres`. Find your username:

```bash
whoami
```

Then update `backend/.env`:
```env
PGUSER=your_macos_username
PGPASSWORD=
```

And create the database with that user:
```bash
psql -c "CREATE DATABASE bruin_match;"
```
