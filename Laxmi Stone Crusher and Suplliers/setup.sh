#!/bin/bash
# Lakshmi Stone Crusher & Suppliers — Setup Script
# Run this script once to install all dependencies and seed the database.
# Usage: bash setup.sh

set -e

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Lakshmi Stone Crusher & Suppliers — Setup  ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "❌  Node.js is not installed."
  echo "    Please install from: https://nodejs.org (choose LTS version)"
  echo "    Or on Mac with Homebrew: brew install node"
  exit 1
fi
echo "✅  Node.js $(node -v) found"

# Check npm
if ! command -v npm &>/dev/null; then
  echo "❌  npm is not installed. Please reinstall Node.js."
  exit 1
fi
echo "✅  npm $(npm -v) found"

# Check Docker (optional, for PostgreSQL)
if command -v docker &>/dev/null; then
  echo "✅  Docker found — will use Docker for PostgreSQL"
  DOCKER=true
else
  echo "⚠️   Docker not found — you will need PostgreSQL installed manually"
  DOCKER=false
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦  Installing server dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd server && npm install && cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦  Installing client dependencies..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd client && npm install && cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🗄️   Setting up PostgreSQL database..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$DOCKER" = true ]; then
  echo "Starting PostgreSQL via Docker..."
  docker run -d \
    --name lsc_postgres \
    -e POSTGRES_USER=lsc_user \
    -e POSTGRES_PASSWORD=lsc_pass \
    -e POSTGRES_DB=lsc_db \
    -p 5432:5432 \
    -v lsc_pgdata:/var/lib/postgresql/data \
    -v "$(pwd)/server/migrations/001_initial.sql:/docker-entrypoint-initdb.d/001_initial.sql" \
    postgres:15-alpine 2>/dev/null || echo "Container may already exist."

  echo "Waiting for PostgreSQL to be ready..."
  sleep 5
  until docker exec lsc_postgres pg_isready -U lsc_user -d lsc_db &>/dev/null; do
    echo "  Still waiting..."
    sleep 3
  done
  echo "✅  PostgreSQL is ready!"
else
  echo "⚠️   Please ensure PostgreSQL is running and create the database:"
  echo ""
  echo "    psql -U postgres -c \"CREATE USER lsc_user WITH PASSWORD 'lsc_pass';\""
  echo "    psql -U postgres -c \"CREATE DATABASE lsc_db OWNER lsc_user;\""
  echo "    psql -U lsc_user -d lsc_db -f server/migrations/001_initial.sql"
  echo ""
  read -p "Press ENTER when database is ready..."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌱  Seeding admin users..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd server && node scripts/seed.js && cd ..

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  ✅  Setup Complete!                         ║"
echo "╚══════════════════════════════════════════════╝"
echo ""
echo "To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd server && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd client && npm run dev"
echo ""
echo "  Open in browser: http://localhost:5173"
echo ""
echo "  Login: admin / admin123"
echo ""
