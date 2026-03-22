## Rejoice Trust AJO Platform - Reboot Guide

### Quick Reboot

#### On Mac/Linux:
```bash
chmod +x reboot.sh
./reboot.sh
```

#### On Windows:
```bash
reboot.bat
```

---

### Manual Reboot (Step by Step)

#### 1. Set Environment Variables
Your Supabase PostgreSQL connection string must be available as `DATABASE_URL`:

**Mac/Linux:**
```bash
export DATABASE_URL="postgresql://user:password@host:port/database"
```

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="postgresql://user:password@host:port/database"
```

**Windows (Command Prompt):**
```cmd
set DATABASE_URL=postgresql://user:password@host:port/database
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Start Backend Server (Terminal 1)
```bash
npm run dev:backend
```
Backend will start on `http://localhost:3001`

#### 4. Start Frontend Dev Server (Terminal 2)
```bash
npm run dev:frontend
```
Frontend will start on `http://localhost:5000`

#### 5. Access the App
Open your browser: `http://localhost:5000`

---

### What Happens on Reboot

1. **Database Connection Verification** - Confirms Supabase PostgreSQL is reachable
2. **Dependency Installation** - Installs npm packages if needed
3. **Backend Server Startup** - Starts Express.js server on port 3001
4. **Frontend Server Startup** - Starts Vite dev server on port 5000
5. **Health Checks** - Verifies both services are running

---

### Troubleshooting Reboot Issues

**Backend won't start: "Port 3001 already in use"**
```bash
# Mac/Linux - Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Windows - Find and kill process
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

**Database connection fails: "connect ECONNREFUSED"**
- Verify `DATABASE_URL` is set correctly
- Check Supabase project is active
- Confirm PostgreSQL user has access permissions

**Frontend won't connect to backend: "ECONNREFUSED 127.0.0.1:3001"**
- Backend server must be running first
- Check backend logs for errors
- Verify port 3001 is not blocked by firewall

**Dependency installation fails**
```bash
# Clear npm cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

### Production Deployment

Your app is already configured for Vercel deployment:
1. Backend is wrapped as serverless functions in `/api/index.js`
2. Frontend builds to `/dist` for static hosting
3. All environment variables are configured via Supabase integration

Simply click **Publish** in v0 to deploy to Vercel.

---

### Services Overview

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Backend Server | 3001 | http://localhost:3001 | Express.js API |
| Frontend Dev | 5000 | http://localhost:5000 | Vite React App |
| Vite HMR | 5001 | - | Hot Module Reload |

---

### Key Directories

```
/vercel/share/v0-project/
├── server/               # Backend Express.js server
│   └── index.js         # Main backend file
├── src/                 # Frontend React application
│   ├── pages/           # Page components
│   ├── components/      # Reusable components
│   └── lib/             # Utilities and helpers
├── api/                 # Vercel serverless functions
├── scripts/             # Database migrations
└── public/              # Static assets
```

---

### Database Schema

Your Supabase PostgreSQL database includes these main tables:
- `users` - User accounts and profiles
- `groups` - AJO savings groups
- `slots` - Individual seats in groups
- `transactions` - Payment transactions
- `seat_removal_requests` - User requests to exit groups
- `announcements` - Admin announcements
- `contact_info` - Platform contact information
- `notifications` - User notifications
- `audit_logs` - Admin action logs

Run migrations in Supabase SQL Editor if needed:
```sql
-- See /scripts/init-database.sql for initial schema
-- See /scripts/add-features.sql for feature migrations
```

---

### Need Help?

1. Check debug logs: `npm run dev:backend 2>&1 | tee logs.txt`
2. Verify database: Connect directly to Supabase dashboard
3. Test API: `curl http://localhost:3001/api/health`
4. Check network: `ping localhost:3001`
