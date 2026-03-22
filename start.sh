#!/bin/bash

# REJOICE AJO - Full Stack Startup Guide

echo "================================================"
echo "REJOICE AJO - Full Stack Application Setup"
echo "================================================"

# Check if NODE_MODULES exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Check environment variables
if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL environment variable is not set"
  echo ""
  echo "You need to set DATABASE_URL to your Supabase PostgreSQL connection string:"
  echo "export DATABASE_URL='postgresql://user:password@host:port/database'"
  echo ""
  exit 1
fi

echo "✅ DATABASE_URL is configured"

# Start both frontend and backend in the background
echo ""
echo "Starting services..."
echo "  - Backend: http://localhost:3001"
echo "  - Frontend: http://localhost:5000"
echo ""

# Start backend server
echo "🚀 Starting backend server on port 3001..."
node server/index.js &
BACKEND_PID=$!

sleep 2

# Start frontend
echo "🚀 Starting frontend dev server on port 5000..."
npm run dev:frontend &
FRONTEND_PID=$!

echo ""
echo "Services started!"
echo "  Backend PID: $BACKEND_PID"
echo "  Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop both services: pkill -P $$"
echo ""

# Wait for both processes
wait
