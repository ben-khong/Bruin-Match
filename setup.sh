#!/bin/bash

# ─────────────────────────────────────────────
#  Bruin Match — one-command setup & launch
# ─────────────────────────────────────────────

set -e  # exit on first error

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${BLUE}==============================${NC}"
echo -e "${BLUE}   Bruin Match Setup Script   ${NC}"
echo -e "${BLUE}==============================${NC}"
echo ""

# ── 1. Check Node.js ──────────────────────────
echo -e "${YELLOW}[1/5] Checking Node.js...${NC}"
if ! command -v node &>/dev/null; then
  echo -e "${RED}ERROR: Node.js is not installed.${NC}"
  echo "  Install it from https://nodejs.org (v20 or newer)"
  exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}  Node.js found: $NODE_VERSION${NC}"

# ── 2. Check & start PostgreSQL ───────────────
echo ""
echo -e "${YELLOW}[2/5] Checking PostgreSQL...${NC}"

if ! command -v psql &>/dev/null; then
  echo -e "${RED}ERROR: PostgreSQL is not installed.${NC}"
  echo "  Install it with: brew install postgresql@14"
  exit 1
fi

# Try to start PostgreSQL via brew services if not already running
if ! pg_isready -h 127.0.0.1 -U postgres -q 2>/dev/null; then
  echo "  PostgreSQL not running — attempting to start via brew..."
  if command -v brew &>/dev/null; then
    brew services start postgresql 2>/dev/null || brew services start postgresql@14 2>/dev/null || brew services start postgresql@16 2>/dev/null || true
    sleep 3
  fi
fi

# Final check
if ! pg_isready -h 127.0.0.1 -U postgres -q 2>/dev/null; then
  # Try default user (macOS default postgres install uses system username)
  if pg_isready -q 2>/dev/null; then
    echo -e "${GREEN}  PostgreSQL is running (default socket).${NC}"
  else
    echo -e "${RED}ERROR: PostgreSQL is not running and could not be started automatically.${NC}"
    echo "  Try manually: brew services start postgresql"
    echo "  Then re-run this script."
    exit 1
  fi
else
  echo -e "${GREEN}  PostgreSQL is running on 127.0.0.1:5432${NC}"
fi

# ── 3. Create database if it doesn't exist ────
echo ""
echo -e "${YELLOW}[3/5] Setting up database...${NC}"

# Read credentials from .env
ENV_FILE="$ROOT_DIR/backend/.env"
if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}ERROR: backend/.env not found.${NC}"
  echo "  Expected location: $ENV_FILE"
  exit 1
fi

PGUSER_VAL=$(grep '^PGUSER=' "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r')
PGPASSWORD_VAL=$(grep '^PGPASSWORD=' "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r')
PGHOST_VAL=$(grep '^PGHOST=' "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r')
PGPORT_VAL=$(grep '^PGPORT=' "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r')
PGDATABASE_VAL=$(grep '^PGDATABASE=' "$ENV_FILE" | cut -d '=' -f2 | tr -d '\r')

export PGPASSWORD="$PGPASSWORD_VAL"

# Test connection
if ! psql -U "$PGUSER_VAL" -h "$PGHOST_VAL" -p "$PGPORT_VAL" -d postgres -c "SELECT 1" -q &>/dev/null; then
  echo -e "${RED}ERROR: Cannot connect to PostgreSQL with credentials in backend/.env${NC}"
  echo "  User:     $PGUSER_VAL"
  echo "  Host:     $PGHOST_VAL"
  echo "  Port:     $PGPORT_VAL"
  echo ""
  echo "  Fix: make sure PostgreSQL has a user '$PGUSER_VAL' with password '$PGPASSWORD_VAL'"
  echo "  Or update PGUSER / PGPASSWORD in backend/.env to match your local PostgreSQL."
  exit 1
fi

# Create the database if it doesn't exist
DB_EXISTS=$(psql -U "$PGUSER_VAL" -h "$PGHOST_VAL" -p "$PGPORT_VAL" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$PGDATABASE_VAL'")
if [ "$DB_EXISTS" != "1" ]; then
  psql -U "$PGUSER_VAL" -h "$PGHOST_VAL" -p "$PGPORT_VAL" -d postgres -c "CREATE DATABASE $PGDATABASE_VAL;" -q
  echo -e "${GREEN}  Database '$PGDATABASE_VAL' created.${NC}"
else
  echo -e "${GREEN}  Database '$PGDATABASE_VAL' already exists.${NC}"
fi

unset PGPASSWORD

# ── 4. Install dependencies ───────────────────
echo ""
echo -e "${YELLOW}[4/5] Installing dependencies...${NC}"

echo "  Installing backend packages..."
cd "$ROOT_DIR/backend" && npm install --silent
echo -e "${GREEN}  Backend packages installed.${NC}"

echo "  Installing frontend packages..."
cd "$ROOT_DIR/frontend" && npm install --silent
echo -e "${GREEN}  Frontend packages installed.${NC}"

# ── 5. Start both servers ─────────────────────
echo ""
echo -e "${YELLOW}[5/5] Starting servers...${NC}"
echo ""

# Kill any existing processes on these ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Start backend in background, log to file
cd "$ROOT_DIR/backend"
node server.js > "$ROOT_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo "  Backend starting (PID $BACKEND_PID)..."

# Wait up to 8 seconds for backend to be ready
for i in $(seq 1 8); do
  sleep 1
  if curl -s http://localhost:3001/api/test &>/dev/null; then
    echo -e "${GREEN}  Backend is running on http://localhost:3001${NC}"
    break
  fi
  if [ "$i" -eq 8 ]; then
    echo -e "${RED}ERROR: Backend failed to start. Check backend.log for details:${NC}"
    tail -20 "$ROOT_DIR/backend.log"
    exit 1
  fi
done

# Start frontend in foreground so user sees Vite output
cd "$ROOT_DIR/frontend"
echo -e "${GREEN}  Frontend starting on http://localhost:5173${NC}"
echo ""
echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo -e "${GREEN}  App is ready!  Open: http://localhost:5173  ${NC}"
echo -e "${BLUE}══════════════════════════════════════════════${NC}"
echo ""
echo "  Backend log: $ROOT_DIR/backend.log"
echo "  Press Ctrl+C to stop."
echo ""

npm run dev
