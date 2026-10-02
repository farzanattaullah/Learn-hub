import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { dbStore } from '../config/db.js';
import {
  generateSummaryOnly,
  generateQuestionsOnly,
  explainTopicFromMaterial,
  generateQuizFromMaterial,
  askTutorSourceFirst,
  searchReliableExternalSources,
} from '../services/aiService.js';

const router = Router();

// POST /api/ai/summarize
router.post('/summarize', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.body;
    const doc = await dbStore.getDocumentById(documentId, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const summary = await generateSummaryOnly(doc.title, doc.extractedText);
    const updated = await dbStore.updateDocument(documentId, req.user!.id, { summary });

    return res.json({ summary: updated?.summary || summary });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate AI summary.' });
  }
});

// POST /api/ai/questions
router.post('/questions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId } = req.body;
    const doc = await dbStore.getDocumentById(documentId, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const importantQuestions = await generateQuestionsOnly(doc.title, doc.extractedText);
    const updated = await dbStore.updateDocument(documentId, req.user!.id, {
      importantQuestions,
    });

    return res.json({ importantQuestions: updated?.importantQuestions || importantQuestions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate exam questions.' });
  }
});

// POST /api/ai/explain
router.post('/explain', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, topic } = req.body;
    if (!documentId || !topic) {
      return res.status(400).json({ error: 'Please select a document and a topic to explain.' });
    }

    const doc = await dbStore.getDocumentById(documentId, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    // Check cache first unless forceRefresh is passed
    if (!req.body.forceRefresh && doc.explanationsCache && doc.explanationsCache[topic]) {
      return res.json({ explanation: doc.explanationsCache[topic] });
    }

    const explanation = await explainTopicFromMaterial(doc.extractedText, String(topic));
    const updatedCache = {
      ...(doc.explanationsCache || {}),
      [topic]: explanation,
    };
    await dbStore.updateDocument(documentId, req.user!.id, {
      explanationsCache: updatedCache,
    });

    return res.json({ explanation });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate topic explanation.' });
  }
});

// POST /api/ai/quiz
router.post('/quiz', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, count = 5 } = req.body;
    const doc = await dbStore.getDocumentById(documentId, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const questions = await generateQuizFromMaterial(
      doc.title,
      doc.extractedText,
      Math.min(Math.max(Number(count) || 5, 3), 10)
    );

    const createdQuiz = await dbStore.createQuiz({
      userId: req.user!.id,
      documentId: String(doc._id),
      documentTitle: doc.title,
      title: `${doc.title} — AI Quiz (${new Date().toLocaleDateString()})`,
      questions,
      totalQuestions: questions.length,
      score: null,
      percentage: null,
      userAnswers: [],
      completedAt: null,
    });

    return res.status(201).json({ quiz: createdQuiz });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to generate AI quiz.' });
  }
});

// POST /api/ai/chat (Source-First AI Tutor)
router.post('/chat', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, message, sourceMode } = req.body;
    if (!documentId || !message) {
      return res.status(400).json({ error: 'Document ID and question are required.' });
    }

    const doc = await dbStore.getDocumentById(documentId, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const existingChat = await dbStore.getChatByDocument(documentId, req.user!.id);
    const activeSourceMode: 'pdf_only' | 'pdf_and_external' =
      sourceMode || existingChat?.sourceMode || doc.sourcePreference || 'pdf_only';

    const currentMessages = existingChat?.messages || [];

    const userMsg = {
      id: `msg_u_${Date.now()}`,
      role: 'user' as const,
      content: String(message).trim(),
      sourceType: 'pdf' as const,
      timestamp: new Date().toISOString(),
    };

    // STEP 1: Always search the uploaded study material first!
    const tutorResult = await askTutorSourceFirst(doc, String(message), currentMessages);

    let assistantMsg: any;
    if (tutorResult.foundInMaterial) {
      assistantMsg = {
        id: `msg_a_${Date.now() + 1}`,
        role: 'assistant',
        content: tutorResult.answer,
        sourceType: 'pdf',
        sourceLabel: 'From your uploaded material',
        relevantSection: tutorResult.relevantSection,
        requiresExternalPermission: false,
        timestamp: new Date().toISOString(),
      };
    } else {
      // Not found in uploaded material -> Do NOT answer from general knowledge!
      // Ask student permission with [Yes, use other sources] / [No, stay with my material]
      assistantMsg = {
        id: `msg_a_${Date.now() + 1}`,
        role: 'assistant',
        content:
          "I couldn't find this information in your uploaded material.\n\nWould you like me to find an answer using information from other reliable sources?",
        sourceType: 'not_found',
        sourceLabel: 'Not found in uploaded material',
        requiresExternalPermission: true,
        pendingQuestion: String(message).trim(),
        permissionResolved: false,
        timestamp: new Date().toISOString(),
      };
    }

    const updatedMessages = [...currentMessages, userMsg, assistantMsg];
    const savedChat = await dbStore.saveOrUpdateChat(
      documentId,
      req.user!.id,
      updatedMessages,
      activeSourceMode
    );

    return res.json({
      message: assistantMsg,
      chat: savedChat,
    });
  } catch (err: any) {
    console.error('[AI Tutor] Chat error:', err);
    return res.status(500).json({ error: 'AI Tutor encountered an error processing your question.' });
  }
});

// POST /api/ai/external-search (Triggered when student clicks [Yes, use other sources] or [No, stay with my material])
router.post('/external-search', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { documentId, question, decision, promptMessageId } = req.body;
    if (!documentId || !decision) {
      return res.status(400).json({ error: 'Document ID and decision are required.' });
    }

    const doc = await dbStore.getDocumentById(documentId, req.user!.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const existingChat = await dbStore.getChatByDocument(documentId, req.user!.id);
    const messages = (existingChat?.messages || []).map((m: any) =>
      m.id === promptMessageId ? { ...m, permissionResolved: true } : m
    );

    // IF STUDENT SELECTS NO (Section 13)
    if (decision === 'no') {
      const noMsg = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant' as const,
        content:
          "No problem. I'll only use your uploaded study material for this conversation.",
        sourceType: 'system' as const,
        sourceLabel: 'Source: PDF Only',
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, noMsg];
      await dbStore.updateDocument(documentId, req.user!.id, {
        sourcePreference: 'pdf_only',
      });
      const savedChat = await dbStore.saveOrUpdateChat(
        documentId,
        req.user!.id,
        updatedMessages,
        'pdf_only'
      );

      return res.json({
        message: noMsg,
        sourceMode: 'pdf_only',
        chat: savedChat,
      });
    }

    // IF STUDENT SELECTS YES (Section 14)
    const externalResult = await searchReliableExternalSources(doc.title, String(question || ''));

    const externalMsg = {
      id: `msg_ext_${Date.now()}`,
      role: 'assistant' as const,
      content: externalResult.answer,
      sourceType: 'external' as const,
      sourceLabel: 'Answer from external sources',
      sources: externalResult.sources,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, externalMsg];
    // Remember source preference (Section 16)
    await dbStore.updateDocument(documentId, req.user!.id, {
      sourcePreference: 'pdf_and_external',
    });
    const savedChat = await dbStore.saveOrUpdateChat(
      documentId,
      req.user!.id,
      updatedMessages,
      'pdf_and_external'
    );

    return res.json({
      message: externalMsg,
      sourceMode: 'pdf_and_external',
      chat: savedChat,
    });
  } catch (err: any) {
    console.error('[AI External Search] Error:', err);
    return res.status(500).json({
      error: 'Sorry, we could not reach external educational sources right now. Please try again.',
    });
  }
});

export default router;
