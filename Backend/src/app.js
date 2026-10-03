require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { env } = require('./config/env');
const { testConnection } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const receptionistRoutes = require('./routes/receptionist.routes');
const memberRoutes = require('./routes/member.routes');
const managerRoutes = require('./routes/manager.routes');
const barRoutes = require('./routes/bar.routes');
const shopRoutes = require('./routes/shop.routes');
const accountantRoutes = require('./routes/accountant.routes');
const adminRoutes = require('./routes/admin.routes');
const ownerRoutes = require('./routes/owner.routes');

const app = express();

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/receptionist', receptionistRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/bar', barRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/accountant', accountantRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Error]', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
async function bootstrap() {
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  try {
    await testConnection();
  } catch (err) {
    console.warn('[DB] Initial connection attempt:', err.message);
  }
}

// Only bootstrap if run directly
if (require.main === module) {
  bootstrap().catch(console.error);
}

module.exports = { app, bootstrap };
