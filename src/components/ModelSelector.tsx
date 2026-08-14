import React, { useState, useRef, useEffect } from 'react';
import { LEMAI_MODELS } from '../api/api';
import { LemAIModel } from '../types';
import { ChevronDown, Zap, Sparkles, Diamond, Check, Lock, AlertCircle } from 'lucide-react';
import { soundEffects } from '../lib/notifications';

interface ModelSelectorProps {
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  currentModelId,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentModel = LEMAI_MODELS[currentModelId] || LEMAI_MODELS['lemai-1.0-flash'];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleModelClick = (model: LemAIModel) => {
    // If model is LemAI 1.1 Pro or disabled / unavailable
    if (model.id === 'lemai-1.1-pro' || model.enabled === false || model.isAvailable === false) {
      soundEffects.playClickPop();
      setToastMessage('Model Belum Tersedia!');
      setTimeout(() => {
        setToastMessage(null);
      }, 2800);
      return;
    }

    onSelectModel(model.id);
    setIsOpen(false);
  };

  const getModelIcon = (iconType: LemAIModel['iconType']) => {
    switch (iconType) {
      case 'flash-lite':
        return <Zap className="w-4 h-4 text-neutral-300" />;
      case 'flash':
        return <Sparkles className="w-4 h-4 text-white" />;
      case 'pro':
        return <Diamond className="w-4 h-4 text-neutral-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-white" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Toast Notification for Unavailable Model */}
      {toastMessage && (
        <div className="absolute top-12 left-0 z-[100] whitespace-nowrap px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-700 text-white text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span className="font-semibold text-neutral-100">{toastMessage}</span>
        </div>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121212] hover:bg-[#1a1a1a] border border-neutral-800 text-xs font-medium text-white transition-all shadow-sm group"
      >
        <span className="flex items-center gap-1.5">
          {getModelIcon(currentModel.iconType)}
          <span className="font-semibold">{currentModel.name}</span>
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 sm:w-80 rounded-2xl bg-[#111111] border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-800/80 mb-1 flex items-center justify-between">
            <span>Pilih Model LemAI</span>
            <span className="text-[10px] text-neutral-600">Limone Engine</span>
          </div>

          <div className="space-y-1">
            {Object.values(LEMAI_MODELS).map((model) => {
              const isSelected = model.id === currentModel.id;
              const isUnavailable = model.id === 'lemai-1.1-pro' || model.enabled === false || model.isAvailable === false;

              return (
                <button
                  key={model.id}
                  type="button"
                  onClick={() => handleModelClick(model)}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start justify-between gap-3 ${
                    isSelected
                      ? 'bg-neutral-800/90 text-white border border-neutral-700'
                      : isUnavailable
                      ? 'opacity-70 hover:bg-neutral-900/60 text-neutral-400 border border-transparent cursor-pointer'
                      : 'hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div className={`p-1.5 rounded-lg mt-0.5 ${isSelected ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-400'}`}>
                      {isUnavailable ? <Lock className="w-4 h-4 text-neutral-500" /> : getModelIcon(model.iconType)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{model.name}</span>
                        {isSelected && (
                          <span className="text-[10px] bg-white text-black px-1.5 py-0.2 rounded font-mono font-bold">
                            AKTIF
                          </span>
                        )}
                        {isUnavailable && (
                          <span className="text-[10px] bg-neutral-900 text-neutral-400 border border-neutral-800 px-1.5 py-0.2 rounded font-mono">
                            Belum Tersedia
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 leading-snug">
                        {model.description}
                      </p>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0 mt-1" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
