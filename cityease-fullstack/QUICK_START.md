# 🚀 QUICK START GUIDE - Fix "Cannot GET /" Error

## ✅ STEP-BY-STEP FIX (2 minutes)

### Step 1: Stop the Server
- In your terminal/PowerShell, press **Ctrl + C** to stop the server
- Wait until you see the command prompt again

### Step 2: Restart the Server

**If you're in the ROOT folder (cityease-fullstack):**
```bash
npm run start:backend
```

**If you're in the BACKEND folder (cityease-fullstack/backend):**
```bash
npm start
```
OR
```bash
npm run start
```

### Step 3: Wait for Success Message
You should see:
```
✅ Connected to PostgreSQL database
✅ Database tables initialized
CityEase backend running on http://localhost:3000
```

### Step 4: Open in Browser
1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Go to: **http://localhost:3000**
3. You should now see a **green "Server is Running"** page! ✅

---

## 🎯 What You Should See

When you visit **http://localhost:3000**, you'll see:
- ✅ Green "Server is Running" status
- 📋 List of all API endpoints
- 🔗 Link to your frontend application
- 🔗 Links to test the API

---

## 🌐 Access Your Frontend

After the server is running:
- **Main page:** http://localhost:3000
- **Frontend app:** http://localhost:3000/sp51.html
- **API health check:** http://localhost:3000/api/health

---

## ⚠️ Still Not Working?

1. **Make sure server is running** - Check terminal for "CityEase backend running"
2. **Check the URL** - Must be exactly: `http://localhost:3000` (not 3001 or other port)
3. **Try hard refresh** - Press `Ctrl + F5` in browser to clear cache
4. **Check terminal errors** - Look for any red error messages

---

## 📞 Quick Test

Open this in your browser to test:
- http://localhost:3000/api/health

If you see `{"ok":true}`, your server is working! ✅

