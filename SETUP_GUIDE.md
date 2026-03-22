# REJOICE AJO - Full Stack Application Setup & Testing Guide

## Prerequisites

1. **Node.js** (v18+) installed
2. **Supabase Account** with PostgreSQL database (already configured)
3. **DATABASE_URL** - Your Supabase PostgreSQL connection string

## Step 1: Set Up Environment Variables

The Supabase integration provides all necessary environment variables. Verify they're set:

```bash
# Check if DATABASE_URL is available
echo $DATABASE_URL
```

If not set, add it manually:
```bash
export DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]"
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Start the Application

### Option A: Automated (Recommended)
```bash
chmod +x start.sh
./start.sh
```

This starts both:
- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5000

### Option B: Manual (Separate Terminals)

Terminal 1 - Backend Server:
```bash
npm run dev:backend
```
Expected output:
```
🚀 Rejoice Ajo API running on port 3001
```

Terminal 2 - Frontend:
```bash
npm run dev:frontend
```
Expected output:
```
✓ built in XXXms
Local:    http://localhost:5000/
```

## Step 4: Test the Application

### Test 1: Create Account

1. Open http://localhost:5000
2. Click "Create Account" or navigate to signup
3. Fill in:
   - Username: `testuser123`
   - Email: `test@example.com`
   - Password: `SecurePass123!`
   - Full Name: `Test User`
4. Click "Sign Up"

**Expected Result**: Account created, redirected to dashboard

### Test 2: Login

1. Go to login page
2. Use credentials from Test 1
3. Click "Sign In"

**Expected Result**: Successfully logged in, can see dashboard with groups and leaderboard

### Test 3: Core Features

After logging in, test:
- **Groups**: View available groups, their members, and contribution amounts
- **Leaderboard**: See top savers ranked by total paid
- **Profile**: View and update user profile
- **Notifications**: Check notifications icon
- **Settings**: Access account settings

### Test 4: API Health Check

```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "ok": true,
  "time": "2026-03-22T17:00:00.000Z"
}
```

## Database Schema

Your application uses the following tables in Supabase:

- **users**: User accounts, profiles, authentication
- **groups**: AJO groups (savings circles)
- **slots**: Individual slots in each group
- **payments**: Payment transactions
- **notifications**: User notifications
- **sessions**: Express session store
- **support_tickets**: Customer support tickets
- **audit_logs**: Admin activity logging

## Troubleshooting

### "Connection ECONNREFUSED 127.0.0.1:3001"
- Backend server not running
- Solution: Start backend with `npm run dev:backend`

### "DATABASE_URL is not set"
- Environment variable not configured
- Solution: Export DATABASE_URL or add to .env file

### "database does not exist"
- Supabase database not initialized with schema
- Solution: Check your Supabase project and ensure tables are created

### Login fails with "Unexpected token"
- Backend returning HTML instead of JSON
- Solution: Check backend logs for errors, ensure DATABASE_URL is correct

## Deployment to Vercel

Once tested locally and working:

1. **Ensure all environment variables are added to Vercel**:
   - Go to Project Settings → Environment Variables
   - Add `DATABASE_URL` from Supabase

2. **Deploy**:
   - Push to GitHub
   - Vercel automatically deploys on push

3. **API Routes**: 
   - Backend endpoints automatically become serverless functions at `https://your-domain.vercel.app/api/*`

## Architecture

```
Frontend (React + Vite)
    ↓ (HTTP requests)
Vite Dev Proxy (Port 5000) → Backend Server (Port 3001)
    ↓ (localhost:3001 in dev, /api in production)
Express.js Backend
    ↓ (uses DATABASE_URL)
Supabase PostgreSQL
```

## Support

- Check debug logs in browser console (F12)
- Check backend logs in terminal where server is running
- Verify DATABASE_URL is correct in Supabase dashboard
