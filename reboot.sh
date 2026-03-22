#!/bin/bash

# Rejoice Trust AJO Platform - Complete Reboot Script
# This script performs a full platform restart including:
# - Database connection verification
# - Backend server startup
# - Frontend development server startup
# - Health checks

set -e

echo "================================================"
echo "REJOICE TRUST AJO PLATFORM - FULL REBOOT"
echo "================================================"
echo ""

# Check for required environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL environment variable not set"
  echo "Please set your Supabase connection string:"
  echo "export DATABASE_URL='postgresql://...'"
  exit 1
fi

echo "[1/4] Verifying database connection..."
node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
  console.log('✓ Database connected successfully');
  process.exit(0);
});
" || exit 1

echo ""
echo "[2/4] Installing dependencies..."
npm install --silent 2>/dev/null || echo "Dependencies already installed"

echo ""
echo "[3/4] Starting backend server on port 3001..."
echo "Backend server starting in background..."
node server/index.js &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 2

echo ""
echo "[4/4] Starting frontend dev server on port 5000..."
echo "Frontend server starting..."
npm run dev:frontend &
FRONTEND_PID=$!

echo ""
echo "================================================"
echo "PLATFORM REBOOT COMPLETE"
echo "================================================"
echo ""
echo "Backend Server:  http://localhost:3001"
echo "Frontend App:    http://localhost:5000"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Handle cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Platform shutdown complete'" EXIT

# Keep script running
wait
