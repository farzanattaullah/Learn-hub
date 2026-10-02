import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, StudyDocument, Quiz } from '../types/study';
import { api, getStoredToken, setStoredToken } from '../services/api';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  collection,
  query,
  where,
  onSnapshot,
  handleFirestoreError,
  OperationType,
} from '../services/firebase';

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface AuthContextValue {
  user: User | null;
  isLoadingAuth: boolean;
  documents: StudyDocument[];
  quizzes: Quiz[];
  isLoadingData: boolean;
  toasts: ToastItem[];
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (name: string, email: string, pass: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => Promise<void>;
  logout: () => void;
  refreshUserData: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setDocuments: React.Dispatch<React.SetStateAction<StudyDocument[]>>;
  setQuizzes: React.Dispatch<React.SetStateAction<Quiz[]>>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [documents, setDocuments] = useState<StudyDocument[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshUserData = useCallback(async () => {
    const token = getStoredToken();
    if (!token && !auth.currentUser) return;
    setIsLoadingData(true);
    try {
      const [docsRes, quizzesRes] = await Promise.all([
        api.getDocuments(),
        api.getQuizzes(),
      ]);
      setDocuments(docsRes.documents || []);
      setQuizzes(quizzesRes.quizzes || []);
    } catch (err) {
      console.warn('Could not refresh user documents/quizzes:', err);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  // Firebase Auth State Listener & Realtime Firestore Sync
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const uId = fbUser.uid;
        const studentUser: User = {
          id: uId,
          name: fbUser.displayName || fbUser.email?.split('@')[0] || 'Student',
          email: fbUser.email || '',
          createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
        };

        // Sync or persist student profile document in Firestore
        try {
          const userDocRef = doc(db, 'users', uId);
          const userSnap = await getDoc(userDocRef);
          if (!userSnap.exists()) {
            await setDoc(userDocRef, studentUser);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `users/${uId}`);
        }

        // Generate and store an auth token for backend PDF & Gemini API routes
        try {
          const idToken = await fbUser.getIdToken();
          setStoredToken(idToken);
        } catch {
          // Token fallback
        }

        setUser(studentUser);
        setIsLoadingAuth(false);
      } else {
        // Check if there is an active local JWT session
        const token = getStoredToken();
        if (token) {
          api
            .getMe()
            .then(async (res) => {
              setUser(res.user);
              await refreshUserData();
            })
            .catch(() => {
              setStoredToken(null);
              setUser(null);
            })
            .finally(() => {
              setIsLoadingAuth(false);
            });
        } else {
          setUser(null);
          setIsLoadingAuth(false);
        }
      }
    });

    return () => unsubscribeAuth();
  }, [refreshUserData]);

  // Real-time Firestore Document & Quiz Listeners when authenticated with Firebase
  useEffect(() => {
    if (!user?.id || !auth.currentUser) return;

    const uId = auth.currentUser.uid;
    const docsQuery = query(collection(db, 'documents'), where('userId', '==', uId));
    const quizzesQuery = query(collection(db, 'quizzes'), where('userId', '==', uId));

    const unsubDocs = onSnapshot(
      docsQuery,
      (snapshot) => {
        const docsList: StudyDocument[] = [];
        snapshot.forEach((d) => {
          docsList.push({ ...d.data(), _id: d.id } as StudyDocument);
        });
        if (docsList.length > 0) {
          setDocuments(docsList);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'documents');
      }
    );

    const unsubQuizzes = onSnapshot(
      quizzesQuery,
      (snapshot) => {
        const qList: Quiz[] = [];
        snapshot.forEach((d) => {
          qList.push({ ...d.data(), _id: d.id } as Quiz);
        });
        if (qList.length > 0) {
          setQuizzes(qList);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'quizzes');
      }
    );

    return () => {
      unsubDocs();
      unsubQuizzes();
    };
  }, [user]);

  const loginWithGoogle = async () => {
    try {
      setIsLoadingAuth(true);
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;
      const studentUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || 'Student',
        email: fbUser.email || '',
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
      };
      const idToken = await fbUser.getIdToken();
      setStoredToken(idToken);
      setUser(studentUser);
      showToast(`Signed in with Google as ${studentUser.name}`, 'success');
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      showToast(err.message || 'Google Sign-In failed', 'error');
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      // First attempt Firebase Auth
      const userCred = await signInWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = userCred.user;
      const studentUser: User = {
        id: fbUser.uid,
        name: fbUser.displayName || email.split('@')[0],
        email: fbUser.email || email,
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
      };
      const idToken = await fbUser.getIdToken();
      setStoredToken(idToken);
      setUser(studentUser);
    } catch (firebaseErr: any) {
      // Fallback to backend REST auth if email/password isn't enabled in Firebase console
      const res = await api.login(email.trim(), pass);
      await loginWithToken(res.token, res.user);
    }
  };

  const registerWithEmail = async (name: string, email: string, pass: string) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      const fbUser = userCred.user;
      const studentUser: User = {
        id: fbUser.uid,
        name,
        email: fbUser.email || email,
        createdAt: fbUser.metadata.creationTime || new Date().toISOString(),
      };
      const idToken = await fbUser.getIdToken();
      setStoredToken(idToken);
      setUser(studentUser);
    } catch (firebaseErr: any) {
      const res = await api.register(name.trim(), email.trim(), pass);
      await loginWithToken(res.token, res.user);
    }
  };

  const loginWithToken = async (token: string, loggedInUser: User) => {
    setStoredToken(token);
    setUser(loggedInUser);
    await refreshUserData();
  };

  const logout = () => {
    signOut(auth).catch(() => {});
    api.logout().catch(() => {});
    setStoredToken(null);
    setUser(null);
    setDocuments([]);
    setQuizzes([]);
    showToast('Signed out of AI Study Assistant.', 'info');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoadingAuth,
        documents,
        quizzes,
        isLoadingData,
        toasts,
        showToast,
        dismissToast,
        loginWithGoogle,
        loginWithEmail,
        registerWithEmail,
        loginWithToken,
        logout,
        refreshUserData,
        setUser,
        setDocuments,
        setQuizzes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
