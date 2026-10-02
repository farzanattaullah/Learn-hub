import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Layers,
  HelpCircle,
  Sparkles,
  Brain,
  MessageSquare,
  Copy,
  Bookmark,
  RefreshCw,
  Check,
} from 'lucide-react';
import { StudyDocument, TopicExplanation, Quiz } from '../types/study';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AITutorPage from './AITutorPage';

interface DocumentDetailsPageProps {
  document: StudyDocument;
  initialTab?: string;
  onBack: () => void;
  onStartQuiz: (quiz: Quiz) => void;
  onDocumentUpdated: (updated: StudyDocument) => void;
}

const TABS = [
  { id: 'summary', label: 'SUMMARY', icon: BookOpen },
  { id: 'topics', label: 'IMPORTANT TOPICS', icon: Layers },
  { id: 'questions', label: 'QUESTIONS', icon: HelpCircle },
  { id: 'explanations', label: 'EXPLANATIONS', icon: Sparkles },
  { id: 'quiz', label: 'QUIZ', icon: Brain },
  { id: 'tutor', label: 'AI TUTOR', icon: MessageSquare },
];

export default function DocumentDetailsPage({
  document: doc,
  initialTab = 'summary',
  onBack,
  onStartQuiz,
  onDocumentUpdated,
}: DocumentDetailsPageProps) {
  const { quizzes, setQuizzes, showToast } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Loading states for AI actions
  const [isRegeneratingSummary, setIsRegeneratingSummary] = useState(false);
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // Explanations Tab state
  const [selectedTopicName, setSelectedTopicName] = useState<string>(
    doc.importantTopics?.[0]?.name || ''
  );
  const [customTopicQuery, setCustomTopicQuery] = useState('');
  const [activeExplanation, setActiveExplanation] = useState<TopicExplanation | null>(
    null
  );
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);
  const [copiedQuestion, setCopiedQuestion] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const docQuizzes = quizzes.filter((q) => q.documentId === doc._id);

  const handleExplainTopic = async (topicName: string, forceRefresh = false) => {
    if (!topicName.trim()) return;
    setSelectedTopicName(topicName);
    setActiveTab('explanations');

    if (!forceRefresh && doc.explanationsCache && doc.explanationsCache[topicName]) {
      setActiveExplanation(doc.explanationsCache[topicName]);
      return;
    }

    setIsLoadingExplanation(true);
    try {
      const res = await api.explainTopic(doc._id, topicName, forceRefresh);
      setActiveExplanation(res.explanation);
      onDocumentUpdated({
        ...doc,
        explanationsCache: {
          ...(doc.explanationsCache || {}),
          [topicName]: res.explanation,
        },
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to generate explanation.', 'error');
    } finally {
      setIsLoadingExplanation(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'explanations' && !activeExplanation && selectedTopicName) {
      handleExplainTopic(selectedTopicName);
    }
  }, [activeTab]);

  const handleRegenerateSummary = async () => {
    setIsRegeneratingSummary(true);
    try {
      const res = await api.regenerateSummary(doc._id);
      onDocumentUpdated({ ...doc, summary: res.summary });
      showToast('AI Summary updated from your uploaded material.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not regenerate summary.', 'error');
    } finally {
      setIsRegeneratingSummary(false);
    }
  };

  const handleRegenerateQuestions = async () => {
    setIsRegeneratingQuestions(true);
    try {
      const res = await api.regenerateQuestions(doc._id);
      onDocumentUpdated({ ...doc, importantQuestions: res.importantQuestions });
      showToast('Generated new exam-oriented questions.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Could not generate questions.', 'error');
    } finally {
      setIsRegeneratingQuestions(false);
    }
  };

  const handleCopyQuestion = (questionText: string) => {
    navigator.clipboard?.writeText(questionText);
    setCopiedQuestion(questionText);
    showToast('Question copied to clipboard.', 'info');
    setTimeout(() => setCopiedQuestion(null), 2000);
  };

  const handleToggleSaveQuestion = async (questionText: string) => {
    try {
      const res = await api.toggleSaveQuestion(doc._id, questionText);
      onDocumentUpdated({ ...doc, savedQuestions: res.savedQuestions });
      showToast(
        res.saved ? 'Question saved to your study bookmarks.' : 'Question removed from bookmarks.',
        'info'
      );
    } catch {
      showToast('Failed to update saved question.', 'error');
    }
  };

  const handleGenerateNewQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const res = await api.generateQuiz(doc._id, 5);
      setQuizzes((prev) => [res.quiz, ...prev]);
      showToast('Interactive AI Quiz generated!', 'success');
      onStartQuiz(res.quiz);
    } catch (err: any) {
      showToast(err.message || 'Failed to generate quiz.', 'error');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Document Header */}
      <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to My Documents</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tabular-nums">
            <span>{doc.fileType}</span>
            <span aria-hidden="true">·</span>
            <span>{doc.fileName}</span>
            <span aria-hidden="true">·</span>
            <span className="text-sky-400">
              {doc.sourcePreference === 'pdf_and_external'
                ? 'Source: PDF + External Sources'
                : 'Source: PDF Only'}
            </span>
          </div>
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white font-display">
          {doc.title}
        </h1>

        {/* 6 Required Tabs: SUMMARY | IMPORTANT TOPICS | QUESTIONS | EXPLANATIONS | QUIZ | AI TUTOR */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-white/[0.07]">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
                RAG Pipeline Active · {doc.ragChunks?.length || 5} Semantic Chunks
              </span>
              <span className="text-xs font-mono text-slate-400">
                Clean English Synthesis
              </span>
            </div>
            <button
              type="button"
              disabled={isRegeneratingSummary}
              onClick={handleRegenerateSummary}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRegeneratingSummary ? 'animate-spin' : ''}`}
              />
              <span>{isRegeneratingSummary ? 'Regenerating...' : 'Regenerate RAG Summary'}</span>
            </button>
          </div>

          {/* Short Summary & Detailed Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-display">
                  Short Summary
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400">
                  RAG Executive Brief
                </span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">
                {doc.summary?.shortSummary}
              </p>
            </div>

            <div className="lg:col-span-7 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white font-display">
                  Detailed Summary
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-wider text-sky-400">
                  Multi-Chunk Synthesis
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                {doc.summary?.detailedSummary}
              </p>
            </div>
          </div>

          {/* Key Points */}
          <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display">
              Key Points
            </h2>
            <ul className="space-y-2.5">
              {(doc.summary?.keyPoints || []).map((point, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm text-slate-200 leading-relaxed"
                >
                  <span className="font-mono text-xs text-indigo-400 mt-1 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Important Definitions & Formulas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Important Definitions */}
            <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
              <h2 className="text-base font-bold text-white font-display">
                Important Definitions
              </h2>
              <div className="space-y-3">
                {(doc.importantDefinitions || []).map((def, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] space-y-1"
                  >
                    <p className="text-sm font-semibold text-sky-300">{def.term}</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {def.definition}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Important Formulas & Examples */}
            <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
              <h2 className="text-base font-bold text-white font-display">
                Important Formulas &amp; Examples
              </h2>
              {Array.isArray(doc.summary?.formulas) && doc.summary.formulas.length > 0 ? (
                <div className="space-y-3">
                  {doc.summary.formulas.map((f, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-[#060a17] border border-indigo-500/25 space-y-1.5"
                    >
                      <p className="text-xs font-semibold text-indigo-300">{f.name}</p>
                      <p className="text-sm font-mono font-bold text-white bg-white/[0.03] px-3 py-1.5 rounded-lg">
                        {f.formula}
                      </p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">
                  No mathematical formulas detected in this study material.
                </p>
              )}

              {Array.isArray(doc.summary?.examples) && doc.summary.examples.length > 0 && (
                <div className="pt-2 space-y-2">
                  <h3 className="text-xs font-semibold text-slate-300">
                    Examples from Material
                  </h3>
                  {doc.summary.examples.map((ex, i) => (
                    <p
                      key={i}
                      className="text-xs text-slate-300 bg-[#060a17] p-3 rounded-xl border border-white/[0.06] leading-relaxed"
                    >
                      {ex}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RAG Knowledge Chunks Inspector */}
          {Array.isArray(doc.ragChunks) && doc.ragChunks.length > 0 && (
            <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white font-display">
                    RAG Retrieved Knowledge Chunks
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Semantic passages indexed with BM25 &amp; TF-IDF keywords for grounded summaries, quizzes, and AI tutoring.
                  </p>
                </div>
                <span className="text-xs font-mono text-indigo-400 tabular-nums">
                  {doc.ragChunks.length} Chunks Indexed
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doc.ragChunks.map((chunk) => (
                  <div
                    key={chunk.chunkId}
                    className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-sky-300 truncate">
                        {chunk.sectionTitle}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {chunk.chunkId} · {chunk.wordCount}w
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                      {chunk.content}
                    </p>
                    {Array.isArray(chunk.keywords) && chunk.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {chunk.keywords.slice(0, 6).map((kw) => (
                          <span
                            key={kw}
                            className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-slate-400"
                          >
                            #{kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: IMPORTANT TOPICS */}
      {activeTab === 'topics' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Key syllabus topics extracted from your uploaded document. Click &ldquo;Explain this topic&rdquo; for a deep breakdown.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {(doc.importantTopics || []).map((topic, idx) => (
              <div
                key={idx}
                className="p-6 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-white">{topic.name}</h3>
                    <span className="text-xs font-mono text-sky-400">
                      Importance: {topic.importance || 'High'}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {topic.explanation}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/[0.07] flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleExplainTopic(topic.name)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Explain this topic</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: QUESTIONS */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-400">
              Exam-oriented questions generated strictly from your uploaded material. Copy or bookmark questions for revision.
            </p>
            <button
              type="button"
              disabled={isRegeneratingQuestions}
              onClick={handleRegenerateQuestions}
              className="px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRegeneratingQuestions ? 'animate-spin' : ''}`}
              />
              <span>
                {isRegeneratingQuestions ? 'Generating...' : 'Regenerate Questions'}
              </span>
            </button>
          </div>

          {/* Short-Answer Questions */}
          <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display">
              Short-Answer Questions
            </h2>
            <div className="space-y-3">
              {(doc.importantQuestions?.shortAnswer || []).map((q, idx) => {
                const isSaved = (doc.savedQuestions || []).includes(q.question);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-white">
                        Q{idx + 1}. {q.question}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyQuestion(q.question)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          {copiedQuestion === q.question ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSaveQuestion(q.question)}
                          className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                            isSaved
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <strong className="text-slate-300">Answer Guideline:</strong>{' '}
                      {q.answerHint}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Long-Answer Questions */}
          <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display">
              Long-Answer Questions
            </h2>
            <div className="space-y-3">
              {(doc.importantQuestions?.longAnswer || []).map((q, idx) => {
                const isSaved = (doc.savedQuestions || []).includes(q.question);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-semibold text-white">
                        Q{idx + 1}. {q.question}
                      </p>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyQuestion(q.question)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSaveQuestion(q.question)}
                          className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                            isSaved
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>

                    {Array.isArray(q.keyPointsToInclude) &&
                      q.keyPointsToInclude.length > 0 && (
                        <div className="text-xs text-slate-400 space-y-1">
                          <p className="font-semibold text-slate-300">
                            Key Points to Include:
                          </p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {q.keyPointsToInclude.map((pt, i) => (
                              <li key={i}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Exam-Oriented Questions */}
          <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display">
              Exam-Oriented Questions
            </h2>
            <div className="space-y-3">
              {(doc.importantQuestions?.examOriented || []).map((q, idx) => {
                const isSaved = (doc.savedQuestions || []).includes(q.question);
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-[#060a17] border border-indigo-500/25 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400">
                          <span>{q.marks}</span>
                          <span aria-hidden="true">·</span>
                          <span>{q.frequency}</span>
                        </div>
                        <p className="text-sm font-semibold text-white">{q.question}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyQuestion(q.question)}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleSaveQuestion(q.question)}
                          className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                            isSaved
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                              : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-300'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>{isSaved ? 'Saved' : 'Save'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EXPLANATIONS */}
      {activeTab === 'explanations' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-4">
            <h2 className="text-base font-bold text-white font-display">
              Select a Topic to Explain
            </h2>

            <div className="flex flex-wrap gap-2">
              {(doc.importantTopics || []).map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleExplainTopic(t.name)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    selectedTopicName === t.name
                      ? 'bg-indigo-600 text-white'
                      : 'bg-[#060a17] border border-white/10 text-slate-300 hover:text-white'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customTopicQuery.trim()) {
                  handleExplainTopic(customTopicQuery.trim(), true);
                }
              }}
              className="flex items-center gap-2 pt-2"
            >
              <input
                type="text"
                value={customTopicQuery}
                onChange={(e) => setCustomTopicQuery(e.target.value)}
                placeholder="Or enter any specific concept from this document..."
                className="flex-1 bg-[#060a17] border border-white/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isLoadingExplanation || !customTopicQuery.trim()}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                Explain Concept
              </button>
            </form>
          </div>

          {isLoadingExplanation ? (
            <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-8 text-center space-y-3">
              <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-300">
                Generating simple college-level explanation from your uploaded material...
              </p>
            </div>
          ) : activeExplanation ? (
            <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.07] pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-400">
                    {activeExplanation.sourceLabel || 'From your uploaded material'}
                  </span>
                  <h3 className="text-lg font-bold text-white font-display mt-0.5">
                    {activeExplanation.topic}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => handleExplainTopic(activeExplanation.topic, true)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate</span>
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
                  Simple Explanation
                </h4>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                  {activeExplanation.simpleExplanation}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#060a17] border border-sky-400/25 space-y-1.5">
                <h4 className="text-xs font-semibold text-sky-300">Practical Example</h4>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeExplanation.example}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] space-y-2">
                  <h4 className="text-xs font-semibold text-white">Key Points</h4>
                  <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                    {(activeExplanation.keyPoints || []).map((kp, i) => (
                      <li key={i}>{kp}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] space-y-2">
                  <h4 className="text-xs font-semibold text-white">Important Terms</h4>
                  <div className="space-y-2">
                    {(activeExplanation.importantTerms || []).map((it, i) => (
                      <div key={i} className="text-xs">
                        <span className="font-semibold text-indigo-300">{it.term}: </span>
                        <span className="text-slate-300">{it.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* TAB 5: QUIZ */}
      {activeTab === 'quiz' && (
        <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Document MCQ Quizzes
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Test your active recall with multiple-choice questions generated strictly from {doc.title}.
              </p>
            </div>
            <button
              type="button"
              disabled={isGeneratingQuiz}
              onClick={handleGenerateNewQuiz}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isGeneratingQuiz ? 'Generating AI Quiz...' : 'Generate New AI Quiz'}
              </span>
            </button>
          </div>

          {docQuizzes.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <Brain className="w-8 h-8 text-indigo-400 mx-auto" />
              <p className="text-sm font-medium text-white">
                No quizzes created for this document yet
              </p>
              <button
                type="button"
                disabled={isGeneratingQuiz}
                onClick={handleGenerateNewQuiz}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                Generate Quiz Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {docQuizzes.map((q) => (
                <div
                  key={q._id}
                  className="p-4 rounded-xl bg-[#060a17] border border-white/[0.07] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <h3 className="text-sm font-semibold text-white">{q.title}</h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5 tabular-nums">
                      {q.totalQuestions} Questions ·{' '}
                      {q.completedAt
                        ? `Last Score: ${q.score}/${q.totalQuestions} (${q.percentage}%)`
                        : 'Not yet taken'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartQuiz(q)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                  >
                    {q.completedAt ? 'Review / Retry Quiz' : 'Start Quiz →'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: AI TUTOR */}
      {activeTab === 'tutor' && <AITutorPage initialDocument={doc} embedded />}
    </div>
  );
}
