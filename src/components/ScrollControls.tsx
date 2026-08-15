import React from 'react';
import { ArrowUp, ArrowDown, ChevronUp, ChevronDown } from 'lucide-react';
import { soundEffects } from '../lib/notifications';

interface ScrollControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  className?: string;
  variant?: 'floating' | 'inline' | 'compact';
  label?: boolean;
}

export const ScrollControls: React.FC<ScrollControlsProps> = ({
  containerRef,
  className = '',
  variant = 'floating',
  label = false,
}) => {
  const handleScrollTop = () => {
    soundEffects.playClickPop();
    if (containerRef?.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleScrollBottom = () => {
    soundEffects.playClickPop();
    if (containerRef?.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    } else {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'smooth',
      });
    }
  };

  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1.5 ${className}`}>
        <button
          type="button"
          onClick={handleScrollTop}
          title="Scroll ke paling atas (Scroll Up)"
          className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition active:scale-95 flex items-center gap-1 text-[11px] font-mono shadow-sm"
        >
          <ChevronUp className="w-3.5 h-3.5" />
          {label && <span>Atas</span>}
        </button>
        <button
          type="button"
          onClick={handleScrollBottom}
          title="Scroll ke paling bawah (Scroll Down)"
          className="p-1.5 rounded-lg bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition active:scale-95 flex items-center gap-1 text-[11px] font-mono shadow-sm"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          {label && <span>Bawah</span>}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`fixed sm:absolute bottom-20 right-4 sm:right-6 z-40 flex flex-col gap-1.5 animate-in fade-in duration-200 ${className}`}
    >
      <button
        type="button"
        onClick={handleScrollTop}
        title="Scroll ke paling atas"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#161616]/95 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-95 hover:scale-105"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      <button
        type="button"
        onClick={handleScrollBottom}
        title="Scroll ke paling bawah"
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#161616]/95 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 hover:text-white flex items-center justify-center shadow-2xl backdrop-blur-md transition-all active:scale-95 hover:scale-105"
      >
        <ArrowDown className="w-4 h-4" />
      </button>
    </div>
  );
};
