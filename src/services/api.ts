import {
  User,
  StudyDocument,
  Quiz,
  ChatSession,
  ChatMessage,
  TopicExplanation,
  DocumentSummary,
  ImportantQuestions,
} from '../types/study';

const TOKEN_KEY = 'ai_study_assistant_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data as T;
}

export const api = {
  // AUTH
  register: (name: string, email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  logout: () =>
    request<{ message: string }>('/api/auth/logout', {
      method: 'POST',
    }),

  updateProfile: (name: string) =>
    request<{ user: User }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name }),
    }),

  updatePassword: (currentPassword: string, newPassword: string) =>
    request<{ message: string }>('/api/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  // DOCUMENTS
  uploadDocumentFile: (file: File, title?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (title) formData.append('title', title);
    return request<{ document: StudyDocument; quiz: Quiz | null }>('/api/documents/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadDocumentText: (title: string, textContent: string, fileType: 'PDF' | 'TXT' = 'TXT') =>
    request<{ document: StudyDocument; quiz: Quiz | null }>('/api/documents/upload', {
      method: 'POST',
      body: JSON.stringify({
        title,
        textContent,
        fileName: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${fileType.toLowerCase()}`,
        fileType,
      }),
    }),

  getDocuments: () => request<{ documents: StudyDocument[] }>('/api/documents'),

  getDocumentById: (id: string) => request<{ document: StudyDocument }>(`/api/documents/${id}`),

  updateSourcePreference: (id: string, sourcePreference: 'pdf_only' | 'pdf_and_external') =>
    request<{ document: StudyDocument }>(`/api/documents/${id}/source-preference`, {
      method: 'PATCH',
      body: JSON.stringify({ sourcePreference }),
    }),

  toggleSaveQuestion: (id: string, question: string) =>
    request<{ savedQuestions: string[]; saved: boolean }>(
      `/api/documents/${id}/saved-questions`,
      {
        method: 'POST',
        body: JSON.stringify({ question }),
      }
    ),

  deleteDocument: (id: string) =>
    request<{ message: string }>(`/api/documents/${id}`, {
      method: 'DELETE',
    }),

  // AI OPERATIONS
  regenerateSummary: (documentId: string) =>
    request<{ summary: DocumentSummary }>('/api/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    }),

  regenerateQuestions: (documentId: string) =>
    request<{ importantQuestions: ImportantQuestions }>('/api/ai/questions', {
      method: 'POST',
      body: JSON.stringify({ documentId }),
    }),

  explainTopic: (documentId: string, topic: string, forceRefresh = false) =>
    request<{ explanation: TopicExplanation }>('/api/ai/explain', {
      method: 'POST',
      body: JSON.stringify({ documentId, topic, forceRefresh }),
    }),

  generateQuiz: (documentId: string, count = 5) =>
    request<{ quiz: Quiz }>('/api/ai/quiz', {
      method: 'POST',
      body: JSON.stringify({ documentId, count }),
    }),

  sendTutorChat: (
    documentId: string,
    message: string,
    sourceMode: 'pdf_only' | 'pdf_and_external'
  ) =>
    request<{ message: ChatMessage; chat: ChatSession }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ documentId, message, sourceMode }),
    }),

  resolveExternalSearch: (
    documentId: string,
    question: string,
    decision: 'yes' | 'no',
    promptMessageId: string
  ) =>
    request<{
      message: ChatMessage;
      sourceMode: 'pdf_only' | 'pdf_and_external';
      chat: ChatSession;
    }>('/api/ai/external-search', {
      method: 'POST',
      body: JSON.stringify({ documentId, question, decision, promptMessageId }),
    }),

  // QUIZZES
  getQuizzes: () => request<{ quizzes: Quiz[] }>('/api/quizzes'),

  getQuizById: (id: string) => request<{ quiz: Quiz }>(`/api/quizzes/${id}`),

  submitQuiz: (id: string, answers: number[]) =>
    request<{
      quiz: Quiz;
      result: {
        score: number;
        totalQuestions: number;
        percentage: number;
        correct: number;
        incorrect: number;
      };
    }>(`/api/quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ answers }),
    }),

  // CHATS
  getChat: (documentId: string) => request<{ chat: ChatSession }>(`/api/chats/${documentId}`),

  updateChatSourceMode: (documentId: string, sourceMode: 'pdf_only' | 'pdf_and_external') =>
    request<{ chat: ChatSession }>(`/api/chats/${documentId}`, {
      method: 'POST',
      body: JSON.stringify({ sourceMode }),
    }),

  clearChat: (documentId: string) =>
    request<{ chat: ChatSession }>(`/api/chats/${documentId}`, {
      method: 'DELETE',
    }),
};
