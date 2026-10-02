import React, { useState, useEffect } from 'react';
import {
  Brain,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  FileText,
} from 'lucide-react';
import { Quiz, StudyDocument } from '../types/study';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { fireSuccessConfetti } from '../utils/confetti';

interface QuizzesPageProps {
  initialQuiz?: Quiz | null;
  onOpenDocument: (docId: string) => void;
}

export default function QuizzesPage({
  initialQuiz = null,
  onOpenDocument,
}: QuizzesPageProps) {
  const { quizzes, setQuizzes, documents, showToast } = useAuth();

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(initialQuiz);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [viewResultMode, setViewResultMode] = useState(false);

  // Generator state when on the quiz list screen
  const [selectedDocForNewQuiz, setSelectedDocForNewQuiz] = useState<string>(
    documents[0]?._id || ''
  );
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (initialQuiz) {
      startQuizSession(initialQuiz);
    }
  }, [initialQuiz]);

  useEffect(() => {
    if (!selectedDocForNewQuiz && documents.length > 0) {
      setSelectedDocForNewQuiz(documents[0]._id);
    }
  }, [documents, selectedDocForNewQuiz]);

  const startQuizSession = (quiz: Quiz, showExistingResults = false) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIndex(0);
    if (
      showExistingResults &&
      quiz.completedAt &&
      Array.isArray(quiz.userAnswers) &&
      quiz.userAnswers.length > 0
    ) {
      const restored: Record<number, number> = {};
      quiz.userAnswers.forEach((ans, idx) => {
        restored[idx] = ans;
      });
      setSelectedAnswers(restored);
      setViewResultMode(true);
    } else {
      setSelectedAnswers({});
      setViewResultMode(false);
    }
  };

  const handleSelectOption = (optionIndex: number) => {
    if (viewResultMode) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    const total = activeQuiz.questions.length;
    const answersArray: number[] = [];
    for (let i = 0; i < total; i++) {
      answersArray.push(selectedAnswers[i] ?? -1);
    }

    setIsSubmitting(true);
    try {
      const res = await api.submitQuiz(activeQuiz._id, answersArray);
      setActiveQuiz(res.quiz);
      setQuizzes((prev) =>
        prev.map((q) => (q._id === res.quiz._id ? res.quiz : q))
      );
      setViewResultMode(true);
      if (res.result.percentage >= 70) {
        try {
          fireSuccessConfetti();
        } catch {
          // ignore
        }
      }
      showToast(
        `Quiz Completed! You scored ${res.result.score} / ${res.result.totalQuestions} (${res.result.percentage}%).`,
        'success'
      );
    } catch (err: any) {
      showToast(err.message || 'Failed to submit quiz.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateNewQuiz = async () => {
    if (!selectedDocForNewQuiz) return;
    setIsGenerating(true);
    try {
      const res = await api.generateQuiz(selectedDocForNewQuiz, 5);
      setQuizzes((prev) => [res.quiz, ...prev]);
      showToast('Generated new AI MCQ Quiz!', 'success');
      startQuizSession(res.quiz, false);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate quiz.', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  // ============================================================================
  // VIEW 1: QUIZ RESULT PAGE (Section 23)
  // ============================================================================
  if (activeQuiz && viewResultMode) {
    const total = activeQuiz.questions.length;
    const correctCount =
      activeQuiz.score ??
      activeQuiz.questions.filter(
        (q, idx) => selectedAnswers[idx] === q.correctAnswer
      ).length;
    const incorrectCount = total - correctCount;
    const percentage =
      activeQuiz.percentage ?? Math.round((correctCount / Math.max(total, 1)) * 100);

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveQuiz(null)}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Quizzes</span>
          </button>
        </div>

        {/* Result Summary Banner ("Quiz Completed!") */}
        <div className="rounded-2xl bg-[#0a1022] border-2 border-indigo-500/50 p-6 sm:p-8 space-y-6 shadow-[0_0_45px_rgba(99,102,241,0.15)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <span className="text-xs font-mono text-emerald-400">
                Assessment Graded
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
                Quiz Completed!
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {activeQuiz.title}
              </p>
            </div>

            {/* Required Buttons: Retry Quiz & Back to Document */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => startQuizSession(activeQuiz, false)}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry Quiz</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenDocument(activeQuiz.documentId)}
                className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>Back to Document</span>
              </button>
            </div>
          </div>

          {/* 4 Required Score Readouts: Score, Percentage, Correct, Incorrect */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07]">
              <span className="text-xs text-slate-400">Score</span>
              <p className="text-2xl font-bold text-white font-mono tabular-nums mt-1">
                {correctCount} / {total}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07]">
              <span className="text-xs text-slate-400">Percentage</span>
              <p className="text-2xl font-bold text-sky-400 font-mono tabular-nums mt-1">
                {percentage}%
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07]">
              <span className="text-xs text-slate-400">Correct</span>
              <p className="text-2xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
                {correctCount}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07]">
              <span className="text-xs text-slate-400">Incorrect</span>
              <p className="text-2xl font-bold text-rose-400 font-mono tabular-nums mt-1">
                {incorrectCount}
              </p>
            </div>
          </div>
        </div>

        {/* Question-by-Question Breakdown (Question, Student answer, Correct answer, Explanation) */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-white font-display">
            Answer Explanations
          </h2>

          {activeQuiz.questions.map((q, qIdx) => {
            const userChoice = selectedAnswers[qIdx] ?? activeQuiz.userAnswers?.[qIdx] ?? -1;
            const isCorrect = userChoice === q.correctAnswer;
            const optionLetters = ['A', 'B', 'C', 'D'];

            return (
              <div
                key={qIdx}
                className={`p-6 rounded-2xl border space-y-4 ${
                  isCorrect
                    ? 'bg-[#0a1324] border-emerald-500/35'
                    : 'bg-[#120d1d] border-rose-500/35'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-sm sm:text-base font-semibold text-white">
                    {qIdx + 1}. {q.question}
                  </h3>
                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-rose-400 shrink-0">
                      <XCircle className="w-4 h-4" />
                      Incorrect
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#060a17] border border-white/10">
                    <span className="text-slate-400 block mb-1">Student Answer:</span>
                    <span
                      className={`font-semibold ${
                        isCorrect ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {userChoice >= 0 && q.options[userChoice]
                        ? `Option ${optionLetters[userChoice]}: ${q.options[userChoice]}`
                        : 'Not answered'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#060a17] border border-emerald-500/30">
                    <span className="text-slate-400 block mb-1">Correct Answer:</span>
                    <span className="font-semibold text-emerald-300">
                      Option {optionLetters[q.correctAnswer]}: {q.options[q.correctAnswer]}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.07] text-xs text-slate-300 leading-relaxed">
                  <strong className="text-sky-300">Explanation: </strong>
                  {q.explanation}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: ACTIVE INTERACTIVE MCQ QUIZ PAGE (Section 22)
  // ============================================================================
  if (activeQuiz) {
    const totalQuestions = activeQuiz.questions.length;
    const currentQ = activeQuiz.questions[currentQuestionIndex];
    const progressPct = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);
    const optionLetters = ['Option A', 'Option B', 'Option C', 'Option D'];
    const answeredCount = Object.keys(selectedAnswers).length;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Back & Document Link */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveQuiz(null)}
            className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-white cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Exit Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenDocument(activeQuiz.documentId)}
            className="text-xs font-mono text-sky-400 hover:underline cursor-pointer"
          >
            Back to Document →
          </button>
        </div>

        {/* Quiz Card */}
        <div className="rounded-2xl bg-[#0a1022]/95 border border-white/[0.09] p-6 sm:p-8 space-y-6 shadow-2xl">
          {/* Quiz Title & Question Number */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white font-display">
                {activeQuiz.title}
              </h1>
              <span className="text-xs font-mono text-sky-400 tabular-nums">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all duration-300"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* Question Text */}
          <div className="py-2">
            <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              {currentQ.question}
            </h2>
          </div>

          {/* Options A, B, C, D */}
          <div className="space-y-3">
            {currentQ.options.map((optText, idx) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full p-4 rounded-xl border text-left transition-all flex items-start gap-3.5 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600/25 border-indigo-400 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]'
                      : 'bg-[#060a17] border-white/10 text-slate-200 hover:border-white/25'
                  }`}
                >
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold shrink-0 ${
                      isSelected
                        ? 'bg-indigo-500 text-white'
                        : 'bg-white/[0.06] text-slate-400'
                    }`}
                  >
                    {optionLetters[idx]}
                  </span>
                  <span className="text-xs sm:text-sm leading-relaxed pt-0.5">
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Navigation Footer: Previous, Next, Submit Quiz */}
          <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={currentQuestionIndex === 0}
              onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
              className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-35 text-xs font-semibold text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="text-xs font-mono text-slate-400 tabular-nums">
              {answeredCount} of {totalQuestions} answered
            </span>

            <div className="flex items-center gap-2.5">
              {currentQuestionIndex < totalQuestions - 1 && (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))
                  }
                  className="px-4 py-2.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <span>Next</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitQuiz}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs sm:text-sm font-semibold text-white shadow-[0_0_24px_rgba(99,102,241,0.4)] cursor-pointer whitespace-nowrap"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // VIEW 3: ALL QUIZZES & GENERATOR HUB
  // ============================================================================
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-sky-400">Active Recall Assessment</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            AI MCQ Quizzes
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Practice multiple-choice questions generated strictly from your uploaded study materials.
          </p>
        </div>
      </div>

      {/* Generate New Quiz Bar */}
      {documents.length > 0 && (
        <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <label className="block text-xs font-semibold text-white">
              Generate a Fresh AI Quiz from Your Documents
            </label>
            <select
              value={selectedDocForNewQuiz}
              onChange={(e) => setSelectedDocForNewQuiz(e.target.value)}
              className="w-full bg-[#060a17] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {documents.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.title} ({d.fileType})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={isGenerating}
            onClick={handleGenerateNewQuiz}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap self-end"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGenerating ? 'Generating Quiz...' : 'Generate AI Quiz'}</span>
          </button>
        </div>
      )}

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div className="rounded-2xl bg-[#0a1022]/80 border border-white/[0.08] p-12 text-center space-y-3">
          <Brain className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-base font-semibold text-white">No Quizzes Available Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Select a document above and click &ldquo;Generate AI Quiz&rdquo; to start testing your knowledge.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quizzes.map((quiz) => {
            const isCompleted = quiz.completedAt !== null && quiz.score !== null;
            return (
              <div
                key={quiz._id}
                className="p-6 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white">{quiz.title}</h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                    <span>{quiz.totalQuestions} MCQs</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {isCompleted
                        ? `Completed ${new Date(quiz.completedAt!).toLocaleDateString()}`
                        : `Created ${new Date(quiz.createdAt).toLocaleDateString()}`}
                    </span>
                  </div>

                  {isCompleted && (
                    <div className="pt-2 flex items-center gap-4 font-mono tabular-nums">
                      <div>
                        <span className="text-[11px] text-slate-400 block">Score</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {quiz.score} / {quiz.totalQuestions}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 block">Accuracy</span>
                        <span className="text-lg font-bold text-sky-400">
                          {quiz.percentage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/[0.07] flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => startQuizSession(quiz, false)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {isCompleted ? 'Retry Quiz' : 'Start Quiz'}
                  </button>

                  {isCompleted && (
                    <button
                      type="button"
                      onClick={() => startQuizSession(quiz, true)}
                      className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-slate-200 text-xs font-medium cursor-pointer whitespace-nowrap"
                    >
                      View Results &amp; Explanations
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
