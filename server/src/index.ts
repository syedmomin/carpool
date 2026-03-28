import 'dotenv/config';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import prisma from './data-source';

const app    = express();
const PORT   = Number(process.env.PORT) || 5000;
const ENV    = process.env.NODE_ENV || 'development';
const isProd = ENV === 'production';

// ─── Security & Parsing ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isProd ? 'combined' : 'dev'));

// ─── Static uploads ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/v1', routes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🚀 SafariShare API running on port ${PORT} [${ENV}]`);
      console.log(`📍 http://localhost:${PORT}/api/v1/health`);
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
