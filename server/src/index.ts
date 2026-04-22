import 'dotenv/config';
// Supabase uses self-signed intermediate certs — disable strict TLS verification
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import adminRoutes from './routes/admin.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import prisma from './data-source';

import { createServer } from 'http';
import { initSocket } from './socket';
import { startSchedulers } from './schedulers';

const app = express();
const httpServer = createServer(app);
initSocket(httpServer);
const PORT = Number(process.env.PORT) || 5000;
const ENV = process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin || (isProd ? false : '*'),
  credentials: !!corsOrigin,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProd ? 'combined' : 'dev'));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);
app.use('/admin',  adminRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    await connectRedis();
    startSchedulers();
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SafariShare API running on port ${PORT} [${ENV}]`);
      console.log(`📍 http://localhost:${PORT}/api/v1/health`);
      console.log(`📱 LAN: http://0.0.0.0:${PORT} (accessible from mobile)`);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

bootstrap();

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
