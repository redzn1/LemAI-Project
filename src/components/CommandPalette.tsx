import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MessageSquare, 
  Code2, 
  BookOpen, 
  Layout, 
  Image, 
  Video, 
  Globe, 
  Settings, 
  Plus, 
  Copy, 
  Shield, 
  Sparkles, 
  Zap, 
  Check, 
  Key, 
  ArrowRight,
  CornerDownLeft,
  X
} from 'lucide-react';
import { ActiveTool, UserProfile } from '../types';
import { soundEffects } from '../lib/notifications';

export interface CommandItem {
  id: string;
  category: 'Actions' | 'Tools & Workspaces' | 'AI Models';
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  badge?: string;
  adminOnly?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTool: (tool: ActiveTool) => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenAdminPanel?: () => void;
  onOpenShortcutsModal?: () => void;
  onSelectModel?: (modelId: string) => void;
  currentUser: UserProfile | null;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTool,
  onNewChat,
  onOpenSettings,
  onOpenAdminPanel,
  onOpenShortcutsModal,
  onSelectModel,
  currentUser,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isDevOrAdmin = currentUser?.role === 'developer' || currentUser?.role === 'admin';

  // Build command list dynamically
  const allCommands: CommandItem[] = [
    // 1. Actions
    {
      id: 'action-new-chat',
      category: 'Actions',
      title: 'Mulai Chat Baru',
      subtitle: 'Buka sesi percakapan baru dengan AI',
      icon: Plus,
      shortcut: '⌘N',
      action: () => {
        onSelectTool('chat');
        onNewChat();
        onClose();
      },
    },
    {
      id: 'action-copy-token',
      category: 'Actions',
      title: 'Salin LemAI Access Token',
      subtitle: currentUser?.accessToken ? `${currentUser.accessToken}` : 'Salin token otentikasi pribadi',
      icon: Key,
      badge: 'Token',
      action: () => {
        if (currentUser?.accessToken) {
          navigator.clipboard.writeText(currentUser.accessToken);
          setCopiedNotification(true);
          soundEffects.playClickPop();
          setTimeout(() => {
            setCopiedNotification(false);
            onClose();
          }, 1200);
        }
      },
    },
    {
      id: 'action-shortcuts',
      category: 'Actions',
      title: 'Pintasan Keyboard (Cheat-sheet Overlay)',
      subtitle: 'Tampilkan daftar lengkap shortcut sistem',
      icon: Layout,
      shortcut: '?',
      action: () => {
        onClose();
        onOpenShortcutsModal?.();
      },
    },
    {
      id: 'action-settings',
      category: 'Actions',
      title: 'Pengaturan & Profil Akun',
      subtitle: 'Kelola foto profil, username, tema & konfigurasi',
      icon: Settings,
      shortcut: '⌘,',
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    ...(isDevOrAdmin && onOpenAdminPanel
      ? [
          {
            id: 'action-admin-panel',
            category: 'Actions' as const,
            title: 'Admin & Token Management Control',
            subtitle: 'Kelola kuota, role permission, dan direktori token user',
            icon: Shield,
            badge: currentUser?.role === 'developer' ? 'Root Dev' : 'Admin',
            action: () => {
              onOpenAdminPanel();
              onClose();
            },
          },
        ]
      : []),

    // 2. Tools & Workspaces
    {
      id: 'tool-chat',
      category: 'Tools & Workspaces',
      title: 'Chat Assistant Workspace',
      subtitle: 'Percakapan multi-turn AI dengan streaming instan',
      icon: MessageSquare,
      shortcut: '⌘1',
      action: () => {
        onSelectTool('chat');
        onClose();
      },
    },
    {
      id: 'tool-coding',
      category: 'Tools & Workspaces',
      title: 'Coding IDE Sandbox',
      subtitle: 'Code editor multi-file, preview live & AI auto-apply generator',
      icon: Code2,
      shortcut: '⌘2',
      badge: 'Sandbox',
      action: () => {
        onSelectTool('coding');
        onClose();
      },
    },
    {
      id: 'tool-note',
      category: 'Tools & Workspaces',
      title: 'Notes & Changelog Studio (/note)',
      subtitle: 'Catatan pintar AI, ringkasan dan dokumentasi perubahan sistem',
      icon: BookOpen,
      shortcut: '⌘3',
      action: () => {
        onSelectTool('note');
        onClose();
      },
    },
    {
      id: 'tool-canvas',
      category: 'Tools & Workspaces',
      title: 'Visual Canvas Workspace',
      subtitle: 'Papan gambar interaktif untuk diagram dan sketsa visual',
      icon: Layout,
      shortcut: '⌘4',
      action: () => {
        onSelectTool('canvas');
        onClose();
      },
    },
    {
      id: 'tool-image',
      category: 'Tools & Workspaces',
      title: 'Image Generator Studio',
      subtitle: 'Studio pembuatan gambar AI resolusi tinggi dengan berbagai rasio',
      icon: Image,
      shortcut: '⌘5',
      action: () => {
        onSelectTool('image');
        onClose();
      },
    },
    {
      id: 'tool-video',
      category: 'Tools & Workspaces',
      title: 'Video Generator Studio',
      subtitle: 'Generator skenario dan animasi video berbasis prompt',
      icon: Video,
      shortcut: '⌘6',
      action: () => {
        onSelectTool('video');
        onClose();
      },
    },
    {
      id: 'tool-research',
      category: 'Tools & Workspaces',
      title: 'Research & Analysis Hub',
      subtitle: 'Riset mendalam multi-sumber dan laporan komprehensif',
      icon: Search,
      shortcut: '⌘7',
      action: () => {
        onSelectTool('research');
        onClose();
      },
    },
    ...(isDevOrAdmin
      ? [
          {
            id: 'tool-openr',
            category: 'Tools & Workspaces' as const,
            title: 'OpenRouter AI Hub Gateway (/openr)',
            subtitle: 'Akses gateway OpenRouter (Khusus Admin & Developer)',
            icon: Globe,
            shortcut: '⌘8',
            badge: 'Admin Only',
            action: () => {
              onSelectTool('openr');
              onClose();
            },
          },
        ]
      : []),

    // 3. AI Model Switcher
    {
      id: 'model-flash',
      category: 'AI Models',
      title: 'Ganti Model: LemAI 1.0 Flash Gateway',
      subtitle: 'Gateway direct super cepat tanpa batas',
      icon: Zap,
      badge: 'Super Fast',
      action: () => {
        if (onSelectModel) onSelectModel('lemai-1.0-flash');
        onClose();
      },
    },
    {
      id: 'model-pro',
      category: 'AI Models',
      title: 'Ganti Model: LemAI 1.1 Pro (POST)',
      subtitle: 'Kemampuan penalaran mendalam dan coding presisi tinggi',
      icon: Sparkles,
      badge: 'Deep Reasoning',
      action: () => {
        if (onSelectModel) onSelectModel('lemai-1.1-pro');
        onClose();
      },
    },
  ];

  // Filter commands by query
  const filteredCommands = allCommands.filter((cmd) => {
    const q = query.toLowerCase();
    return (
      cmd.title.toLowerCase().includes(q) ||
      (cmd.subtitle && cmd.subtitle.toLowerCase().includes(q)) ||
      cmd.category.toLowerCase().includes(q) ||
      (cmd.badge && cmd.badge.toLowerCase().includes(q))
    );
  });

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard navigation inside command palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredCommands.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % (filteredCommands.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        soundEffects.playClickPop();
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  // Keep selected item visible in list
  useEffect(() => {
    const el = document.getElementById(`cmd-item-${selectedIndex}`);
    if (el && listRef.current) {
      el.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  // Group filtered items by category
  const categories: Array<'Actions' | 'Tools & Workspaces' | 'AI Models'> = [
    'Actions',
    'Tools & Workspaces',
    'AI Models',
  ];

  let flatIndex = 0;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150 font-['Plus_Jakarta_Sans',sans-serif]"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-[#0d0d0d] border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150 ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-neutral-800 flex items-center gap-3 bg-[#111111]">
          <Search className="w-5 h-5 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Ketik perintah, alat, aksi, atau model... (contoh: coding, chat, token)"
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-neutral-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-mono px-2 py-1 rounded-md bg-neutral-900 border border-neutral-800 text-neutral-400 shrink-0">
            ESC to close
          </span>
        </div>

        {/* Copy Token Toast Alert */}
        {copiedNotification && (
          <div className="p-3 bg-emerald-950/80 border-b border-emerald-800 text-emerald-200 text-xs font-mono flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Token Akses LemAI berhasil disalin ke clipboard!</span>
            </div>
          </div>
        )}

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[60vh]">
          {filteredCommands.length === 0 ? (
            <div className="py-12 text-center text-neutral-500 text-xs font-mono">
              Tidak ada perintah atau alat yang cocok dengan "{query}"
            </div>
          ) : (
            categories.map((cat) => {
              const itemsInCat = filteredCommands.filter((cmd) => cmd.category === cat);
              if (itemsInCat.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">
                    {cat}
                  </div>

                  {itemsInCat.map((cmd) => {
                    const currentIndex = flatIndex++;
                    const isSelected = selectedIndex === currentIndex;
                    const IconComp = cmd.icon;

                    return (
                      <div
                        id={`cmd-item-${currentIndex}`}
                        key={cmd.id}
                        onClick={() => {
                          soundEffects.playClickPop();
                          cmd.action();
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition text-xs ${
                          isSelected
                            ? 'bg-neutral-800/90 text-white shadow-md border border-neutral-700 ring-1 ring-white/10'
                            : 'text-neutral-300 hover:bg-neutral-900 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate flex-1">
                          <div className={`p-2 rounded-xl border shrink-0 ${
                            isSelected 
                              ? 'bg-neutral-700 border-neutral-600 text-white' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}>
                            <IconComp className="w-4 h-4" />
                          </div>

                          <div className="truncate">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white truncate">{cmd.title}</span>
                              {cmd.badge && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                                  {cmd.badge}
                                </span>
                              )}
                            </div>
                            {cmd.subtitle && (
                              <p className="text-[11px] text-neutral-400 font-mono truncate mt-0.5">
                                {cmd.subtitle}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 ml-3">
                          {cmd.shortcut && (
                            <span className="text-[10px] font-mono px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400">
                              {cmd.shortcut}
                            </span>
                          )}
                          {isSelected && (
                            <span className="p-1 rounded-lg bg-neutral-700 text-neutral-300">
                              <CornerDownLeft className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) }
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="p-3 bg-[#0a0a0a] border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500 px-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">↑↓</kbd> Navigasi
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">↵</kbd> Pilih
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">Ctrl+K</kbd> Buka Menu
            </span>
          </div>
          <div>
            <span className="text-neutral-400">LemAI Hub v2.5</span>
          </div>
        </div>
      </div>
    </div>
  );
};
