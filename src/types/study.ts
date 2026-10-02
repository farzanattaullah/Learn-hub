export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface FormulaItem {
  name: string;
  formula: string;
  description: string;
}

export interface DocumentSummary {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  formulas: FormulaItem[];
  examples: string[];
}

export interface ImportantTopic {
  name: string;
  explanation: string;
  importance: 'High' | 'Medium' | 'Foundational';
}

export interface ImportantDefinition {
  term: string;
  definition: string;
  context?: string;
}

export interface ShortAnswerQuestion {
  question: string;
  answerHint: string;
}

export interface LongAnswerQuestion {
  question: string;
  keyPointsToInclude: string[];
}

export interface ExamOrientedQuestion {
  question: string;
  marks: string;
  frequency: string;
}

export interface ImportantQuestions {
  shortAnswer: ShortAnswerQuestion[];
  longAnswer: LongAnswerQuestion[];
  examOriented: ExamOrientedQuestion[];
}

export interface TopicExplanation {
  topic: string;
  simpleExplanation: string;
  example: string;
  keyPoints: string[];
  importantTerms: { term: string; meaning: string }[];
  sourceLabel: string;
}

export interface RagChunk {
  chunkId: string;
  sectionTitle: string;
  content: string;
  keywords: string[];
  wordCount: number;
}

export interface StudyDocument {
  _id: string;
  userId: string;
  title: string;
  fileName: string;
  fileType: 'PDF' | 'TXT';
  fileSize: number;
  extractedText: string;
  ragChunks?: RagChunk[];
  summary: DocumentSummary;
  importantTopics: ImportantTopic[];
  importantDefinitions: ImportantDefinition[];
  importantQuestions: ImportantQuestions;
  savedQuestions: string[];
  explanationsCache?: Record<string, TopicExplanation>;
  sourcePreference: 'pdf_only' | 'pdf_and_external';
  processingStatus: 'processing' | 'ready' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Quiz {
  _id: string;
  userId: string;
  documentId: string;
  documentTitle: string;
  title: string;
  questions: QuizQuestion[];
  score: number | null;
  totalQuestions: number;
  percentage: number | null;
  userAnswers: number[];
  completedAt: string | null;
  createdAt: string;
}

export interface ExternalSourceCitation {
  title: string;
  url: string;
  domain: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sourceType: 'pdf' | 'external' | 'not_found' | 'system';
  sourceLabel?: string;
  relevantSection?: string;
  requiresExternalPermission?: boolean;
  pendingQuestion?: string;
  permissionResolved?: boolean;
  sources?: ExternalSourceCitation[];
  timestamp: string;
}

export interface ChatSession {
  _id: string;
  userId: string;
  documentId: string;
  messages: ChatMessage[];
  sourceMode: 'pdf_only' | 'pdf_and_external';
  createdAt: string;
  updatedAt: string;
}

export type AppRoute =
  | 'dashboard'
  | 'upload'
  | 'documents'
  | 'document-detail'
  | 'tutor'
  | 'quizzes'
  | 'progress'
  | 'profile';
