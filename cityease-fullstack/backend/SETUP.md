# Quick Setup Guide

## Step 1: Create Supabase Account (if you haven't)
1. Go to https://supabase.com
2. Sign up for free
3. Create a new project
4. Wait 2-3 minutes for database to initialize

## Step 2: Get Your Database Connection String
1. In Supabase dashboard, go to: **Settings** → **Database**
2. Scroll to "Connection string" section
3. **For better performance (recommended):** Select "Connection pooling" tab and copy the "URI" connection string
   - Uses port **6543** (faster, optimized for multiple connections)
   - Looks like: `postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres`
4. **Alternative:** Select "URI" tab for direct connection
   - Uses port **5432** (direct connection)
   - Looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

**💡 Tip:** Use the connection pooler (port 6543) for better performance, especially from India!

## Step 3: Create .env File
Create a file named `.env` in the `backend` folder with this content:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
PORT=3000
```

**Important:** 
- Replace `[YOUR-PASSWORD]` with your actual Supabase database password
- Replace `[YOUR-PROJECT-REF]` with your actual project reference
- If your password contains special characters, you may need to URL-encode them (e.g., `@` becomes `%40`)

## Step 4: Install Dependencies and Start
```bash
npm install
npm run start
```

## Troubleshooting

### "password authentication failed"
- Double-check your password in the DATABASE_URL
- Make sure you're using the database password (not your Supabase account password)
- If password has special characters, try URL-encoding them

### "DATABASE_URL is not set"
- Make sure the `.env` file exists in the `backend` folder
- Make sure the file is named exactly `.env` (not `.env.txt` or `.env.example`)

### "Cannot reach database server"
- Check your internet connection
- Verify the connection string is correct
- Make sure your Supabase project is active (not paused)

