import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Terminal, Shield, Cpu, CheckCircle2 } from 'lucide-react';

interface LoadingScreenProps {
  onComplete?: () => void;
  minDurationMs?: number;
  statusMessage?: string;
  isComplete?: boolean;
}

const loadingSteps = [
  { progress: 15, text: 'Initializing LemAI Neural Runtime...' },
  { progress: 40, text: 'Synchronizing Authentication & Token Guard...' },
  { progress: 70, text: 'Loading High-Performance Models (Flash & Pro)...' },
  { progress: 90, text: 'Connecting IDE & Live Workspace Tools...' },
  { progress: 100, text: 'LemAI System Ready' },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDurationMs = 1200,
  statusMessage,
  isComplete = false,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 30;
    const totalSteps = minDurationMs / intervalTime;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const calculatedProgress = Math.min(
        100,
        Math.round((stepCount / totalSteps) * 100)
      );

      setProgress((prev) => {
        const next = Math.max(prev, calculatedProgress);
        // Find corresponding step message
        const matchedIndex = loadingSteps.findIndex((s) => next <= s.progress);
        if (matchedIndex !== -1) {
          setCurrentStepIndex(matchedIndex);
        } else {
          setCurrentStepIndex(loadingSteps.length - 1);
        }
        return next;
      });

      if (stepCount >= totalSteps || isComplete) {
        clearInterval(timer);
        setProgress(100);
        setCurrentStepIndex(loadingSteps.length - 1);
        
        // Brief pause at 100% before smooth fade exit
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 400);
        }, 300);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [minDurationMs, isComplete, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.02, filter: 'blur(8px)' }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#060606] text-white select-none overflow-hidden"
        >
          {/* Subtle Ambient Background Gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neutral-800/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-white/5 rounded-full blur-[90px] pointer-events-none" />
            
            {/* Subtle Grid Accent */}
            <div 
              className="absolute inset-0 opacity-[0.03]" 
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />
          </div>

          {/* Core Content Box */}
          <div className="relative z-10 flex flex-col items-center max-w-sm w-full px-6">
            
            {/* Logo with Animated Ambient Halo & Pulse Rings */}
            <div className="relative mb-8 flex items-center justify-center">
              {/* Outer Pulsing Halo Rings */}
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.15, 0.35, 0.15],
                }}
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute w-28 h-28 rounded-3xl border border-white/20 bg-white/5 blur-sm"
              />
              
              <motion.div
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 12,
                  repeat: Infinity,
                  ease: 'linear',
                }}
                className="absolute w-24 h-24 rounded-2xl border border-dashed border-neutral-700/60"
              />

              {/* Logo Core Frame */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="relative w-20 h-20 rounded-2xl bg-gradient-to-b from-[#181818] to-[#0d0d0d] border border-neutral-700/70 p-3.5 shadow-2xl flex items-center justify-center group overflow-hidden"
              >
                {/* Internal Shimmer Highlight */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
                
                {/* SVG Logo */}
                <img
                  src="/logo.svg"
                  alt="LemAI Logo"
                  className="w-12 h-12 object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                />

                {/* Sparkling Accent Pip */}
                <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-ping" />
              </motion.div>
            </div>

            {/* Brand Title & Tagline */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="text-center mb-6"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  LemAI
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-neutral-800 border border-neutral-700 text-neutral-300">
                  v2.5
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono tracking-wide">
                Black Intelligence Workspace
              </p>
            </motion.div>

            {/* Progress Bar Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25, duration: 0.4 }}
              className="w-full space-y-2.5 mb-6"
            >
              <div className="relative w-full h-1.5 bg-neutral-900 border border-neutral-800 rounded-full overflow-hidden p-0.5">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-neutral-400 via-white to-neutral-200 shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.1 }}
                />
              </div>

              {/* Status Text & Numerical Percentage */}
              <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <div className="flex items-center gap-1.5 truncate max-w-[240px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                  <span className="truncate text-neutral-300">
                    {statusMessage || loadingSteps[currentStepIndex]?.text || 'Loading system...'}
                  </span>
                </div>
                <span className="font-semibold text-white">
                  {progress}%
                </span>
              </div>
            </motion.div>

            {/* System Badges / Specs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.4 }}
              className="flex items-center justify-center gap-3 pt-2 border-t border-neutral-900 text-[10px] font-mono text-neutral-500"
            >
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3 text-neutral-400" />
                Firebase Auth
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-neutral-400" />
                3-Model Engine
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Terminal className="w-3 h-3 text-neutral-400" />
                IDE Ready
              </span>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
