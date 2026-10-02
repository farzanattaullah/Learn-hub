import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Settings,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  X,
  BookOpen,
} from 'lucide-react';
import FlipBook from './FlipBook';
import SettingsModal from './SettingsModal';
import { soundFx } from '../utils/sound';
import { fireSuccessConfetti } from '../utils/confetti';

interface FlipBookStageProps {
  onAuthComplete: () => void;
  isModal?: boolean;
  onClose?: () => void;
}

export default function FlipBookStage({
  onAuthComplete,
  isModal = false,
  onClose,
}: FlipBookStageProps) {
  const totalLeaves = 3;
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [flippedCount, setFlippedCount] = useState(0);
  const [flippingIndex, setFlippingIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const timersRef = useRef<any[]>([]);
  const isDark = theme === 'dark';

  useEffect(() => {
    return () => {
      timersRef.current.forEach(clearTimeout);
    };
  }, []);

  const goToPage = useCallback((targetPage: number) => {
    setFlippedCount((current) => {
      if (current === targetPage) return current;
      setFlippingIndex(targetPage > current ? current : targetPage);
      soundFx.playPageFlip(1.05);
      const t = setTimeout(() => setFlippingIndex(null), 420);
      timersRef.current.push(t);
      return targetPage;
    });
  }, []);

  const flipNext = useCallback(() => {
    setFlippedCount((current) => {
      if (current >= totalLeaves) return current;
      setFlippingIndex(current);
      soundFx.playPageFlip(1.0);
      const t = setTimeout(() => setFlippingIndex(null), 400);
      timersRef.current.push(t);
      return current + 1;
    });
  }, [totalLeaves]);

  const flipPrev = useCallback(() => {
    setFlippedCount((current) => {
      if (current <= 0) return current;
      const target = current - 1;
      setFlippingIndex(target);
      soundFx.playPageFlip(1.0);
      const t = setTimeout(() => setFlippingIndex(null), 400);
      timersRef.current.push(t);
      return target;
    });
  }, []);

  const closeAllPages = useCallback(() => {
    setFlippedCount(0);
    soundFx.playSnap();
  }, []);

  const toggleSound = useCallback(() => {
    const enabled = soundFx.toggleMute();
    setSoundEnabled(enabled);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const toggleAutoPlay = useCallback(() => {
    setIsAutoPlay((prev) => !prev);
  }, []);

  // Auto-play interval
  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setFlippedCount((current) => {
        if (current >= totalLeaves) {
          soundFx.playSnap();
          return 0;
        }
        setFlippingIndex(current);
        soundFx.playPageFlip(1.0);
        setTimeout(() => setFlippingIndex(null), 400);
        return current + 1;
      });
    }, 3200);
    return () => clearInterval(interval);
  }, [isAutoPlay, totalLeaves]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not intercept arrow keys when typing in form inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') {
        flipNext();
      } else if (e.key === 'ArrowLeft') {
        flipPrev();
      } else if (e.key === 'Escape') {
        if (isSettingsOpen) {
          setIsSettingsOpen(false);
        } else if (isModal && onClose) {
          onClose();
        } else {
          closeAllPages();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipNext, flipPrev, closeAllPages, isSettingsOpen, isModal, onClose]);

  const handleBookAuthSuccess = () => {
    fireSuccessConfetti();
    soundFx.playSnap();
    setIsLoading(true);
    const t = setTimeout(() => {
      setIsLoading(false);
      if (onClose) onClose();
      onAuthComplete();
    }, 600);
    timersRef.current.push(t);
  };

  return (
    <div
      className={`${
        isModal ? 'fixed inset-0 z-50' : 'relative h-screen w-screen'
      } overflow-hidden flex flex-col items-center justify-between transition-colors duration-500 select-none ${
        isDark
          ? 'bg-[#080c16] text-slate-100'
          : 'bg-[#e8e2d7] text-stone-900'
      }`}
    >
      {/* Ambient Studio Spotlight Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 48%, rgba(30, 58, 138, 0.24) 0%, rgba(15, 23, 42, 0.12) 45%, transparent 75%)'
            : 'radial-gradient(circle at 50% 48%, rgba(255, 255, 255, 0.7) 0%, rgba(214, 206, 194, 0.3) 55%, transparent 80%)',
        }}
      />

      {/* Top Studio Controls Bar */}
      <header className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-end">
        {/* Right: Audio, Theme, Settings & Modal Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSound}
            title={soundEnabled ? 'Mute page sounds' : 'Enable page sounds'}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                : 'bg-white/80 hover:bg-white border-stone-300 text-stone-700 shadow-xs'
            }`}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-stone-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            title="Toggle appearance"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-amber-300'
                : 'bg-white/80 hover:bg-white border-stone-300 text-indigo-600 shadow-xs'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Book Settings"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark
                ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-slate-200'
                : 'bg-white/80 hover:bg-white border-stone-300 text-stone-700 shadow-xs'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-xs font-semibold text-rose-200 flex items-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Close Book</span>
            </button>
          )}
        </div>
      </header>

      {/* Center 3D FlipBook Stage */}
      <main className="relative z-20 flex-1 w-full flex items-center justify-center overflow-visible">
        <FlipBook
          theme={theme}
          flippedCount={flippedCount}
          totalLeaves={totalLeaves}
          flippingIndex={flippingIndex}
          flipNext={flipNext}
          flipPrev={flipPrev}
          goToPage={goToPage}
          closeAllPages={closeAllPages}
          handleGetStarted={() => goToPage(1)}
          onLogin={handleBookAuthSuccess}
          onSignUp={handleBookAuthSuccess}
          isLoading={isLoading}
        />
      </main>

      {/* Bottom Interactive Page Controls */}
      <footer className="relative z-30 w-full max-w-xl mx-auto px-4 pb-5 pt-2 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={flipPrev}
          disabled={flippedCount === 0}
          className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white'
              : 'bg-white/85 hover:bg-white border-stone-300 text-stone-800 shadow-xs'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Page Indicator Dots */}
        <div className="flex items-center gap-2">
          {[0, 1, 2, 3].map((pageIdx) => (
            <button
              key={pageIdx}
              type="button"
              onClick={() => goToPage(pageIdx)}
              title={
                pageIdx === 0
                  ? 'Front Cover'
                  : pageIdx === 1
                  ? 'Spread 1: Sign In'
                  : pageIdx === 2
                  ? 'Spread 2: Sign Up'
                  : 'Back Cover'
              }
              className={`h-2 rounded-full transition-all cursor-pointer ${
                flippedCount === pageIdx
                  ? isDark
                    ? 'w-7 bg-sky-400'
                    : 'w-7 bg-stone-900'
                  : isDark
                  ? 'w-2 bg-white/25 hover:bg-white/40'
                  : 'w-2 bg-stone-400 hover:bg-stone-600'
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={flipNext}
          disabled={flippedCount >= totalLeaves}
          className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark
              ? 'bg-white/[0.06] hover:bg-white/[0.12] border-white/10 text-white'
              : 'bg-white/85 hover:bg-white border-stone-300 text-stone-800 shadow-xs'
          }`}
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* Book Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        soundEnabled={soundEnabled}
        toggleSound={toggleSound}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        isAutoPlay={isAutoPlay}
        toggleAutoPlay={toggleAutoPlay}
        closeAllPages={closeAllPages}
        flippedCount={flippedCount}
        totalLeaves={totalLeaves}
        flipNext={flipNext}
        flipPrev={flipPrev}
      />
    </div>
  );
}
