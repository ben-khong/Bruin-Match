# Bruin Match

A full-stack web application designed for UCLA students to find and connect with compatible roommates on one centralized platform. Users can create a profile, complete a short lifestyle survey, browse and filter other students by compatibility, send roommate requests, form groups, and communicate with them through the app.

---

## Tech Stack

- **Frontend**: React, React Router
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Auth**: JWT (bcrypt password hashing)

---

## Features

- **Secure authentication** — signup/login with username + email + password (bcrypt hashing, JWT sessions, 7-day expiry)
- **Multi-step onboarding** — 4-step profile + 10-question lifestyle survey
- **Compatibility scoring** — server-ranked match results across 14 lifestyle and housing dimensions
- **Browse & filter** — server-side filtering by academic year, major, housing type, room type, move-in term, and lifestyle preferences with pagination
- **Match requests** — send, accept, decline, cancel, and withdraw roommate requests
- **Roommate groups** — ACID-transactional group formation and merging on request acceptance; leave group support
- **Chat with roommate groups** *(in progress)* — send and receive messages with roommate groups within the app

---

## Repository Structure

```
bruin-match/
├── backend/
│   ├── config/
│   │   ├── db.js           # PostgreSQL connection pool
│   │   └── initDb.js       # Runs schema.sql + migrations on server start
│   ├── middleware/
│   │   └── auth.js         # JWT authentication middleware (shared across routes)
│   ├── routes/
│   │   ├── auth.js         # POST /api/auth/signup, /login
│   │   ├── profile.js      # GET/POST /api/profile
│   │   ├── users.js        # GET /api/users, /api/users/:id
│   │   └── matches.js      # Match requests and group management
│   ├── schema.sql          # Canonical database schema
│   ├── server.js           # Express app setup and server entry point
│   └── .env                # Local environment variables (not committed)
└── frontend/
    └── src/
        ├── components/     # Shared UI components (Sidebar, SidebarLayout)
        ├── constants/      # Static option lists for profile/survey fields
        └── pages/          # One file per route (Home, Login, Signup, Onboarding, Browse, Dashboard, Profile, Matches)
```

---

## Prerequisites

- **Node.js** v20+
- **PostgreSQL** v14+
- **npm** v8+

---

## Setup

### 1. Clone the repo

```bash
git clone
cd bruin-match
```

### 2. Create the PostgreSQL database

```bash
createdb bruin_match
```

> The server automatically runs `schema.sql` on startup via `initDb.js`, so you do not need to run the schema file manually. If you prefer to initialize the DB before starting the server:
> ```bash
> psql -d bruin_match -f backend/schema.sql
> ```

### 3. Configure backend environment

Create `backend/.env` (never commit this file; it is already in `.gitignore`):

```env
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret

PGUSER=your_postgres_user
PGHOST=localhost
PGDATABASE=bruin_match
PGPASSWORD=your_postgres_password
PGPORT=5432
```

### 4. Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 5. Start the servers

In one terminal:

```bash
cd backend
npm start
# Server running on http://localhost:3001
# Database tables are created/migrated automatically on startup
```

In another terminal:

```bash
cd frontend
npm run dev
# App running on http://localhost:5173
```

---

## Database Editing

`schema.sql` is the canonical definition of the database schema. `initDb.js` runs it on every server start (all statements use `CREATE TABLE IF NOT EXISTS`, so existing tables are not affected). It then applies `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migration guards for any columns added after initial deployment.

**To add a new column:**
1. Add it to `schema.sql` (for fresh installs).
2. Add a corresponding `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` block to the migrations section in `backend/config/initDb.js` (for existing installs).

---

