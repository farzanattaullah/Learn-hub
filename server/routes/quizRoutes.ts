import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';
import { dbStore } from '../config/db.js';

const router = Router();

// GET /api/quizzes
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const quizzes = await dbStore.getQuizzesByUser(req.user!.id);
    return res.json({ quizzes });
  } catch {
    return res.status(500).json({ error: 'Failed to load quizzes.' });
  }
});

// GET /api/quizzes/:id
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const quiz = await dbStore.getQuizById(req.params.id, req.user!.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }
    return res.json({ quiz });
  } catch {
    return res.status(500).json({ error: 'Failed to load quiz.' });
  }
});

// POST /api/quizzes/:id/submit
router.post('/:id/submit', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;
    const quiz = await dbStore.getQuizById(req.params.id, req.user!.id);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found.' });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({ error: 'Answers array is required.' });
    }

    let correctCount = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((q: any, idx: number) => {
      if (Number(answers[idx]) === Number(q.correctAnswer)) {
        correctCount++;
      }
    });

    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    const updatedQuiz = await dbStore.updateQuiz(req.params.id, req.user!.id, {
      score: correctCount,
      totalQuestions,
      percentage,
      userAnswers: answers.map((a: any) => Number(a)),
      completedAt: new Date().toISOString(),
    });

    return res.json({
      quiz: updatedQuiz,
      result: {
        score: correctCount,
        totalQuestions,
        percentage,
        correct: correctCount,
        incorrect: totalQuestions - correctCount,
      },
    });
  } catch {
    return res.status(500).json({ error: 'Failed to submit quiz.' });
  }
});

export default router;
