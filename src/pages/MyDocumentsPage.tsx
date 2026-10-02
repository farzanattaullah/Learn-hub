import React, { useState } from 'react';
import {
  FileText,
  Search,
  UploadCloud,
  Trash2,
  BookOpen,
  HelpCircle,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StudyDocument } from '../types/study';

interface MyDocumentsPageProps {
  onOpenDocumentTab: (doc: StudyDocument, tab: string) => void;
  onStartQuizForDocument: (doc: StudyDocument) => void;
  onOpenTutorForDocument: (doc: StudyDocument) => void;
  onNavigateUpload: () => void;
}

export default function MyDocumentsPage({
  onOpenDocumentTab,
  onStartQuizForDocument,
  onOpenTutorForDocument,
  onNavigateUpload,
}: MyDocumentsPageProps) {
  const { documents, setDocuments, showToast, isLoadingData } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [fileFilter, setFileFilter] = useState<'ALL' | 'PDF' | 'TXT'>('ALL');
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<StudyDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = fileFilter === 'ALL' || doc.fileType === fileFilter;
    return matchesSearch && matchesType;
  });

  const handleConfirmDelete = async () => {
    if (!confirmDeleteDoc) return;
    setIsDeleting(true);
    try {
      await api.deleteDocument(confirmDeleteDoc._id);
      setDocuments((prev) => prev.filter((d) => d._id !== confirmDeleteDoc._id));
      showToast(`Deleted "${confirmDeleteDoc.title}".`, 'info');
      setConfirmDeleteDoc(null);
    } catch (err: any) {
      showToast(err.message || 'Failed to delete document.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-sky-400">Study Library</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
            My Documents
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
            Manage all uploaded PDF and TXT materials, summaries, exam questions, and quizzes.
          </p>
        </div>

        <button
          type="button"
          onClick={onNavigateUpload}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          <span>Upload New Material</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#0a1022]/90 border border-white/[0.08] p-4 rounded-2xl">
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title or filename..."
            className="w-full bg-[#060a17] border border-white/10 focus:border-indigo-500 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-[#060a17] border border-white/10 rounded-xl self-start sm:self-auto">
          {(['ALL', 'PDF', 'TXT'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFileFilter(type)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                fileFilter === type
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {type === 'ALL' ? 'All Files' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {isLoadingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="h-44 rounded-2xl bg-white/[0.03] animate-pulse border border-white/[0.06]"
            />
          ))}
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="rounded-2xl bg-[#0a1022]/80 border border-white/[0.08] p-12 text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-500 mx-auto" />
          <h3 className="text-base font-semibold text-white">
            No matching study documents found
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery || fileFilter !== 'ALL'
              ? 'Try clearing your search filter or upload a new file.'
              : 'Upload your first PDF or TXT study note to unlock AI summaries, questions, and quizzes.'}
          </p>
          <button
            type="button"
            onClick={onNavigateUpload}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
          >
            Upload Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredDocs.map((doc) => (
            <div
              key={doc._id}
              className="p-6 rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between space-y-5"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenDocumentTab(doc, 'summary')}
                    className="text-base font-bold text-white hover:text-sky-300 text-left transition-colors cursor-pointer"
                  >
                    {doc.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteDoc(doc)}
                    title="Delete Document"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Unboxed Clean Metadata (File type · Upload date · Processing status) */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                  <span>{doc.fileType}</span>
                  <span aria-hidden="true">·</span>
                  <span>Uploaded {new Date(doc.createdAt).toLocaleDateString()}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-400 capitalize">
                    Status: {doc.processingStatus || 'Ready'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed pt-1">
                  {doc.summary?.shortSummary || doc.extractedText.slice(0, 160)}
                </p>
              </div>

              {/* Required Action Buttons: Open, Summary, Questions, Quiz, AI Tutor, Delete */}
              <div className="pt-3 border-t border-white/[0.07] flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenDocumentTab(doc, 'summary')}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  Open
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDocumentTab(doc, 'summary')}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Summary</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenDocumentTab(doc, 'questions')}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
                  <span>Questions</span>
                </button>
                <button
                  type="button"
                  onClick={() => onStartQuizForDocument(doc)}
                  className="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Brain className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Quiz</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenTutorForDocument(doc)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
                  <span>AI Tutor</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog for Deleting Document */}
      {confirmDeleteDoc && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0b1224] border border-white/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Delete Study Material?</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete{' '}
              <strong className="text-white">{confirmDeleteDoc.title}</strong> and its associated quizzes and chat history?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteDoc(null)}
                className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white cursor-pointer"
              >
                {isDeleting ? 'Deleting...' : 'Delete Document'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
