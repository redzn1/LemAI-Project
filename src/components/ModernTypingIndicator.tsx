import React from 'react';
import { Sparkles, Cpu, Bot } from 'lucide-react';

interface ModernTypingIndicatorProps {
  modelName?: string;
  statusText?: string;
  isInline?: boolean;
}

export const ModernTypingIndicator: React.FC<ModernTypingIndicatorProps> = ({
  modelName = 'LemAI 1.0 Flash',
  statusText = 'is thinking & synthesizing intelligence...',
  isInline = false,
}) => {
  const content = (
    <div className="relative group overflow-hidden rounded-2xl rounded-bl-sm bg-[#0e0e0e] border border-neutral-800 p-4 sm:p-5 shadow-[0_0_30px_-5px_rgba(255,255,255,0.05)] w-full">
      {/* Monochrome Pulsing Ambient Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-neutral-700/20 via-white/10 to-neutral-700/20 rounded-2xl blur-sm opacity-50 animate-pulse pointer-events-none" />

      {/* Top Shimmer Line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-neutral-400/30 to-transparent animate-pulse" />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Futuristic Dot Wave & Model Tag */}
        <div className="flex items-center gap-3">
          {/* Animated Quantum Dots */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800/80 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-white animate-bounce [animation-delay:-0.32s] shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:-0.16s] shadow-[0_0_6px_rgba(255,255,255,0.4)]" />
            <span className="w-2 h-2 rounded-full bg-neutral-600 animate-bounce" />
          </div>

          {/* Dynamic Status Text with Smooth Character Reveal Animation */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neutral-300 animate-spin [animation-duration:4s]" />
              <span className="font-bold text-white text-xs font-mono tracking-tight">
                {modelName}
              </span>
            </div>
            <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
              <span className="hidden sm:inline text-neutral-600">•</span>
              <span className="animate-pulse">{statusText}</span>
            </span>
          </div>
        </div>

        {/* Right: Limone Engine Badge */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-neutral-500 bg-neutral-950 px-2.5 py-1 rounded-lg border border-neutral-800/60">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Stream Live</span>
        </div>
      </div>

      {/* Streaming Skeleton Line (Smooth Character Shimmer Effect) */}
      <div className="relative z-10 mt-3.5 pt-3 border-t border-neutral-900/80 space-y-2">
        <div className="h-2 w-3/4 rounded-full bg-neutral-800/60 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-[shimmer_1.8s_infinite] -translate-x-full" />
        </div>
        <div className="h-2 w-1/2 rounded-full bg-neutral-800/40 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_1.8s_infinite_0.3s] -translate-x-full" />
        </div>
      </div>
    </div>
  );

  if (isInline) {
    return content;
  }

  return (
    <div className="flex gap-3 sm:gap-4 justify-start animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* Bot Icon with Pulsing Ambient Glow */}
      <div className="relative w-8 h-8 rounded-xl bg-[#141414] border border-neutral-800 flex items-center justify-center flex-shrink-0 p-1 mt-0.5 shadow-xl group">
        <img src="/logo.svg" alt="LemAI" className="w-5 h-5 object-contain" />
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#080808] animate-pulse" />
      </div>

      {content}
    </div>
  );
};
