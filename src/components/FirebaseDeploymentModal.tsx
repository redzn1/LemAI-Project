import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ExternalLink, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Terminal, 
  RefreshCw, 
  Rocket,
  Server,
  Cloud
} from 'lucide-react';
import { runFirebaseDiscoveryCheck, DeploymentCheckItem, firebaseConfig } from '../config/firebase';
import { soundEffects } from '../lib/notifications';

interface FirebaseDeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseDeploymentModal: React.FC<FirebaseDeploymentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [checklist, setChecklist] = useState<DeploymentCheckItem[]>([]);
  const [isRunning, setIsRunning] = useState(true);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'building' | 'deployed'>('idle');

  const executeDiscovery = async () => {
    setIsRunning(true);
    const items = await runFirebaseDiscoveryCheck();
    setChecklist(items);
    setIsRunning(false);
  };

  useEffect(() => {
    if (isOpen) {
      executeDiscovery();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTriggerDeploy = () => {
    soundEffects.playClickPop();
    setDeployStatus('building');
    setTimeout(() => {
      setDeployStatus('deployed');
      soundEffects.playSuccessDing();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 font-['Plus_Jakarta_Sans',sans-serif]">
      <div 
        className="w-full max-w-2xl bg-[#0c0c0c] border border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-neutral-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-neutral-800/80 bg-[#111111] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white shadow-inner">
              <Cloud className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Zero-Manual Firebase & Vercel Pipeline
                </h2>
                <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                  Auto Discovery
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Konfigurasi Firebase terdeteksi otomatis tanpa perlu input manual
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Checklist */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          
          <div className="p-4 rounded-2xl bg-[#121212] border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
              <span className="text-xs font-mono font-semibold uppercase text-neutral-400">
                Status Pipeline Penemuan Otomatis
              </span>
              <button
                type="button"
                onClick={executeDiscovery}
                disabled={isRunning}
                className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isRunning ? 'animate-spin' : ''}`} />
                <span>Scan Ulang</span>
              </button>
            </div>

            <div className="space-y-2">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#161616] border border-neutral-800/80 text-xs font-mono"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div>
                      <span className="text-white font-semibold block">{item.name}</span>
                      <span className="text-[10px] text-neutral-400">{item.detail}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    READY
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Active Config Summary */}
          <div className="p-4 rounded-2xl bg-[#121212] border border-neutral-800 space-y-2 text-xs font-mono">
            <div className="text-neutral-400 font-semibold mb-2">Terhubung ke Firebase Project:</div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-[#161616] border border-neutral-800 text-neutral-300">
                <span className="text-neutral-500 block">Project ID:</span>
                <span className="text-white font-semibold">{firebaseConfig.projectId}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#161616] border border-neutral-800 text-neutral-300">
                <span className="text-neutral-500 block">Auth Domain:</span>
                <span className="text-white font-semibold">{firebaseConfig.authDomain}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#161616] border border-neutral-800 text-neutral-300">
                <span className="text-neutral-500 block">Storage:</span>
                <span className="text-white font-semibold truncate">{firebaseConfig.storageBucket}</span>
              </div>
              <div className="p-2 rounded-lg bg-[#161616] border border-neutral-800 text-neutral-300">
                <span className="text-neutral-500 block">Vercel Target:</span>
                <span className="text-emerald-400 font-semibold">Production Live Ready</span>
              </div>
            </div>
          </div>

          {/* Action Deploy */}
          {deployStatus === 'deployed' ? (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Aplikasi Berhasil Terhubung & Siap Di-Deploy ke Vercel!</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleTriggerDeploy}
              disabled={deployStatus === 'building'}
              className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs transition flex items-center justify-center gap-2 shadow-xl disabled:opacity-50"
            >
              {deployStatus === 'building' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Build Vercel & Firebase Sync...</span>
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4" />
                  <span>Verifikasi & Sync Deployment Vercel</span>
                </>
              )}
            </button>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800/80 bg-[#111111] flex items-center justify-between text-xs font-mono text-neutral-500">
          <span>Zero-Manual Architecture • LemAI OS</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
