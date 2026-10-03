import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Lazy database connection for serverless / Vercel environments
let dbPromise: Promise<void> | null = null;
export function ensureDbConnected(): Promise<void> {
  if (!dbPromise) {
    dbPromise = connectDatabase().catch((err) => {
      console.warn('[DB] Lazy connect warning:', err);
    });
  }
  return dbPromise;
}

app.use(async (_req, _res, next) => {
  await ensureDbConnected();
  next();
});

// Health & Status Route
app.get(['/api/health', '/health'], (_req, res) => {
  const hasAiKey = !!(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);
  res.json({
    status: 'ok',
    app: 'AI Study Assistant',
    aiConfigured: hasAiKey,
    model: process.env.AI_MODEL || 'gemini-3.8-flash',
  });
});

// Mount REST API Routes (supports both /api/* and /* for full serverless platform compatibility)
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/documents', '/documents'], documentRoutes);
app.use(['/api/ai', '/ai'], aiRoutes);
app.use(['/api/quizzes', '/quizzes'], quizRoutes);
app.use(['/api/chats', '/chats'], chatRoutes);

// Database offline / Mongoose fallback error middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (
    err.name === 'MongooseError' ||
    err.name === 'MongoNetworkError' ||
    (err.message && err.message.includes('buffering timed out'))
  ) {
    console.warn('[AI Studio] Database offline — returning graceful response');
    if (req.method === 'GET') {
      return res.json(req.path.endsWith('s') || req.path.endsWith('s/') ? [] : {});
    }
    return res.status(503).json({ error: 'Service temporarily unavailable (database offline)' });
  }
  next(err);
});

export default app;
