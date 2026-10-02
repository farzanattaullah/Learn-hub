import { Router, Response } from 'express';
import multer from 'multer';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { dbStore } from '../config/db.js';
import { extractTextFromUploadedFile } from '../services/pdfService.js';
import { analyzeDocumentWithAI } from '../services/aiService.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20 MB limit
  },
  fileFilter: (_req, file, cb) => {
    const lower = file.originalname.toLowerCase();
    const validExt = lower.endsWith('.pdf') || lower.endsWith('.txt');
    const validMime =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'application/octet-stream';

    if (validExt || validMime) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF (.pdf) and Text (.txt) files are allowed.'));
    }
  },
});

// POST /api/documents/upload
router.post(
  '/upload',
  authenticateToken,
  (req: AuthRequest, res: Response, next) => {
    upload.single('file')(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Maximum allowed file size is 20MB.' });
        }
        return res.status(400).json({ error: `File upload error: ${err.message}` });
      } else if (err) {
        return res.status(400).json({ error: err.message || 'Invalid file uploaded.' });
      }
      next();
    });
  },
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      let extractedText = '';
      let fileName = '';
      let fileType: 'PDF' | 'TXT' = 'PDF';
      let fileSize = 0;
      let title = req.body.title ? String(req.body.title).trim() : '';

      if (req.file) {
        fileName = req.file.originalname;
        fileSize = req.file.size;
        const extraction = await extractTextFromUploadedFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        extractedText = extraction.text;
        fileType = extraction.fileType;
        if (!title) {
          title = fileName.replace(/\.(pdf|txt)$/i, '').replace(/[_-]+/g, ' ');
        }
      } else if (req.body.textContent) {
        extractedText = String(req.body.textContent).trim();
        if (extractedText.length < 20) {
          return res.status(400).json({
            error: 'Please provide at least a paragraph of study notes to analyze.',
          });
        }
        title = title || 'Custom Study Notes';
        fileName = req.body.fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.txt`;
        fileType = req.body.fileType === 'PDF' ? 'PDF' : 'TXT';
        fileSize = Buffer.byteLength(extractedText, 'utf-8');
      } else {
        return res.status(400).json({
          error: 'No file or study text provided. Please select a PDF or TXT file to upload.',
        });
      }

      // Analyze with AI + RAG
      const aiAnalysis = await analyzeDocumentWithAI(title, extractedText);

      const createdDoc = await dbStore.createDocument({
        userId,
        title,
        fileName,
        fileType,
        fileSize,
        extractedText: aiAnalysis.cleanText || extractedText,
        ragChunks: aiAnalysis.ragChunks || [],
        summary: aiAnalysis.summary,
        importantTopics: aiAnalysis.importantTopics,
        importantDefinitions: aiAnalysis.importantDefinitions,
        importantQuestions: aiAnalysis.importantQuestions,
        savedQuestions: [],
        explanationsCache: {},
        sourcePreference: 'pdf_only',
        processingStatus: 'ready',
      });

      // Automatically create an initial AI Quiz for this document
      let createdQuiz = null;
      if (Array.isArray(aiAnalysis.quizQuestions) && aiAnalysis.quizQuestions.length > 0) {
        createdQuiz = await dbStore.createQuiz({
          userId,
          documentId: String(createdDoc._id),
          documentTitle: createdDoc.title,
          title: `${createdDoc.title} — AI Practice Quiz`,
          questions: aiAnalysis.quizQuestions,
          totalQuestions: aiAnalysis.quizQuestions.length,
          score: null,
          percentage: null,
          userAnswers: [],
          completedAt: null,
        });
      }

      // Initialize welcome message in AI Tutor chat for this document
      await dbStore.saveOrUpdateChat(
        String(createdDoc._id),
        userId,
        [
          {
            id: `msg_welcome_${Date.now()}`,
            role: 'assistant',
            content: `Hello! I have analyzed **${createdDoc.title}**. Ask me any question about this material—I will always search your uploaded document first before offering external sources.`,
            sourceType: 'system',
            sourceLabel: 'Source-First AI Tutor Ready',
            timestamp: new Date().toISOString(),
          },
        ],
        'pdf_only'
      );

      return res.status(201).json({
        document: createdDoc,
        quiz: createdQuiz,
      });
    } catch (err: any) {
      console.error('[Documents] Upload error:', err);
      return res.status(422).json({
        error:
          err.message ||
          "Sorry, we couldn't process this PDF. Please try another file.",
      });
    }
  }
);

// GET /api/documents
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const docs = await dbStore.getDocumentsByUser(req.user!.id);
    return res.json({ documents: docs });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch your study documents.' });
  }
});

// GET /api/documents/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const doc = await dbStore.getDocumentById(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found or access denied.' });
    }
    return res.json({ document: doc });
  } catch {
    return res.status(500).json({ error: 'Failed to load document details.' });
  }
});

// PATCH /api/documents/:id/source-preference
router.patch('/:id/source-preference', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sourcePreference } = req.body;
    if (sourcePreference !== 'pdf_only' && sourcePreference !== 'pdf_and_external') {
      return res.status(400).json({ error: 'Invalid source preference mode.' });
    }
    const updated = await dbStore.updateDocument(req.params.id, req.user!.id, {
      sourcePreference,
    });
    if (!updated) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Also sync sourceMode in Chat
    const existingChat = await dbStore.getChatByDocument(req.params.id, req.user!.id);
    if (existingChat) {
      await dbStore.saveOrUpdateChat(
        req.params.id,
        req.user!.id,
        existingChat.messages,
        sourcePreference
      );
    }

    return res.json({ document: updated });
  } catch {
    return res.status(500).json({ error: 'Failed to update source preference.' });
  }
});

// POST /api/documents/:id/saved-questions
router.post('/:id/saved-questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { question } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question text is required.' });
    }
    const doc = await dbStore.getDocumentById(req.params.id, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const currentSaved: string[] = Array.isArray(doc.savedQuestions) ? doc.savedQuestions : [];
    const exists = currentSaved.includes(question);
    const updatedSaved = exists
      ? currentSaved.filter((q) => q !== question)
      : [...currentSaved, question];

    const updated = await dbStore.updateDocument(req.params.id, req.user!.id, {
      savedQuestions: updatedSaved,
    });
    return res.json({
      savedQuestions: updated?.savedQuestions || updatedSaved,
      saved: !exists,
    });
  } catch {
    return res.status(500).json({ error: 'Failed to update saved questions.' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const deleted = await dbStore.deleteDocument(req.params.id, req.user!.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Document not found.' });
    }
    return res.json({ message: 'Document and associated study data deleted.' });
  } catch {
    return res.status(500).json({ error: 'Failed to delete document.' });
  }
});

export default router;
