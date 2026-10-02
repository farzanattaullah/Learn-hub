import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Quiz } from '../types/study';

interface ProgressPageProps {
  onSelectQuiz: (quiz: Quiz) => void;
}

export default function ProgressPage({ onSelectQuiz }: ProgressPageProps) {
  const { documents, quizzes } = useAuth();

  const completedQuizzes = quizzes.filter(
    (q) => q.completedAt !== null && q.percentage !== null
  );

  const totalQuestions = quizzes.reduce(
    (sum, q) => sum + (q.totalQuestions || q.questions?.length || 0),
    0
  );

  const averageScore =
    completedQuizzes.length > 0
      ? Math.round(
          completedQuizzes.reduce((sum, q) => sum + (q.percentage || 0), 0) /
            completedQuizzes.length
        )
      : 0;

  const highestScore =
    completedQuizzes.length > 0
      ? Math.max(...completedQuizzes.map((q) => q.percentage || 0))
      : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <p className="text-xs font-mono text-sky-400">Student Learning Analytics</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          Progress &amp; Performance
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
          Track your study coverage, quiz performance, score progression, and recent academic activity.
        </p>
      </div>

      {/* 5 Required Stat Cards: Total Documents, Total Quizzes, Total Questions, Average Score, Highest Score */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Documents', value: documents.length },
          { label: 'Total Quizzes', value: quizzes.length },
          { label: 'Total Questions', value: totalQuestions },
          { label: 'Average Score', value: `${averageScore}%` },
          { label: 'Highest Score', value: `${highestScore}%` },
        ].map((stat, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] space-y-2"
          >
            <span className="text-xs font-medium text-slate-400">{stat.label}</span>
            <p className="text-2xl sm:text-3xl font-bold text-white font-mono tabular-nums">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Charts Grid: Quiz Performance & Score Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Quiz Performance Bar Breakdown */}
        <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Quiz Performance Breakdown
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Accuracy percentage by completed assessment
            </p>
          </div>

          {completedQuizzes.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              Complete a quiz to view performance bars.
            </p>
          ) : (
            <div className="space-y-4">
              {completedQuizzes.slice(0, 6).map((q) => {
                const pct = q.percentage || 0;
                return (
                  <div key={q._id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-200 font-medium truncate max-w-[240px]">
                        {q.title}
                      </span>
                      <span className="font-mono text-sky-400 tabular-nums">
                        {q.score}/{q.totalQuestions} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 2: Score Progression & Recent Activity */}
        <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-5">
          <div>
            <h2 className="text-base font-bold text-white font-display">
              Score Progression &amp; Recent Activity
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Visualizing your mastery trajectory over time
            </p>
          </div>

          <div className="h-44 flex items-end gap-4 pt-6 px-3 border-b border-white/10">
            {(completedQuizzes.length > 0
              ? completedQuizzes.slice(0, 6).reverse()
              : [{ title: 'Baseline', percentage: 0, _id: 'none' }]
            ).map((item, i) => {
              const pct = item.percentage || 0;
              return (
                <div
                  key={item._id || i}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-2"
                >
                  <span className="text-xs font-mono text-indigo-300 tabular-nums">
                    {pct}%
                  </span>
                  <div
                    className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-t from-indigo-600 via-indigo-500 to-sky-400"
                    style={{ height: `${Math.max(pct, 10)}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[70px]">
                    Attempt {i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Quiz History Table */}
      <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
        <h2 className="text-base font-bold text-white font-display">
          Recent Quiz History
        </h2>

        {quizzes.length === 0 ? (
          <p className="text-xs text-slate-400 py-4">No quiz history recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs text-slate-400 font-mono">
                  <th className="py-3 pr-4">Quiz Title</th>
                  <th className="py-3 px-4 text-right">Score</th>
                  <th className="py-3 px-4 text-right">Percentage</th>
                  <th className="py-3 px-4 text-right">Date</th>
                  <th className="py-3 pl-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs sm:text-sm">
                {quizzes.map((q) => {
                  const isDone = q.completedAt !== null && q.score !== null;
                  return (
                    <tr key={q._id} className="hover:bg-white/[0.02]">
                      <td className="py-3.5 pr-4 font-medium text-white">{q.title}</td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-300">
                        {isDone ? `${q.score} / ${q.totalQuestions}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-sky-400 font-semibold">
                        {isDone ? `${q.percentage}%` : 'Pending'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-400">
                        {new Date(q.completedAt || q.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectQuiz(q)}
                          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer whitespace-nowrap"
                        >
                          {isDone ? 'Review / Retry →' : 'Take Quiz →'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
