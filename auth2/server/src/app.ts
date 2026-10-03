import './config/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { testConnection } from './config/db';
import authRoutes from './routes/auth.routes';

const app = express();

// ─── Security Middleware ───────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: env.clientUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Body Parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 Handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

// ─── Error Handler ────────────────────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Error]', err);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────
async function bootstrap() {
  await testConnection();
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`[Server] Running on http://localhost:${env.port} (${env.nodeEnv})`);
  });
}

bootstrap().catch(console.error);

export default app;
