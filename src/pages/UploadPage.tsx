import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  Sparkles,
  BookOpen,
  HelpCircle,
  Brain,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StudyDocument, Quiz } from '../types/study';

interface UploadPageProps {
  onOpenDocumentTab: (doc: StudyDocument, tab: string) => void;
  onStartQuiz: (quiz: Quiz, doc: StudyDocument) => void;
  onOpenTutor: (doc: StudyDocument) => void;
}

const SAMPLE_MATERIALS = [
  {
    title: 'Operating Systems — Virtual Memory & Paging',
    fileType: 'PDF' as const,
    content: `UNIT 4: VIRTUAL MEMORY, PAGING & PAGE REPLACEMENT ALGORITHMS
1. Virtual Memory Concept
Virtual memory is a memory management technique that provides an idealized abstraction of the storage resources actually available on a given machine, creating the illusion to users of a very large (main) memory. It separates logical memory as perceived by users from physical RAM. Demand paging loads pages into physical memory only when a page fault occurs during execution.

2. Page Table & Translation Lookaside Buffer (TLB)
Paging divides physical memory into fixed-size blocks called frames and logical memory into blocks of the same size called pages. A Page Table translates logical page numbers into physical frame numbers.
- Effective Access Time (EAT) Formula: EAT = α × (T_tlb + T_mem) + (1 - α) × (T_tlb + 2 × T_mem), where α is the TLB hit ratio, T_tlb is TLB lookup time, and T_mem is main memory access time.

3. Page Replacement Algorithms
When a page fault occurs and no free frames exist, the OS selects a victim frame to swap out:
- FIFO (First-In, First-Out): Replaces the oldest page in memory. Suffers from Belady's Anomaly (increasing frames can increase page faults).
- Optimal (OPT): Replaces the page that will not be used for the longest period of time in the future. Guarantees the lowest page-fault rate but requires future knowledge.
- LRU (Least Recently Used): Replaces the page that has not been used for the longest period of time in the past. Free from Belady's Anomaly.

4. Thrashing
Thrashing occurs when a process spends more time paging (swapping pages in and out of disk) than executing instructions because its working set exceeds allocated physical frames.`,
  },
  {
    title: 'Database Management Systems — Normalization & ACID',
    fileType: 'TXT' as const,
    content: `MODULE 3: RELATIONAL NORMALIZATION & TRANSACTION PROCESSING
1. Functional Dependencies & Normal Forms
Normalization is the systematic process of decomposing relational tables to eliminate data redundancy and prevent insertion, update, and deletion anomalies.
- First Normal Form (1NF): Every attribute must contain only atomic (indivisible) values, with no repeating groups.
- Second Normal Form (2NF): Must be in 1NF and contain no partial functional dependencies (non-prime attributes must depend on the entire composite primary key).
- Third Normal Form (3NF): Must be in 2NF and contain no transitive dependencies (non-prime attributes must not depend on other non-prime attributes).
- Boyce-Codd Normal Form (BCNF): For every non-trivial functional dependency X -> Y, X must be a superkey.

2. Transaction ACID Properties
A transaction is a single logical unit of work that accesses and updates database items:
- Atomicity: Either all operations of the transaction are reflected properly in the database, or none are ("all-or-nothing" via shadow paging or undo logs).
- Consistency: Execution of a transaction in isolation preserves the integrity constraints of the database.
- Isolation: Concurrent transactions execute without interfering with each other's intermediate states (enforced via Two-Phase Locking 2PL or Timestamp Ordering).
- Durability: Once a transaction commits, its changes persist even in the event of a system crash (via Write-Ahead Logging WAL).`,
  },
];

