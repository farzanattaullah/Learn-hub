import React, { useState } from 'react';
import {
  FileText,
  HelpCircle,
  BookOpen,
  Sparkles,
  Layers,
  BarChart2,
  Compass,
  ArrowUpRight,
} from 'lucide-react';

interface StudyCompanionHub3DProps {
  onOpen3DBook?: () => void;
  onGetStarted?: () => void;
}

const LEFT_NODES = [
  {
    id: 'notes',
    label: 'Notes',
    detail: 'Upload PDF & TXT lecture slides for instant extraction.',
    icon: FileText,
  },
  {
    id: 'questions',
    label: 'Questions',
    detail: 'Generate short, long, and high-yield exam questions.',
    icon: HelpCircle,
  },
  {
    id: 'summaries',
    label: 'Summaries',
    detail: 'Distill chapters into key points, definitions & formulas.',
    icon: BookOpen,
  },
];

const RIGHT_NODES = [
  {
    id: 'plans',
    label: 'Study Plans',
    detail: 'Structured topic breakdowns prioritized by exam weight.',
    icon: Compass,
  },
  {
    id: 'resources',
    label: 'Learning Resources',
    detail: 'Source-First AI Tutor with optional verified external search.',
    icon: Layers,
  },
  {
    id: 'progress',
    label: 'Progress',
    detail: 'Track MCQ quiz scores, accuracy trends, and topic mastery.',
    icon: BarChart2,
  },
];

export default function StudyCompanionHub3D({
  onOpen3DBook,
  onGetStarted,
}: StudyCompanionHub3DProps) {
  const [selectedNode, setSelectedNode] = useState<{
    label: string;
    detail: string;
  }>({
    label: 'Source-First Neural Hub',
    detail:
      'Every summary, exam question, explanation, and quiz is grounded strictly in your uploaded study material first.',
  });

  return (
    <div className="relative rounded-2xl bg-[#0a1022]/90 border border-white/[0.08] p-6 sm:p-10 lg:p-12 overflow-hidden">
      {/* Subtle Cosmic Center Glow */}
      <div className="absolute inset-0 bg-radial from-sky-500/12 via-indigo-600/5 to-transparent pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left 3 Nodes */}
        <div className="lg:col-span-4 space-y-4">
          {LEFT_NODES.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNode.label === node.label;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNode(node)}
                className={`w-full p-4 rounded-xl border text-left lg:text-right flex lg:flex-row-reverse items-center justify-between gap-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-sky-400/50 text-white'
                    : 'bg-[#070b18]/80 border-white/[0.07] text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="flex lg:flex-row-reverse items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/[0.05] text-sky-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">{node.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{node.detail}</p>
                  </div>
                </div>
                <div className="hidden lg:block h-[1px] w-8 bg-gradient-to-r from-transparent to-sky-400/40 shrink-0" />
              </button>
            );
          })}
        </div>

        {/* Center 3D Glowing Orb Core */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-4 perspective-1200">
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 flex items-center justify-center preserve-3d">
            {/* Outer pulsing ring */}
            <div className="absolute inset-0 rounded-full border border-sky-400/30 orbit-ring-1 pointer-events-none" />
            <div className="absolute inset-3 rounded-full border border-indigo-400/25 orbit-ring-2 pointer-events-none" />

            {/* Glowing 3D Core Sphere */}
            <button
              type="button"
              onClick={onGetStarted}
              className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-radial from-sky-400/30 via-[#0d1b3a] to-[#060b18] border border-sky-300/40 shadow-[0_0_60px_rgba(56,189,248,0.28),inset_0_0_30px_rgba(56,189,248,0.35)] flex flex-col items-center justify-center text-center p-4 transition-transform duration-200 hover:scale-105 cursor-pointer group"
            >
              <div className="p-2.5 rounded-xl bg-sky-400/15 border border-sky-300/30 text-sky-300 mb-2 group-hover:scale-110 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold tracking-wider text-white">
                AI Study Core
              </span>
              <span className="text-[10px] text-sky-300/80 mt-0.5">
                Source-First Engine
              </span>
            </button>
          </div>

          {/* Active Node Inspector Readout */}
          <div className="mt-5 text-center max-w-xs">
            <p className="text-xs font-semibold text-sky-300">{selectedNode.label}</p>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {selectedNode.detail}
            </p>
          </div>

          {onOpen3DBook && (
            <button
              type="button"
              onClick={onOpen3DBook}
              className="mt-4 px-3.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
            >
              <span>Launch Interactive 3D Study Book</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-sky-400" />
            </button>
          )}
        </div>

        {/* Right 3 Nodes */}
        <div className="lg:col-span-4 space-y-4">
          {RIGHT_NODES.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNode.label === node.label;
            return (
              <button
                key={node.id}
                type="button"
                onClick={() => setSelectedNode(node)}
                className={`w-full p-4 rounded-xl border text-left flex items-center justify-between gap-4 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/40 border-sky-400/50 text-white'
                    : 'bg-[#070b18]/80 border-white/[0.07] text-slate-300 hover:border-white/20 hover:text-white'
                }`}
              >
                <div className="hidden lg:block h-[1px] w-8 bg-gradient-to-l from-transparent to-sky-400/40 shrink-0" />
                <div className="flex items-center gap-3 flex-1">
                  <div className="p-2 rounded-lg bg-white/[0.05] text-indigo-400">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold tracking-tight">{node.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{node.detail}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
