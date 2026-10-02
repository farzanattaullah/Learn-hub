import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDatabase } from './server/config/db.js';
import authRoutes from './server/routes/authRoutes.js';
import documentRoutes from './server/routes/documentRoutes.js';
import aiRoutes from './server/routes/aiRoutes.js';
import quizRoutes from './server/routes/quizRoutes.js';
import chatRoutes from './server/routes/chatRoutes.js';

async function startServer() {
  await connectDatabase();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Health & API Status Route
  app.get('/api/health', (_req, res) => {
    const hasAiKey = !!(process.env.GEMINI_API_KEY || process.env.AI_API_KEY);
    res.json({
      status: 'ok',
      app: 'AI Study Assistant',
      aiConfigured: hasAiKey,
      model: process.env.AI_MODEL || 'gemini-3.8-flash',
    });
  });

  // Mount REST API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/documents', documentRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/quizzes', quizRoutes);
  app.use('/api/chats', chatRoutes);

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

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Study Assistant] Full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
