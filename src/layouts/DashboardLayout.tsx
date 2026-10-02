import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  MessageSquare,
  Brain,
  BarChart2,
  User as UserIcon,
  UploadCloud,
  LogOut,
  Menu,
  X,
  BookOpen,
} from 'lucide-react';
import { AppRoute } from '../types/study';
import { useAuth } from '../context/AuthContext';
import avatarImg from '../assets/images/avatar_student_scholar_1790940938132.jpg';

interface DashboardLayoutProps {
  activeRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
  onOpen3DBook?: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AppRoute; label: string; icon: React.ComponentType<any> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'documents', label: 'My Documents', icon: FileText },
  { id: 'tutor', label: 'AI Tutor', icon: MessageSquare },
  { id: 'quizzes', label: 'Quizzes', icon: Brain },
  { id: 'progress', label: 'Progress', icon: BarChart2 },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

export default function DashboardLayout({
  activeRoute,
  onNavigate,
  onOpen3DBook,
  children,
}: DashboardLayoutProps) {
  const { user, logout, documents } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (route: AppRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#050811] text-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Sidebar Navigation (260px) */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#080d1d] border-r border-white/[0.07] z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center justify-between border-b border-white/[0.07]">
          <button
            type="button"
            onClick={() => handleNavClick('dashboard')}
            className="text-base font-bold tracking-tight text-white font-display cursor-pointer whitespace-nowrap"
          >
            AI Study Assistant
          </button>
        </div>

        {/* Primary Upload Action */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => handleNavClick('upload')}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeRoute === 'upload'
                ? 'bg-indigo-500 text-white shadow-[0_0_25px_rgba(99,102,241,0.5)]'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.35)]'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Material</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              activeRoute === item.id ||
              (item.id === 'documents' && activeRoute === 'document-detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-indigo-500/15 text-white border border-indigo-500/40'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-indigo-400' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.id === 'documents' && documents.length > 0 && (
                  <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                    {documents.length}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Interactive 3D Book Mode Launcher */}
        {onOpen3DBook && (
          <div className="px-4 py-2">
            <button
              type="button"
              onClick={onOpen3DBook}
              className="w-full px-3.5 py-2 rounded-xl bg-[#0c142c] hover:bg-[#111c3d] border border-sky-400/20 text-xs text-sky-300 flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-400" />
              <span>3D Study Book View</span>
            </button>
          </div>
        )}

        {/* Bottom Student Profile & Logout */}
        <div className="p-4 border-t border-white/[0.07] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => handleNavClick('profile')}
            className="flex items-center gap-2.5 text-left min-w-0 flex-1 hover:opacity-90 cursor-pointer"
          >
            <img
              src={avatarImg}
              alt={user?.name || 'Student'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-indigo-400/30 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.name || 'Student'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email || ''}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={logout}
            title="Logout"
            className="p-2 rounded-lg text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-16 lg:pb-0">
        {/* Top Bar Contract (3 Zones: Context Breadcrumb | Quick Links | Primary Action) */}
        <header className="sticky top-0 z-20 h-16 bg-[#050811]/85 backdrop-blur-md border-b border-white/[0.07] px-4 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-white/[0.05] text-slate-200 hover:text-white cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-white capitalize">
              {activeRoute === 'document-detail' ? 'Document Study View' : activeRoute}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
            <span>Upload. Understand. Practice. Learn.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleNavClick('upload')}
              className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Material</span>
            </button>
          </div>
        </header>

        {/* Page Viewport */}
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[82vw] bg-[#080d1d] border-r border-white/10 h-full flex flex-col justify-between p-5 z-10">
            <div className="space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-base font-bold text-white font-display">
                  AI Study Assistant
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleNavClick('upload')}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Material</span>
              </button>

              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeRoute === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleNavClick(item.id)}
                      className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center gap-3 cursor-pointer ${
                        isActive
                          ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-indigo-400" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                type="button"
                onClick={logout}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 text-xs font-medium cursor-pointer"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (<= 15% mobile sticky height) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 h-14 bg-[#080d1d]/95 backdrop-blur-md border-t border-white/[0.08] z-30 grid grid-cols-5 px-1">
        {[
          { id: 'dashboard' as AppRoute, label: 'Home', icon: LayoutDashboard },
          { id: 'documents' as AppRoute, label: 'Docs', icon: FileText },
          { id: 'tutor' as AppRoute, label: 'AI Tutor', icon: MessageSquare },
          { id: 'quizzes' as AppRoute, label: 'Quizzes', icon: Brain },
          { id: 'progress' as AppRoute, label: 'Progress', icon: BarChart2 },
        ].map((item) => {
          const Icon = item.icon;
          const isActive =
            activeRoute === item.id ||
            (item.id === 'documents' && activeRoute === 'document-detail');
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors cursor-pointer ${
                isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
