import React, { useState, useRef } from 'react';
import { Sparkles, CheckCircle2, Layers } from 'lucide-react';
import sphereImg from '../../assets/images/cosmic_study_sphere_1790940950852.jpg';

interface CosmicOrbitalSphere3DProps {
  compact?: boolean;
  interactiveLabel?: string;
  onSelectNode?: (node: string) => void;
}

export default function CosmicOrbitalSphere3D({
  compact = false,
  onSelectNode,
}: CosmicOrbitalSphere3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 8, y: -12 });
  const [activeOrbitNode, setActiveOrbitNode] = useState<string>('Summaries & Key Concepts');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / (rect.width / 2);
    const deltaY = (e.clientY - centerY) / (rect.height / 2);
    setRotation({
      x: Math.max(-22, Math.min(22, -deltaY * 16)),
      y: Math.max(-25, Math.min(25, deltaX * 20)),
    });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 8, y: -12 });
  };

  const sizeClass = compact
    ? 'w-[240px] h-[240px] sm:w-[270px] sm:h-[270px]'
    : 'w-[310px] h-[310px] sm:w-[410px] sm:h-[410px] lg:w-[460px] lg:h-[460px]';

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex items-center justify-center perspective-1200 select-none cursor-grab active:cursor-grabbing py-4"
    >
      {/* Ambient Radial Backlight matching reference image */}
      <div className="absolute w-[85%] h-[85%] rounded-full bg-radial from-sky-500/20 via-indigo-600/12 to-transparent blur-3xl pointer-events-none" />

      {/* 3D Tilt Stage */}
      <div
        className={`relative ${sizeClass} preserve-3d transition-transform duration-200 ease-out flex items-center justify-center`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {/* Core 3D Translucent Cosmic Sphere */}
        <div
          className="relative w-[72%] h-[72%] rounded-full overflow-hidden border border-sky-400/25 shadow-[0_0_80px_rgba(56,189,248,0.22),inset_0_0_50px_rgba(14,165,233,0.35)] bg-[#060d1f]"
          style={{ transform: 'translateZ(0px)' }}
        >
          <img
            src={sphereImg}
            alt="3D Knowledge Sphere"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-90 scale-110 mix-blend-screen"
          />
          {/* Specular 3D Sphere Lighting Overlay */}
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(circle at 32% 28%, rgba(125, 211, 252, 0.42) 0%, rgba(56, 189, 248, 0.12) 32%, rgba(5, 8, 17, 0.75) 78%, rgba(2, 6, 23, 0.95) 100%)',
            }}
          />
        </div>

        {/* 3D Orbital Ring 1 (Primary Cyan Tilted Ring) */}
        <div className="absolute w-[98%] h-[98%] rounded-full border border-sky-400/35 orbit-ring-1 preserve-3d pointer-events-none">
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-sky-300 shadow-[0_0_14px_#38bdf8]" />
          <div className="absolute -bottom-1 left-1/3 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" />
        </div>

        {/* 3D Orbital Ring 2 (Secondary Indigo Counter-Rotating Ring) */}
        <div className="absolute w-[108%] h-[108%] rounded-full border border-indigo-400/25 border-dashed orbit-ring-2 preserve-3d pointer-events-none">
          <div className="absolute top-1/2 -right-1.5 w-2.5 h-2.5 rounded-full bg-indigo-300 shadow-[0_0_12px_#6366f1]" />
        </div>

        {/* 3D Orbital Ring 3 (Inner High-Speed Knowledge Ring) */}
        <div className="absolute w-[86%] h-[86%] rounded-full border border-cyan-300/20 orbit-ring-3 preserve-3d pointer-events-none">
          <div className="absolute top-0 left-1/4 w-2 h-2 rounded-full bg-cyan-200 shadow-[0_0_10px_#67e8f9]" />
        </div>

        {/* Floating 3D Callout Card — Top Left (Matches reference screenshot) */}
        {!compact && (
          <button
            type="button"
            onClick={() => {
              setActiveOrbitNode('Focus-driven · Personalized');
              onSelectNode?.('summary');
            }}
            style={{ transform: 'translateZ(48px)' }}
            className="absolute -top-2 -left-2 sm:top-4 sm:-left-6 px-4 py-2.5 rounded-xl bg-[#0b1329]/85 backdrop-blur-md border border-sky-400/25 shadow-[0_14px_34px_rgba(0,0,0,0.65)] text-left transition-transform hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-sky-200">
              <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Focus-driven · Personalized</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Source-first PDF &amp; TXT intelligence
            </p>
          </button>
        )}

        {/* Floating 3D Callout Card — Bottom Right (Matches reference screenshot) */}
        {!compact && (
          <button
            type="button"
            onClick={() => {
              setActiveOrbitNode('Understanding, unlocked');
              onSelectNode?.('tutor');
            }}
            style={{ transform: 'translateZ(56px)' }}
            className="absolute -bottom-2 -right-2 sm:bottom-5 sm:-right-4 px-4 py-2.5 rounded-xl bg-[#0b1329]/85 backdrop-blur-md border border-indigo-400/25 shadow-[0_14px_34px_rgba(0,0,0,0.65)] text-left transition-transform hover:scale-105 cursor-pointer"
          >
            <div className="flex items-center gap-2 text-xs font-medium text-indigo-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Understanding, unlocked</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeOrbitNode}
            </p>
          </button>
        )}

        {/* Compact Center Badge when used inside Dashboard */}
        {compact && (
          <div
            style={{ transform: 'translateZ(35px)' }}
            className="px-3 py-1.5 rounded-lg bg-[#091024]/90 border border-sky-400/30 text-[11px] font-mono text-sky-200 flex items-center gap-1.5 shadow-lg"
          >
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>3D Knowledge Core</span>
          </div>
        )}
      </div>
    </div>
  );
}
