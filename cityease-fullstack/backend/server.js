
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();
app.use(cors({ origin: '*'}));
app.use(express.json());

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

// PostgreSQL connection pool
let db;
async function initDb() {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error('\n❌ ERROR: DATABASE_URL is not set in your .env file!');
    console.error('\n📝 Please create a .env file in the backend folder with:');
    console.error('   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres');
    console.error('   JWT_SECRET=your_secret_key');
    console.error('   PORT=3000\n');
    console.error('💡 Get your connection string from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database\n');
    process.exit(1);
  }

  // Use connection string from environment
  const connectionString = process.env.DATABASE_URL;
  
  // Validate connection string format
  if (!connectionString.includes('postgresql://') && !connectionString.includes('postgres://')) {
    console.error('\n❌ ERROR: Invalid DATABASE_URL format!');
    console.error('   It should start with: postgresql:// or postgres://\n');
    process.exit(1);
  }
  
  // Optimize connection pool for better performance (especially for remote connections)
  db = new Pool({
    connectionString,
    ssl: connectionString.includes('supabase.co') || connectionString.includes('neon.tech') || connectionString.includes('railway.app') 
      ? { rejectUnauthorized: false } 
      : false,
    // Connection pool optimizations
    max: 10, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
    // Keep connections alive for faster subsequent queries
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000
  });

  // Test connection
  try {
    await db.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL database');
  } catch (err) {
    console.error('\n❌ Database connection failed!');
    if (err.code === '28P01') {
      console.error('   Authentication failed - check your password in DATABASE_URL');
      console.error('   Make sure you replaced [YOUR-PASSWORD] with your actual Supabase database password\n');
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('   Cannot reach database server - check your DATABASE_URL host\n');
    } else {
      console.error('   Error:', err.message);
      console.error('   Code:', err.code, '\n');
    }
    console.error('💡 Verify your connection string at: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/database\n');
    process.exit(1);
  }

  // Create tables in parallel for faster initialization
  await Promise.all([
    db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password_hash TEXT,
        phone VARCHAR(20)
      );
    `),
    db.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        service VARCHAR(255),
        sub_service VARCHAR(255),
        professional VARCHAR(255),
        address TEXT,
        datetime VARCHAR(255),
        notes TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)
  ]);

  // Create indexes for faster queries (run after tables are created)
  await Promise.all([
    db.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)'),
    db.query('CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id)'),
    db.query('CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC)')
  ]).catch(() => {
    // Indexes might already exist, ignore errors
  });

  console.log('✅ Database tables initialized');
}

function signToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
    const hash = await bcrypt.hash(password, 10);
    const result = await db.query(
      'INSERT INTO users (name, email, password_hash, phone) VALUES ($1, $2, $3, $4) RETURNING id, name, email, phone',
      [name || '', email, hash, phone || '']
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.json({ user, token });
  } catch (e) {
    if (e.code === '23505' || String(e).includes('unique')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken(user);
    res.json({ user: { id: user.id, name: user.name, email: user.email, phone: user.phone }, token });
  } catch (e) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Services & professionals (read from seed files)
const services = JSON.parse(fs.readFileSync('./services.seed.json', 'utf-8'));
const professionals = JSON.parse(fs.readFileSync('./professionals.seed.json', 'utf-8'));

app.get('/api/services', (req, res) => {
  res.json(services);
});

app.get('/api/professionals', (req, res) => {
  const service = req.query.service;
  if (!service) return res.json(professionals);
  const svc = services.find(s => s.name === service);
  if (!svc) return res.json([]);
  res.json(professionals.filter(p => p.service_id === svc.id));
});

// Bookings
app.post('/api/bookings', auth, async (req, res) => {
  const { service, subService, professional, address, datetime, notes } = req.body;
  if (!service || !address || !datetime) return res.status(400).json({ error: 'Missing required fields' });
  const result = await db.query(
    'INSERT INTO bookings (user_id, service, sub_service, professional, address, datetime, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [req.user.id, service, subService || '', professional || '', address, datetime, notes || '']
  );
  res.json(result.rows[0]);
});

app.get('/api/bookings', auth, async (req, res) => {
  const result = await db.query('SELECT * FROM bookings WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(result.rows);
});

// Payment placeholder
app.post('/api/payment/confirm', auth, async (req, res) => {
  const { bookingId, method } = req.body;
  // In real life, verify payment here.
  res.json({ ok: true, bookingId, method: method || 'Cash' });
});

// Healthcheck
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Root route - Welcome page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>CityEase API Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; }
        .status { background: #27ae60; color: white; padding: 10px; border-radius: 5px; display: inline-block; margin: 10px 0; }
        .endpoint { background: #ecf0f1; padding: 10px; margin: 5px 0; border-radius: 5px; }
        a { color: #3498db; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 CityEase API Server</h1>
        <div class="status">✅ Server is Running!</div>
        <p><strong>Status:</strong> Active</p>
        <p><strong>Version:</strong> 1.0.0</p>
        
        <h2>📋 Available Endpoints:</h2>
        <div class="endpoint"><strong>GET</strong> <a href="/api/health">/api/health</a> - Health check</div>
        <div class="endpoint"><strong>GET</strong> <a href="/api/services">/api/services</a> - Get all services</div>
        <div class="endpoint"><strong>GET</strong> <a href="/api/professionals">/api/professionals</a> - Get professionals</div>
        <div class="endpoint"><strong>POST</strong> /api/auth/register - Register new user</div>
        <div class="endpoint"><strong>POST</strong> /api/auth/login - Login user</div>
        <div class="endpoint"><strong>POST</strong> /api/bookings - Create booking (requires auth)</div>
        <div class="endpoint"><strong>GET</strong> /api/bookings - Get bookings (requires auth)</div>
        
        <h2>🌐 Frontend:</h2>
        <p><a href="/sp51.html">Open Frontend Application</a></p>
        
        <h2>📝 Quick Test:</h2>
        <p>Test the API: <a href="/api/health">/api/health</a></p>
      </div>
    </body>
    </html>
  `);
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`CityEase backend running on http://localhost:${PORT}`);
    console.log(`API available at http://localhost:${PORT}/api`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
});
