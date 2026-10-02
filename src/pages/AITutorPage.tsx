import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Trash2,
  FileText,
  Globe,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { StudyDocument, ChatMessage } from '../types/study';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface AITutorPageProps {
  initialDocument?: StudyDocument | null;
  embedded?: boolean;
}

export default function AITutorPage({
  initialDocument = null,
  embedded = false,
}: AITutorPageProps) {
  const { documents, setDocuments, showToast } = useAuth();

  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocument?._id || documents[0]?._id || ''
  );
  const activeDoc =
    documents.find((d) => d._id === selectedDocId) || initialDocument || documents[0] || null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sourceMode, setSourceMode] = useState<'pdf_only' | 'pdf_and_external'>(
    activeDoc?.sourcePreference || 'pdf_only'
  );
  const [input, setInput] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [resolvingMsgId, setResolvingMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialDocument && initialDocument._id !== selectedDocId) {
      setSelectedDocId(initialDocument._id);
    } else if (!selectedDocId && documents.length > 0) {
      setSelectedDocId(documents[0]._id);
    }
  }, [initialDocument, documents, selectedDocId]);

  useEffect(() => {
    if (!activeDoc?._id) return;
    setIsLoadingHistory(true);
    api
      .getChat(activeDoc._id)
      .then((res) => {
        setMessages(res.chat.messages || []);
        setSourceMode(res.chat.sourceMode || activeDoc.sourcePreference || 'pdf_only');
      })
      .catch(() => {
        setMessages([
          {
            id: 'msg_fallback_init',
            role: 'assistant',
            content: `Hello! I am your Source-First AI Tutor for **${activeDoc.title}**. Ask me any question about this material—I will search your uploaded notes first.`,
            sourceType: 'system',
            sourceLabel: 'Source-First AI Tutor',
            timestamp: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => {
        setIsLoadingHistory(false);
      });
  }, [activeDoc?._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  const handleChangeSourceMode = async (newMode: 'pdf_only' | 'pdf_and_external') => {
    setSourceMode(newMode);
    if (!activeDoc) return;
    try {
      await api.updateSourcePreference(activeDoc._id, newMode);
      setDocuments((prev) =>
        prev.map((d) => (d._id === activeDoc._id ? { ...d, sourcePreference: newMode } : d))
      );
      showToast(
        newMode === 'pdf_only'
          ? 'Source mode set to: PDF Only'
          : 'Source mode set to: PDF + External Sources',
        'info'
      );
    } catch {
      // ignore
    }
  };

  const handleSendQuestion = async (questionText?: string) => {
    const textToSend = (questionText ?? input).trim();
    if (!textToSend || !activeDoc || isSending) return;

    if (!questionText) setInput('');
    setIsSending(true);

    // Optimistically append student message
    const tempUserMsg: ChatMessage = {
      id: `temp_u_${Date.now()}`,
      role: 'user',
      content: textToSend,
      sourceType: 'pdf',
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.sendTutorChat(activeDoc._id, textToSend, sourceMode);
      setMessages(res.chat.messages);
    } catch (err: any) {
      showToast(err.message || 'AI Tutor could not process your question.', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const handleExternalPermissionDecision = async (
    msg: ChatMessage,
    decision: 'yes' | 'no'
  ) => {
    if (!activeDoc || resolvingMsgId) return;
    setResolvingMsgId(msg.id);

    try {
      const res = await api.resolveExternalSearch(
        activeDoc._id,
        msg.pendingQuestion || 'Explain this concept',
        decision,
        msg.id
      );
      setMessages(res.chat.messages);
      setSourceMode(res.sourceMode);
      setDocuments((prev) =>
        prev.map((d) =>
          d._id === activeDoc._id ? { ...d, sourcePreference: res.sourceMode } : d
        )
      );
      showToast(
        decision === 'yes'
          ? 'Retrieved verified answer from external educational sources.'
          : 'Stayed with your uploaded study material (Source: PDF Only).',
        decision === 'yes' ? 'success' : 'info'
      );
    } catch (err: any) {
      showToast(err.message || 'External source lookup failed.', 'error');
    } finally {
      setResolvingMsgId(null);
    }
  };

  const handleClearConversation = async () => {
    if (!activeDoc) return;
    try {
      const res = await api.clearChat(activeDoc._id);
      setMessages(res.chat.messages || []);
      showToast('Conversation cleared.', 'info');
    } catch {
      showToast('Failed to clear conversation.', 'error');
    }
  };

  if (!activeDoc) {
    return (
      <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-12 text-center space-y-3">
        <FileText className="w-10 h-10 text-slate-500 mx-auto" />
        <h2 className="text-lg font-bold text-white">No Study Document Available</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Please upload a PDF or TXT study note first so the Source-First AI Tutor can answer questions grounded in your coursework.
        </p>
      </div>
    );
  }

  // Generate document-relevant quick questions + 1 external topic test ("What is quantum computing?")
  const firstTopic = activeDoc.importantTopics?.[0]?.name || 'the main concept';
  const firstDef = activeDoc.importantDefinitions?.[0]?.term || 'multiplexing';
  const suggestedPrompts = [
    `Explain ${firstDef.toLowerCase()}.`,
    `Summarize ${firstTopic} in simple terms.`,
    `What are the most important formulas in this document?`,
    `What is quantum computing?`,
  ];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Top Tutor Control Bar: Document Selector + Source Mode Selector + Clear Chat */}
      <div className="rounded-2xl bg-[#0a1022]/95 border border-white/[0.08] p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Document Selector (hidden if embedded in Document Details) */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 min-w-0">
          {!embedded && (
            <div className="flex-1 min-w-0">
              <label className="block text-[11px] font-mono text-slate-400 mb-1">
                Active Study Material
              </label>
              <select
                value={activeDoc._id}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full bg-[#060a17] border border-white/15 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {documents.map((doc) => (
                  <option key={doc._id} value={doc._id}>
                    {doc.title} ({doc.fileType})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear Current Source Status Indicator (Requirement 16) */}
          <div className="flex items-center gap-2 text-xs font-mono text-sky-300 pt-1 sm:pt-4">
            <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
            <span>
              {sourceMode === 'pdf_only'
                ? 'Source: PDF Only'
                : 'Source: PDF + External Sources'}
            </span>
          </div>
        </div>

        {/* Source Mode Selector (Requirement 15: PDF Only vs PDF + External Sources) */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-xl bg-[#060a17] border border-white/10">
            <button
              type="button"
              onClick={() => handleChangeSourceMode('pdf_only')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                sourceMode === 'pdf_only'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Only</span>
            </button>
            <button
              type="button"
              onClick={() => handleChangeSourceMode('pdf_and_external')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                sourceMode === 'pdf_and_external'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>PDF + External Sources</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClearConversation}
            title="Clear conversation"
            className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-rose-500/15 border border-white/10 hover:border-rose-500/30 text-xs text-slate-300 hover:text-rose-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Quick "Ask about this document" Prompt Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-[11px] font-mono text-slate-400 shrink-0 flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
          Ask about this document:
        </span>
        {suggestedPrompts.map((prompt, idx) => (
          <button
            key={idx}
            type="button"
            disabled={isSending}
            onClick={() => handleSendQuestion(prompt)}
            className="px-3 py-1.5 rounded-lg bg-[#0a1022] hover:bg-indigo-950/60 border border-white/10 hover:border-indigo-500/40 text-xs text-slate-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Chat Messages Viewport */}
      <div className="flex-1 min-h-[420px] max-h-[600px] overflow-y-auto rounded-2xl bg-[#080d1c] border border-white/[0.08] p-4 sm:p-6 space-y-5">
        {isLoadingHistory ? (
          <div className="space-y-4">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-24 rounded-xl bg-white/[0.03] animate-pulse border border-white/[0.05]"
              />
            ))}
          </div>
        ) : (
          messages.map((msg) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                {/* Source Transparency Header Label (Requirement 34) */}
                {!isUser && (
                  <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono">
                    {msg.sourceType === 'pdf' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>From your uploaded material</span>
                        {msg.relevantSection && (
                          <span className="text-slate-400">· {msg.relevantSection}</span>
                        )}
                      </span>
                    )}
                    {msg.sourceType === 'external' && (
                      <span className="text-amber-300 flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Answer from external sources</span>
                      </span>
                    )}
                    {msg.sourceType === 'not_found' && (
                      <span className="text-sky-300 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Not found in uploaded material · Permission Requested</span>
                      </span>
                    )}
                    {msg.sourceType === 'system' && (
                      <span className="text-indigo-400">
                        {msg.sourceLabel || 'Source-First AI Tutor'}
                      </span>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`max-w-3xl rounded-2xl p-4 sm:p-5 text-xs sm:text-sm leading-relaxed space-y-3 ${
                    isUser
                      ? 'bg-indigo-600 text-white'
                      : msg.sourceType === 'external'
                      ? 'bg-[#101830] border border-amber-400/35 text-slate-100'
                      : msg.sourceType === 'not_found'
                      ? 'bg-[#0d162e] border border-sky-400/40 text-slate-100'
                      : 'bg-[#0d1428] border border-white/10 text-slate-100'
                  }`}
                >
                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Interactive Permission Buttons when Information is Not Found in PDF (Requirement 12) */}
                  {msg.requiresExternalPermission && !msg.permissionResolved && (
                    <div className="pt-3 border-t border-white/10 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        disabled={resolvingMsgId === msg.id}
                        onClick={() => handleExternalPermissionDecision(msg, 'yes')}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>
                          {resolvingMsgId === msg.id
                            ? 'Searching reliable sources...'
                            : 'Yes, use other sources'}
                        </span>
                      </button>

                      <button
                        type="button"
                        disabled={resolvingMsgId === msg.id}
                        onClick={() => handleExternalPermissionDecision(msg, 'no')}
                        className="px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 text-slate-200 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                      >
                        No, stay with my material
                      </button>
                    </div>
                  )}

                  {/* External Sources Citations Section (Requirement 14) */}
                  {msg.sourceType === 'external' &&
                    Array.isArray(msg.sources) &&
                    msg.sources.length > 0 && (
                      <div className="pt-3 border-t border-white/10 space-y-2">
                        <p className="text-xs font-semibold text-amber-300 font-mono">
                          Sources:
                        </p>
                        <ul className="space-y-1.5">
                          {msg.sources.map((src, sIdx) => (
                            <li key={sIdx}>
                              <a
                                href={src.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-xs text-sky-300 hover:text-sky-200 underline underline-offset-2"
                              >
                                <ExternalLink className="w-3 h-3 shrink-0" />
                                <span>
                                  {src.title} ({src.domain})
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              </div>
            );
          })
        )}

        {/* Loading Animation */}
        {isSending && (
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-[#0d1428] border border-white/10 max-w-md text-xs text-sky-300">
            <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
            <span>Searching your uploaded study material first...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendQuestion();
        }}
        className="flex items-center gap-3 bg-[#0a1022] border border-white/10 rounded-2xl p-2.5"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isSending}
          placeholder={`Ask a question about "${activeDoc.title}"...`}
          className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>Send</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
