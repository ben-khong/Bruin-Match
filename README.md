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

## Database Schema

### `users`
Stores authentication credentials.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| username | VARCHAR(50) | Unique, not null |
| email | VARCHAR(255) | Unique, not null |
| password_hash | VARCHAR(255) | bcrypt |
| created_at | TIMESTAMP | |

### `user_profiles`
Stores display and filterable profile data.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| user_id | INTEGER FK | References `users(id)`, unique |
| full_name | VARCHAR(100) | |
| academic_year | VARCHAR(20) | Freshman / Sophomore / Junior / Senior / Grad |
| major | VARCHAR(100) | |
| gender | VARCHAR(50) | |
| contact_info | VARCHAR(255) | |
| housing_type | VARCHAR(50) | Dorms / University Apartments / Off-Campus |
| room_type | VARCHAR(100) | Classic / Deluxe / Suite / etc. |
| move_in_term | VARCHAR(50) | e.g. Fall 2025 |
| created_at | TIMESTAMP | |

### `user_preferences`
Stores 10-question lifestyle survey answers used for compatibility scoring.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| user_id | INTEGER FK | References `users(id)`, unique |
| sleep_time | VARCHAR(100) | |
| wake_time | VARCHAR(100) | |
| thermostat_temp | VARCHAR(100) | |
| guest_policy | VARCHAR(100) | |
| noise_tolerance | VARCHAR(150) | |
| cleanliness_level | VARCHAR(120) | |
| overnight_guest_frequency | VARCHAR(120) | |
| sharing_style | VARCHAR(150) | |
| social_energy | VARCHAR(100) | |
| conflict_style | VARCHAR(120) | |
| created_at | TIMESTAMP | |

> Profile + preferences are written together in a single transaction (`BEGIN` / `COMMIT`) with `ON CONFLICT DO UPDATE` so partial updates are atomic.

### `match_requests`
Tracks roommate request state between users.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| requester_id | INTEGER FK | References `users(id)` |
| recipient_id | INTEGER FK | References `users(id)` |
| status | VARCHAR(20) | `pending` / `accepted` / `declined` |
| created_at | TIMESTAMP | |

### `groups`
Represents a confirmed roommate group.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| created_at | TIMESTAMP | |

### `group_members`
Maps users to their group. A user can only belong to one group at a time.

| Column | Type | Notes |
|---|---|---|
| id | SERIAL PK | |
| group_id | INTEGER FK | References `groups(id)` |
| user_id | INTEGER FK | References `users(id)`, unique |
| joined_at | TIMESTAMP | |

### Editing the Database

`schema.sql` is the canonical definition of the database schema. `initDb.js` runs it on every server start (all statements use `CREATE TABLE IF NOT EXISTS`, so existing tables are not affected). It then applies `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` migration guards for any columns added after initial deployment.

**To add a new column:**
1. Add it to `schema.sql` (for fresh installs).
2. Add a corresponding `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` block to the migrations section in `backend/config/initDb.js` (for existing installs).

---

