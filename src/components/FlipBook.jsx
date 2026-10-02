import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import PageLeaf from './PageLeaf';
import SignInForm from './auth/SignInForm';
import SignUpForm from './auth/SignUpForm';
import FeatureManifesto from './auth/FeatureManifesto';
import StudySuperpowers from './auth/StudySuperpowers';
import { ArrowRight, BookOpen, Compass } from 'lucide-react';

const DESKTOP_BOOK_WIDTH = 415;
const DESKTOP_BOOK_HEIGHT = 585;

export default function FlipBook({
  theme = 'dark',
  flippedCount,
  totalLeaves,
  flippingIndex,
  flipNext,
  flipPrev,
  goToPage,
  closeAllPages,
  handleGetStarted,
  onLogin,
  onSignUp,
  isLoading = false,
}) {
  const isDark = theme === 'dark';

  // Screen size detection for responsive mobile/desktop layout
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowDimensions.width < 768;

  // Slightly larger mobile dimensions for better readability
  const maxMobileWidth = Math.min(windowDimensions.width * 0.94, 395);
  const maxMobileHeight = Math.min(windowDimensions.height * 0.88, 580);
  const mobileHeightFromWidth = Math.round(maxMobileWidth * 1.414);

  const bookWidth = isMobile
    ? mobileHeightFromWidth <= maxMobileHeight
      ? maxMobileWidth
      : Math.round(maxMobileHeight / 1.414)
    : DESKTOP_BOOK_WIDTH;

  const bookHeight = isMobile
    ? Math.round(bookWidth * 1.414)
    : DESKTOP_BOOK_HEIGHT;

  // Leaves Layout:
  // Spread 1: Left = FeatureManifesto, Right = SignInForm (Leaf 1 front)
  // Spread 2: Left = StudySuperpowers, Right = SignUpForm (Leaf 2 front)
  const leaves = [
    // Leaf 0: Front Cover (Oxford Blue) & Feature Manifesto (Parchment)
    {
      front: (
        <div className="relative w-full h-full flex flex-col justify-between p-6 sm:p-9 lg:p-10 text-white select-none overflow-hidden bg-[#0c192c] border-l-[3px] border-[#070e1a] shadow-2xl">
          {/* Subtle realistic book edge shading */}
          <img
            src="/assets/images/flip_book_edge_shading.webp"
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none mix-blend-multiply"
          />

          {/* Bookcloth Texture */}
          <div className="absolute inset-0 bookcloth-texture opacity-70 pointer-events-none mix-blend-overlay" />

          {/* Hardcover Spine French Hinge Groove */}
          <div className="absolute left-4 top-0 bottom-0 w-[3px] bg-black/60 shadow-[1px_0_1px_rgba(255,255,255,0.08)] pointer-events-none" />

          {/* Embossed Blind Stamp Border Trim */}
          <div className="absolute inset-5 sm:inset-6 border border-white/[0.12] rounded-xl pointer-events-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.5),0_1px_1px_rgba(255,255,255,0.05)]" />

          {/* Top Brand Header */}
          <div className="relative z-10 flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-sky-300 shrink-0" />
              <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-slate-200 font-bold">
                STUDY OS
              </span>
            </div>
            <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
              EDITION 2026
            </span>
          </div>

          {/* Main Hero Copy */}
          <div className="relative z-10 flex-1 flex flex-col justify-center space-y-4 my-auto px-2 w-full max-w-full overflow-hidden">
            {/* Headline */}
            <div className="space-y-1">
              <h1 className="font-sans text-2xl sm:text-[32px] font-extrabold tracking-tight text-white leading-[1.15] break-words">
                Study smarter.
              </h1>
              <h1 className="font-sans text-2xl sm:text-[32px] font-extrabold tracking-tight leading-[1.15] text-slate-300 break-words">
                Understand deeper.
              </h1>
            </div>

            {/* Subtitle */}
            <p className="font-sans text-xs sm:text-[14px] text-slate-300 font-normal leading-[1.6] max-w-[290px]">
              Upload your notes and let AI create summaries, key questions, and spaced repetition quizzes.
            </p>
          </div>

          {/* Clean Bottom Footer with Small Get Started in Left Corner */}
          <div className="relative z-10 flex items-center justify-between px-2 pb-1 pt-3 border-t border-white/[0.08]">
            {/* Small "Get started" in left bottom corner */}
            <motion.button
              whileHover={{ scale: 1.05, x: 2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => goToPage(1)}
              className="py-2 px-4 bg-white hover:bg-slate-100 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-[0_4px_14px_rgba(0,0,0,0.3)] transition-all cursor-pointer group"
            >
              <span>Get started</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-950 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
            </motion.button>

            <span className="font-mono text-[10px] text-slate-400 tracking-wider uppercase">
              VOL. 01
            </span>
          </div>
        </div>
      ),
      back: <FeatureManifesto />,
      isCover: true,
    },

    // Leaf 1: Sign In Form (Parchment) & Study Superpowers (Parchment)
    {
      front: (
        <SignInForm
          onLogin={onLogin}
          onGoToSignUp={() => goToPage(2)}
        />
      ),
      back: (
        <StudySuperpowers />
      ),
      pageFront: '01',
      pageBack: '02',
    },

    // Leaf 2: Sign Up Form (Parchment) & Clean Back Endpaper (Parchment)
    {
      front: (
        <SignUpForm
          onSignUp={onSignUp}
          onGoToSignIn={() => goToPage(1)}
        />
      ),
      back: (
        <div className="w-full h-full bg-[#f6eee3] text-stone-900 flex flex-col justify-between p-8 sm:p-10 text-center select-none relative overflow-hidden font-sans border-r border-stone-300">
          <div className="relative z-10 pt-2">
            <span className="text-[10px] uppercase font-mono tracking-[0.25em] font-bold text-stone-500">
              ACADEMY PORTAL
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center max-w-[260px] my-auto space-y-3.5 mx-auto">
            <div className="p-4 rounded-full border shadow-sm bg-white border-stone-200 text-stone-700">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-serif tracking-tight text-stone-900">
              Ready to Begin
            </h3>
            <p className="text-xs leading-relaxed font-normal text-stone-600">
              Create your account or sign in to enter your personalized AI workspace.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPage(1);
                }}
                className="px-3.5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPage(2);
                }}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-stone-100 border border-stone-300 text-stone-800 text-xs font-semibold cursor-pointer transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>

          <div className="relative z-10 pb-2 text-[10px] font-mono tracking-wider uppercase text-stone-400">
            Lumina Learning Portal
          </div>
        </div>
      ),
      pageFront: '03',
      pageBack: '04',
    },
  ];

  const isBookClosed = flippedCount === 0;
  const targetX = isMobile ? 0 : (isBookClosed || isLoading) ? 0 : bookWidth / 2;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center perspective-2500 p-1 sm:p-6 select-none">
      {/* 3D Book Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{
          transformStyle: 'preserve-3d',
        }}
        className="relative preserve-3d"
      >
        {/* Book Body */}
        <motion.div
          style={{
            width: `${bookWidth}px`,
            height: `${bookHeight}px`,
          }}
          animate={{
            x: targetX,
            opacity: isLoading ? 0 : 1,
          }}
          transition={{
            x: { duration: isLoading ? 0.5 : 0.55, ease: isLoading ? [0.4, 0, 0.2, 1] : isBookClosed ? [0.32, 0, 0.67, 0] : [0.34, 1.25, 0.64, 1] },
            opacity: { duration: 0.55, ease: 'easeInOut' },
          }}
          className="relative preserve-3d"
        >
          {/* Side Stack Texture (Physical stacked paper edge on right) */}
          <div
            className="absolute top-[8px] bottom-[8px] right-0 w-[7px] paper-stack-edge rounded-r-[2px] pointer-events-none opacity-85"
            style={{
              transform: 'translateZ(-0.5px)',
            }}
          />

          {/* Bottom Stack Texture (Physical paper edge below book block) */}
          <div
            className="absolute bottom-0 left-[6px] right-[6px] h-[5px] paper-stack-bottom rounded-b-[2px] pointer-events-none opacity-80"
            style={{
              transform: 'translateZ(-0.5px)',
            }}
          />

          {/* Back Cover Base Underneath (Adapts to Light / Dark Mode) */}
          <div
            className={`absolute inset-0 rounded-r-[6px] shadow-2xl flex flex-col items-center justify-center select-none overflow-hidden border-r transition-colors duration-300 ${
              isDark
                ? 'bg-[#0c192c] border-[#070e1a]'
                : 'bg-[#ebe5dc] border-[#cfc9be]'
            }`}
            style={{
              zIndex: 0,
              transform: 'translateZ(-1px)',
            }}
          >
            <img
              src="/assets/images/flip_book_edge_shading.webp"
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-45 pointer-events-none mix-blend-multiply"
            />
            <div
              className={`absolute inset-0 pointer-events-none ${
                isDark ? 'bookcloth-texture opacity-70 mix-blend-overlay' : 'bookcloth-texture-light opacity-65'
              }`}
            />

            {/* Spinner centered on back cover */}
            <div className="relative z-10 flex flex-col items-center gap-4">
              <div className="relative w-12 h-12">
                <div
                  className={`absolute inset-0 rounded-full border-[2px] ${
                    isDark ? 'border-white/15' : 'border-black/10'
                  }`}
                />
                <div
                  className={`absolute inset-0 rounded-full border-[2px] border-transparent animate-spin ${
                    isDark ? 'border-t-white/80' : 'border-t-slate-800'
                  }`}
                />
              </div>
              <span
                className={`text-[10px] font-mono tracking-[0.2em] uppercase font-semibold ${
                  isDark ? 'text-white/40' : 'text-slate-500'
                }`}
              >
                Loading…
              </span>
            </div>
          </div>

          {/* Book Spine Edge in 3D */}
          <div
            className={`absolute left-0 top-0 bottom-0 w-[14px] rounded-l-sm origin-right pointer-events-none transition-colors duration-300 ${
              isDark ? 'bg-[#070e1a]' : 'bg-[#c5bcb0]'
            }`}
            style={{
              transform: 'rotateY(-90deg) translateX(-14px)',
            }}
          />

          {/* Double-Sided Flipping Leaves */}
          {leaves.map((leaf, index) => (
            <PageLeaf
              key={index}
              index={index}
              totalLeaves={totalLeaves}
              isFlipped={index < flippedCount}
              isFlipping={flippingIndex === index}
              frontContent={leaf.front}
              backContent={leaf.back}
              pageNumberFront={leaf.pageFront}
              pageNumberBack={leaf.pageBack}
              onFlipNext={flipNext}
              onFlipPrev={flipPrev}
              isCover={leaf.isCover}
              isInteractive={false}
              theme={theme}
            />
          ))}

          {/* Dynamic Floor Contact Shadows & Textures Below */}
          {/* Layer 1: Sharp crisp contact occlusion beneath spine and bottom edge */}
          <div
            className={`absolute -bottom-2 left-4 right-4 h-3 rounded-full pointer-events-none blur-[4px] ${
              isDark ? 'bg-black/80' : 'bg-stone-900/40'
            }`}
          />

          {/* Layer 2: Wide ambient floor blur */}
          <motion.div
            className={`absolute -bottom-10 left-1/2 -translate-x-1/2 h-9 rounded-full pointer-events-none blur-2xl transition-all ${
              isDark ? 'bg-black/55' : 'bg-stone-800/25'
            }`}
            animate={{
              width: isBookClosed || isMobile ? bookWidth * 0.92 : bookWidth * 1.85,
              opacity: isBookClosed ? 0.5 : 0.75,
            }}
            transition={{ duration: 0.6 }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
