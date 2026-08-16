import React, { useState, useEffect } from 'react';
import { 
  Keyboard, 
  X, 
  Search, 
  Sparkles, 
  MessageSquare, 
  Code2, 
  BookOpen, 
  Layout, 
  Image, 
  Video, 
  Compass, 
  Settings, 
  Plus, 
  Send, 
  CornerDownLeft, 
  Sliders,
  Shield,
  Layers
} from 'lucide-react';
import { ActiveTool } from '../types';
import { soundEffects } from '../lib/notifications';

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'Navigasi' | 'Chat & Percakapan' | 'Halaman & Modul' | 'Tools & Fitur';
  action?: () => void;
}

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool?: (tool: ActiveTool) => void;
  onNewChat?: () => void;
  onOpenSettings?: () => void;
  onOpenCommandPalette?: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onNewChat,
  onOpenSettings,
  onOpenCommandPalette,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? '⌘' : 'Ctrl';

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts: ShortcutItem[] = [
    // Navigasi & Sistem
    {
      keys: ['?'],
      description: 'Buka cheat-sheet pintasan keyboard ini',
      category: 'Navigasi',
    },
    {
      keys: [modKey, 'K'],
      description: 'Buka Command Palette & Model Switcher',
      category: 'Navigasi',
      action: () => {
        onClose();
        onOpenCommandPalette?.();
      },
    },
    {
      keys: [modKey, 'B'],
      description: 'Buka atau sembunyikan sidebar navigasi',
      category: 'Navigasi',
    },
    {
      keys: [modKey, ','],
      description: 'Buka halaman Pengaturan Sistem (/settings)',
      category: 'Navigasi',
      action: () => {
        onClose();
        onOpenSettings?.();
      },
    },
    {
      keys: ['Esc'],
      description: 'Tutup popup, modal, atau batalkan aksi yang sedang aktif',
      category: 'Navigasi',
      action: onClose,
    },

    // Chat & Percakapan
    {
      keys: [modKey, 'N'],
      description: 'Mulai percakapan baru di halaman /new',
      category: 'Chat & Percakapan',
      action: () => {
        onClose();
        onNewChat?.();
      },
    },
    {
      keys: ['Enter'],
      description: 'Kirim pesan prompt ke LemAI Black Intelligence',
      category: 'Chat & Percakapan',
    },
    {
      keys: ['Shift', 'Enter'],
      description: 'Tambah baris baru tanpa mengirim pesan',
      category: 'Chat & Percakapan',
    },
    {
      keys: [modKey, '/'],
      description: 'Fokus cepat ke input bar obrolan',
      category: 'Chat & Percakapan',
    },

    // Halaman & Modul
    {
      keys: [modKey, '1'],
      description: 'Buka Chat Workspace (/new atau /chat_...)',
      category: 'Halaman & Modul',
      action: () => {
        onClose();
        onSelectTool?.('chat');
      },
    },
    {
      keys: [modKey, '2'],
      description: 'Buka Coding IDE Sandbox (/coding)',
      category: 'Halaman & Modul',
      action: () => {
        onClose();
        onSelectTool?.('coding');
      },
    },
    {
      keys: [modKey, '3'],
      description: 'Buka Notes & Changelog Studio (/note)',
      category: 'Halaman & Modul',
      action: () => {
        onClose();
        onSelectTool?.('note');
      },
    },
    {
      keys: [modKey, '4'],
      description: 'Buka Visual Canvas Workspace (/canvas)',
      category: 'Halaman & Modul',
      action: () => {
        onClose();
        onSelectTool?.('canvas');
      },
    },
    {
      keys: [modKey, '5'],
      description: 'Buka Image Generator Studio (/image)',
      category: 'Halaman & Modul',
      action: () => {
        onClose();
        onSelectTool?.('image');
      },
    },
    {
      keys: [modKey, '6'],
      description: 'Buka Video Generator Studio (/video)',
      category: 'Halaman & Modul',
      action: () => {
        onClose();
        onSelectTool?.('video');
      },
    },
    {
      keys: [modKey, '7'],
      description: 'Buka Research Intelligence Hub (/research)',
      category: 'Halaman & Modul',
      action: () => {
        onClose();
        onSelectTool?.('research');
      },
    },

    // Tools & Fitur
    {
      keys: ['Quick Canvas'],
      description: 'Gunakan papan sketsa visual langsung dari input chat tanpa membuka modul',
      category: 'Tools & Fitur',
    },
    {
      keys: ['Image Preview'],
      description: 'Klik gambar buatan AI atau upload user untuk zoom, salin, atau unduh PNG',
      category: 'Tools & Fitur',
    },
  ];

  const filteredShortcuts = shortcuts.filter(
    (item) =>
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keys.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const categories = ['Navigasi', 'Chat & Percakapan', 'Halaman & Modul', 'Tools & Fitur'] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0e0e0e] border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] font-['Plus_Jakarta_Sans',sans-serif]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#121212]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-neutral-800/90 border border-neutral-700 text-white shadow-sm">
              <Keyboard className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                Pintasan Keyboard & Shortcut
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                  Cheat-Sheet
                </span>
              </h2>
              <p className="text-xs text-neutral-400">Tekan tombol '?' kapan saja untuk membuka panduan ini</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEffects.playClickPop();
              onClose();
            }}
            className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-xl transition"
            title="Tutup (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-3 border-b border-neutral-800/80 bg-[#0a0a0a]">
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#141414] border border-neutral-800 text-xs">
            <Search className="w-4 h-4 text-neutral-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari pintasan keyboard (misal: chat baru, coding, canvas, settings)..."
              className="w-full bg-transparent text-white placeholder-neutral-500 focus:outline-none text-xs"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-neutral-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 overscroll-y-contain">
          {filteredShortcuts.length === 0 ? (
            <div className="text-center py-10 text-neutral-500 text-xs font-mono">
              Tidak ada pintasan yang cocok dengan pencarian "{searchQuery}".
            </div>
          ) : (
            categories.map((cat) => {
              const items = filteredShortcuts.filter((s) => s.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="space-y-2.5">
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                    <span>{cat}</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          if (item.action) {
                            soundEffects.playClickPop();
                            item.action();
                          }
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border border-neutral-850 bg-[#121212]/90 hover:bg-neutral-800/80 hover:border-neutral-700 transition ${
                          item.action ? 'cursor-pointer' : ''
                        }`}
                      >
                        <span className="text-xs text-neutral-300 pr-4">{item.description}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.keys.map((k, kIdx) => (
                            <React.Fragment key={kIdx}>
                              <kbd className="px-2 py-1 text-[11px] font-mono font-bold text-neutral-200 bg-[#1a1a1a] border border-neutral-700 rounded-lg shadow-sm">
                                {k}
                              </kbd>
                              {kIdx < item.keys.length - 1 && (
                                <span className="text-neutral-500 text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-[#121212] flex items-center justify-between text-[11px] text-neutral-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>LemAI Black Intelligence Core Shortcuts</span>
          </div>
          <span>Tekan <kbd className="px-1.5 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-neutral-300">Esc</kbd> untuk menutup</span>
        </div>
      </div>
    </div>
  );
};
