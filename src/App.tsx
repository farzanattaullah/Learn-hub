import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppRoute, StudyDocument, Quiz } from './types/study';
import { api } from './services/api';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import MyDocumentsPage from './pages/MyDocumentsPage';
import DocumentDetailsPage from './pages/DocumentDetailsPage';
import AITutorPage from './pages/AITutorPage';
import QuizzesPage from './pages/QuizzesPage';
import ProgressPage from './pages/ProgressPage';
import ProfilePage from './pages/ProfilePage';
import ToastContainer from './components/ui/ToastContainer';
import FlipBookStage from './components/FlipBookStage';

function MainAppRouter() {
  const { user, isLoadingAuth, documents, setDocuments, quizzes, setQuizzes, showToast } =
    useAuth();

  const [route, setRoute] = useState<AppRoute>('dashboard');
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocTab, setSelectedDocTab] = useState<string>('summary');
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [is3DBookModalOpen, setIs3DBookModalOpen] = useState(false);

  const activeDocument =
    documents.find((d) => d._id === selectedDocId) || documents[0] || null;

  const handleOpenDocument = (doc: StudyDocument, tab = 'summary') => {
    setSelectedDocId(doc._id);
    setSelectedDocTab(tab);
    setRoute('document-detail');
  };

  const handleStartQuizForDocument = async (doc: StudyDocument) => {
    const existingQuiz = quizzes.find((q) => q.documentId === doc._id);
    if (existingQuiz) {
      setSelectedQuiz(existingQuiz);
      setRoute('quizzes');
      return;
    }

    try {
      showToast(`Generating AI MCQ Quiz for "${doc.title}"...`, 'info');
      const res = await api.generateQuiz(doc._id, 5);
      setQuizzes((prev) => [res.quiz, ...prev]);
      setSelectedQuiz(res.quiz);
      setRoute('quizzes');
    } catch (err: any) {
      showToast(err.message || 'Could not generate quiz.', 'error');
    }
  };

  const handleOpenTutorForDocument = (doc: StudyDocument) => {
    setSelectedDocId(doc._id);
    setRoute('tutor');
  };

  const handleDocumentUpdated = (updatedDoc: StudyDocument) => {
    setDocuments((prev) =>
      prev.map((d) => (d._id === updatedDoc._id ? updatedDoc : d))
    );
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen w-full bg-[#080c16] flex flex-col items-center justify-center gap-3 text-slate-300">
        <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-mono tracking-wider text-slate-400">
          Loading 3D Study Book...
        </p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer />

      {is3DBookModalOpen && (
        <FlipBookStage
          isModal
          onClose={() => setIs3DBookModalOpen(false)}
          onAuthComplete={() => {
            setIs3DBookModalOpen(false);
            setRoute('dashboard');
          }}
        />
      )}

      {!user ? (
        <FlipBookStage onAuthComplete={() => setRoute('dashboard')} />
      ) : (
        <DashboardLayout
          activeRoute={route}
          onNavigate={(nextRoute) => {
            if (nextRoute === 'quizzes') {
              setSelectedQuiz(null);
            }
            setRoute(nextRoute);
          }}
          onOpen3DBook={() => setIs3DBookModalOpen(true)}
        >
          {route === 'dashboard' && (
            <DashboardPage
              onNavigate={(r) => {
                if (r === 'quizzes') setSelectedQuiz(null);
                setRoute(r);
              }}
              onOpenDocument={handleOpenDocument}
              onStartQuizForDocument={handleStartQuizForDocument}
              onOpenTutorForDocument={handleOpenTutorForDocument}
              onSelectQuiz={(quiz) => {
                setSelectedQuiz(quiz);
                setRoute('quizzes');
              }}
            />
          )}

          {route === 'upload' && (
            <UploadPage
              onOpenDocumentTab={handleOpenDocument}
              onStartQuiz={(quiz) => {
                setSelectedQuiz(quiz);
                setRoute('quizzes');
              }}
              onOpenTutor={handleOpenTutorForDocument}
            />
          )}

          {route === 'documents' && (
            <MyDocumentsPage
              onOpenDocumentTab={handleOpenDocument}
              onStartQuizForDocument={handleStartQuizForDocument}
              onOpenTutorForDocument={handleOpenTutorForDocument}
              onNavigateUpload={() => setRoute('upload')}
            />
          )}

          {route === 'document-detail' && activeDocument && (
            <DocumentDetailsPage
              document={activeDocument}
              initialTab={selectedDocTab}
              onBack={() => setRoute('documents')}
              onStartQuiz={(quiz) => {
                setSelectedQuiz(quiz);
                setRoute('quizzes');
              }}
              onDocumentUpdated={handleDocumentUpdated}
            />
          )}

          {route === 'tutor' && <AITutorPage initialDocument={activeDocument} />}

          {route === 'quizzes' && (
            <QuizzesPage
              initialQuiz={selectedQuiz}
              onOpenDocument={(docId) => {
                setSelectedDocId(docId);
                setSelectedDocTab('summary');
                setRoute('document-detail');
              }}
            />
          )}

          {route === 'progress' && (
            <ProgressPage
              onSelectQuiz={(quiz) => {
                setSelectedQuiz(quiz);
                setRoute('quizzes');
              }}
            />
          )}

          {route === 'profile' && <ProfilePage />}
        </DashboardLayout>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppRouter />
    </AuthProvider>
  );
}
