
# CityEase Full‑Stack (Minimal)
Backend: Node.js + Express + PostgreSQL (Supabase)
Frontend: Your existing `sp51.html` + `api-integration.js`

## 1) Database Setup (Supabase - Free Tier)

### Step 1: Create Supabase Account
1. Go to https://supabase.com
2. Sign up for free (no credit card required)
3. Create a new project
4. Wait 2-3 minutes for database to initialize

### Step 2: Get Database Connection String
1. In Supabase dashboard, go to: **Settings** → **Database**
2. Scroll to "Connection string" section
3. Copy the "URI" connection string (looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres`)
4. Replace `[YOUR-PASSWORD]` with your actual database password (shown when you created the project)

### Step 3: Backend Setup

**Option 1: Install from root (recommended)**
```
npm install
```
This will automatically install backend dependencies.

**Option 2: Install from backend folder**
```
cd backend
npm install
```

Create a `.env` file in the `backend` folder:
```
JWT_SECRET=your_super_secret_jwt_key_change_this
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
PORT=3000
```

Then start the server:

**From root directory:**
```
npm run start:backend
```

**Or from backend directory:**
```
cd backend
npm run start
```

Server runs at http://localhost:3000

**Note:** The database tables (users, bookings) will be created automatically on first run.

## 2) Frontend integration
At the very end of your existing HTML (right before </body>), add:
```html
<script>
  // Optionally point to a deployed API:
  // window.CITYEASE_API_BASE = 'https://your-domain.com';
</script>
<script src="./api-integration.js"></script>
```

This will wire:
- submitRegistration() -> POST /api/auth/register
- submitLogin()        -> POST /api/auth/login
- submitBooking()      -> POST /api/bookings (JWT required)

After login, a JWT is stored in localStorage (`ce_token`).

## 3) Test flow
1. Open your HTML (frontend/sp51.html or your original file).
2. Click "Create one" → register.
3. Login → book a service → proceed → confirm.

## Notes
- **Database:** Using Supabase PostgreSQL (free tier: 500MB storage, 2GB bandwidth)
- Services and professionals are served from simple JSON seed files.
- Payments are a stub endpoint returning ok (Cash on Delivery pattern).
- Extend controllers and DB schema as needed.

## Alternative Free Database Options (India)
If you prefer other free databases:
- **Neon** (PostgreSQL): https://neon.tech (free tier available)
- **Railway** (PostgreSQL): https://railway.app (free tier available)
- **MongoDB Atlas**: https://www.mongodb.com/cloud/atlas (free tier available)
- **PlanetScale** (MySQL): https://planetscale.com (free tier available)

Just update the `DATABASE_URL` in your `.env` file with the connection string from your chosen provider.
