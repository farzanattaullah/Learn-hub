import React from 'react';
import {
  UploadCloud,
  MessageSquare,
  Brain,
  FileText,
  ArrowRight,
  BarChart2,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AppRoute, StudyDocument, Quiz } from '../types/study';
import CosmicOrbitalSphere3D from '../components/three/CosmicOrbitalSphere3D';

interface DashboardPageProps {
  onNavigate: (route: AppRoute) => void;
  onOpenDocument: (doc: StudyDocument, initialTab?: string) => void;
  onStartQuizForDocument: (doc: StudyDocument) => void;
  onOpenTutorForDocument: (doc: StudyDocument) => void;
  onSelectQuiz: (quiz: Quiz) => void;
}

export default function DashboardPage({
  onNavigate,
  onOpenDocument,
  onStartQuizForDocument,
  onOpenTutorForDocument,
  onSelectQuiz,
}: DashboardPageProps) {
  const { user, documents, quizzes, isLoadingData } = useAuth();

  const completedQuizzes = quizzes.filter((q) => q.completedAt !== null && q.percentage !== null);
  const averageScore =
    completedQuizzes.length > 0
      ? Math.round(
          completedQuizzes.reduce((acc, q) => acc + (q.percentage || 0), 0) /
            completedQuizzes.length
        )
      : 0;

  const questionsPracticed = completedQuizzes.reduce(
    (acc, q) => acc + (q.totalQuestions || q.questions?.length || 0),
    0
  );

  return (
    <div className="space-y-8">
      {/* Hero Banner with 3D Orbital Core (Matches Reference Image "Clarity looks good on you / Welcome back, Alex") */}
      <div className="rounded-2xl bg-[#0a1022] border border-white/[0.08] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-radial from-indigo-600/12 via-sky-500/5 to-transparent pointer-events-none" />

        <div className="lg:col-span-8 relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-xs text-sky-400 font-mono">
            <span>Student Workspace</span>
            <span aria-hidden="true">·</span>
            <span>Source-First AI Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white font-display">
            Welcome back, {user?.name || 'Student'}
          </h1>

          <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
            Upload your lecture PDFs or TXT notes to generate student-friendly summaries, high-yield exam questions, and interactive MCQ quizzes.
          </p>

          {/* Main Action Buttons (Required: Upload Material, Ask AI Tutor, Take Quiz) */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('upload')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-[0_0_24px_rgba(99,102,241,0.4)] flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Material</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('tutor')}
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/10 text-slate-100 text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Ask AI Tutor</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('quizzes')}
              className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.11] border border-white/10 text-slate-100 text-xs sm:text-sm font-medium flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Take Quiz</span>
            </button>
          </div>
        </div>

        {/* Interactive 3D Knowledge Core */}
        <div className="lg:col-span-4 flex items-center justify-center relative z-10">
          <CosmicOrbitalSphere3D compact />
        </div>
      </div>

      {/* 4 Statistics Cards (Required: Total Documents, Total Quizzes, Average Quiz Score, Questions Practiced) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Documents',
            value: documents.length,
            sub: 'PDF & TXT study notes',
          },
          {
            label: 'Total Quizzes',
            value: quizzes.length,
            sub: `${completedQuizzes.length} completed`,
          },
          {
            label: 'Average Quiz Score',
            value: `${averageScore}%`,
            sub: 'Across graded attempts',
          },
          {
            label: 'Questions Practiced',
            value: questionsPracticed,
            sub: 'Active recall MCQs',
          },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] flex flex-col justify-between"
          >
            <span className="text-xs font-medium text-slate-400">{stat.label}</span>
            <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums mt-2">
              {stat.value}
            </p>
            <span className="text-[11px] text-slate-500 mt-1">{stat.sub}</span>
          </div>
        ))}
      </div>

      {/* Main Grid: Recent Documents (Left 7 cols) + Recent Quiz Results & Progress Chart (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Documents Section */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-white/[0.07] pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Recent Documents
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Open your uploaded notes, practice quizzes, or ask the Source-First AI Tutor
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('documents')}
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {isLoadingData ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-20 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.05]"
                />
              ))}
            </div>
          ) : documents.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <FileText className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-medium text-slate-300">
                No study documents uploaded yet
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your first PDF or TXT lecture file to generate AI summaries, exam questions, and quizzes.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('upload')}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Upload Material
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.slice(0, 4).map((doc) => (
                <div
                  key={doc._id}
                  className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] hover:border-white/15 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="min-w-0 space-y-1">
                    <button
                      type="button"
                      onClick={() => onOpenDocument(doc, 'summary')}
                      className="text-sm font-semibold text-white hover:text-sky-300 transition-colors text-left truncate block max-w-full cursor-pointer"
                    >
                      {doc.title}
                    </button>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span>{doc.fileType}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {doc.sourcePreference === 'pdf_and_external'
                          ? 'Source: PDF + External'
                          : 'Source: PDF Only'}
                      </span>
                    </div>
                  </div>

                  {/* Required Buttons: Open, Quiz, AI Tutor */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenDocument(doc, 'summary')}
                      className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-slate-200 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Open
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartQuizForDocument(doc)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-xs font-medium text-indigo-300 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenTutorForDocument(doc)}
                      className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-xs font-medium text-sky-300 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      AI Tutor
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Learning Progress Chart + Recent Quiz Results */}
        <div className="lg:col-span-5 space-y-6">
          {/* Learning Progress Chart Card */}
          <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white font-display">
                  Learning Progress
                </h2>
                <p className="text-xs text-slate-400">
                  Quiz accuracy progression across recent assessments
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('progress')}
                className="text-xs font-medium text-sky-400 hover:text-sky-300 cursor-pointer whitespace-nowrap"
              >
                Analytics →
              </button>
            </div>

            {completedQuizzes.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-400">
                Complete your first quiz to visualize score progression.
              </div>
            ) : (
              <div className="pt-2 space-y-3">
                <div className="flex items-end gap-3 h-32 pt-4 px-2 border-b border-white/10">
                  {completedQuizzes
                    .slice(0, 6)
                    .reverse()
                    .map((quiz, idx) => {
                      const pct = quiz.percentage || 0;
                      return (
                        <div
                          key={quiz._id || idx}
                          className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group"
                        >
                          <span className="text-[10px] font-mono text-sky-300 tabular-nums">
                            {pct}%
                          </span>
                          <div
                            className="w-full max-w-[36px] rounded-t-md bg-gradient-to-t from-indigo-600 to-sky-400 transition-all group-hover:opacity-90"
                            style={{ height: `${Math.max(pct, 12)}%` }}
                          />
                        </div>
                      );
                    })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>Recent Quiz Attempts</span>
                  <span>Avg: {averageScore}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Recent Quiz Results Card */}
          <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <h2 className="text-base font-bold text-white font-display">
                Recent Quiz Results
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('quizzes')}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 cursor-pointer whitespace-nowrap"
              >
                All Quizzes →
              </button>
            </div>

            {quizzes.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">
                No quizzes generated yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {quizzes.slice(0, 4).map((quiz) => {
                  const isDone = quiz.completedAt !== null && quiz.score !== null;
                  return (
                    <button
                      key={quiz._id}
                      type="button"
                      onClick={() => onSelectQuiz(quiz)}
                      className="w-full p-3.5 rounded-xl bg-[#060a17] border border-white/[0.07] hover:border-indigo-500/40 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {quiz.title}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5 tabular-nums">
                          {new Date(quiz.completedAt || quiz.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right shrink-0 font-mono tabular-nums">
                        {isDone ? (
                          <>
                            <p className="text-xs font-bold text-emerald-400">
                              {quiz.score} / {quiz.totalQuestions} ({quiz.percentage}%)
                            </p>
                            <p className="text-[10px] text-slate-400">Completed</p>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-indigo-400">
                            Start Quiz →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