export default function UploadPage({
  onOpenDocumentTab,
  onStartQuiz,
  onOpenTutor,
}: UploadPageProps) {
  const { refreshUserData, showToast } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customTitle, setCustomTitle] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [readyResult, setReadyResult] = useState<{
    document: StudyDocument;
    quiz: Quiz | null;
  } | null>(null);

  const validateAndSelectFile = (file: File) => {
    setErrorMessage('');
    setReadyResult(null);
    const lower = file.name.toLowerCase();
    if (!lower.endsWith('.pdf') && !lower.endsWith('.txt')) {
      setErrorMessage('Invalid file format. Please upload a PDF (.pdf) or Text (.txt) file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('File is too large. Maximum allowed file size is 20MB.');
      return;
    }
    setSelectedFile(file);
    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.(pdf|txt)$/i, '').replace(/[_-]+/g, ' '));
    }
  };

  const simulateProgressTimers = () => {
    setUploadProgress(25);
    setProcessingProgress(10);
    setProcessingStage('Uploading & validating file...');

    const t1 = setTimeout(() => {
      setUploadProgress(100);
      setProcessingProgress(40);
      setProcessingStage('Analyzing your study material... Extracting text');
    }, 350);

    const t2 = setTimeout(() => {
      setProcessingProgress(75);
      setProcessingStage('Generating AI summary, important topics, exam questions & quiz...');
    }, 850);

    return [t1, t2];
  };

  const handleUploadSubmit = async () => {
    setErrorMessage('');
    setIsProcessing(true);
    const timers = simulateProgressTimers();

    try {
      let res: { document: StudyDocument; quiz: Quiz | null };
      if (mode === 'file') {
        if (!selectedFile) {
          throw new Error('Please choose a PDF or TXT file to upload.');
        }
        res = await api.uploadDocumentFile(selectedFile, customTitle.trim() || undefined);
      } else {
        if (!pastedText.trim() || pastedText.trim().length < 25) {
          throw new Error('Please paste at least a short paragraph of study notes.');
        }
        res = await api.uploadDocumentText(
          customTitle.trim() || 'Uploaded Lecture Notes',
          pastedText.trim(),
          'TXT'
        );
      }

      timers.forEach(clearTimeout);
      setUploadProgress(100);
      setProcessingProgress(100);
      setProcessingStage('Your study material is ready!');
      await refreshUserData();
      setReadyResult(res);
      showToast(`"${res.document.title}" analyzed and ready!`, 'success');
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setErrorMessage(
        err.message || "Sorry, we couldn't process this PDF. Please try another file."
      );
      setUploadProgress(0);
      setProcessingProgress(0);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickSampleUpload = async (sample: (typeof SAMPLE_MATERIALS)[0]) => {
    setErrorMessage('');
    setReadyResult(null);
    setIsProcessing(true);
    const timers = simulateProgressTimers();

    try {
      const res = await api.uploadDocumentText(sample.title, sample.content, sample.fileType);
      timers.forEach(clearTimeout);
      setUploadProgress(100);
      setProcessingProgress(100);
      setProcessingStage('Your study material is ready!');
      await refreshUserData();
      setReadyResult(res);
      showToast(`Analyzed "${res.document.title}"!`, 'success');
    } catch (err: any) {
      timers.forEach(clearTimeout);
      setErrorMessage(err.message || 'Failed to analyze sample study material.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="space-y-1.5">
        <p className="text-xs font-mono text-sky-400">AI Document Analyzer</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-white font-display">
          Upload Study Material
        </h1>
        <p className="text-sm text-slate-400">
          Upload PDF lecture slides or TXT notes. AI extracts text and generates your summary, key points, important questions, and MCQ quiz.
        </p>
      </div>

      {/* Mode Switcher */}
      <div className="inline-flex p-1 rounded-xl bg-[#0a1022] border border-white/[0.08]">
        <button
          type="button"
          onClick={() => {
            setMode('file');
            setErrorMessage('');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            mode === 'file'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Upload PDF / TXT File
        </button>
        <button
          type="button"
          onClick={() => {
            setMode('paste');
            setErrorMessage('');
          }}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
            mode === 'paste'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Paste Study Notes (TXT)
        </button>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-3 text-xs text-rose-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Ready State Card ("Your study material is ready!") */}
      {readyResult && (
        <div className="p-6 sm:p-8 rounded-2xl bg-[#0b152b] border-2 border-emerald-500/50 shadow-[0_0_40px_rgba(16,185,129,0.15)] space-y-5">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-mono text-emerald-400">
                AI Processing Complete
              </span>
              <h2 className="text-xl font-bold text-white font-display mt-0.5">
                Your study material is ready!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                Analyzed <strong className="text-white">{readyResult.document.title}</strong> ({readyResult.document.fileType}) — generated summary, {readyResult.document.importantTopics?.length || 0} important topics, {readyResult.document.importantDefinitions?.length || 0} definitions, exam questions, and an interactive quiz.
              </p>
            </div>
          </div>

          {/* Required 4 Action Buttons: View Summary, Important Questions, Take Quiz, Ask AI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenDocumentTab(readyResult.document, 'summary')}
              className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Summary</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenDocumentTab(readyResult.document, 'questions')}
              className="py-3 px-4 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <HelpCircle className="w-4 h-4 text-sky-400" />
              <span>Important Questions</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (readyResult.quiz) {
                  onStartQuiz(readyResult.quiz, readyResult.document);
                } else {
                  onOpenDocumentTab(readyResult.document, 'quiz');
                }
              }}
              className="py-3 px-4 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-slate-100 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Take Quiz</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenTutor(readyResult.document)}
              className="py-3 px-4 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/30 text-sky-200 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <span>Ask AI</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Upload Card */}
      <div className="rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 sm:p-8 space-y-6">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-slate-300">
            Document Title (Optional)
          </label>
          <input
            type="text"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            placeholder="e.g., Unit 3: Computer Networks & Multiplexing"
            className="w-full bg-[#060a17] border border-white/10 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
          />
        </div>

        {mode === 'file' ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) validateAndSelectFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-8 sm:p-12 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer space-y-3 ${
              isDragging
                ? 'border-sky-400 bg-sky-500/10'
                : 'border-white/15 bg-[#060a17] hover:border-indigo-400/50 hover:bg-[#080d1f]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) validateAndSelectFile(file);
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center mx-auto text-indigo-400">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">
                Drag and drop your PDF or TXT file here, or click to browse
              </p>
              <p className="text-xs text-slate-400">
                Supports selectable-text .PDF and .TXT lecture notes (up to 20MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Paste Lecture Notes or Chapter Text
            </label>
            <textarea
              rows={8}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="Paste your lecture notes, definitions, formulas, or textbook paragraphs here..."
              className="w-full bg-[#060a17] border border-white/10 focus:border-indigo-500 rounded-xl p-4 text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed"
            />
          </div>
        )}

        {/* Selected File Metadata Display (Required: File name, File size, File type) */}
        {mode === 'file' && selectedFile && (
          <div className="p-4 rounded-xl bg-[#060a17] border border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/15 text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-white">
                  {selectedFile.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums mt-0.5">
                  <span>
                    File type: {selectedFile.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'TXT'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>File size: {formatFileSize(selectedFile.size)}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="text-xs text-slate-400 hover:text-rose-300 cursor-pointer"
            >
              Remove
            </button>
          </div>
        )}

        {/* Upload Progress & Processing Progress Bars */}
        {isProcessing && (
          <div className="p-5 rounded-xl bg-[#060a17] border border-indigo-500/30 space-y-4">
            <div className="flex items-center gap-2.5 text-xs font-semibold text-sky-300">
              <div className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              <span>{processingStage || 'Analyzing your study material...'}</span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                <span>Upload Progress</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-sky-400 transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400 tabular-nums">
                <span>AI Processing Progress</span>
                <span>{processingProgress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 transition-all duration-300"
                  style={{ width: `${processingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          disabled={isProcessing || (mode === 'file' && !selectedFile) || (mode === 'paste' && !pastedText.trim())}
          onClick={handleUploadSubmit}
          className="w-full py-3.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-sm font-semibold shadow-[0_0_25px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isProcessing ? 'Analyzing Study Material...' : 'Analyze with AI & Generate Study Pack'}</span>
        </button>
      </div>

      {/* Quick University Sample Loader for 1-Click Testing */}
      <div className="rounded-2xl bg-[#0a1022]/70 border border-white/[0.07] p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">
            Don&apos;t have a lecture PDF handy right now?
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Click a sample engineering lecture pack below to test real-time AI extraction, summaries, and quiz generation:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SAMPLE_MATERIALS.map((sample, i) => (
            <button
              key={i}
              type="button"
              disabled={isProcessing}
              onClick={() => handleQuickSampleUpload(sample)}
              className="p-4 rounded-xl bg-[#060a17] border border-white/[0.08] hover:border-sky-400/40 text-left transition-all flex items-center justify-between gap-3 cursor-pointer"
            >
              <div>
                <p className="text-xs font-semibold text-white">{sample.title}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">
                  Sample {sample.fileType} · Click to Analyze
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-sky-400 shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
