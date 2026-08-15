import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Code2, 
  Settings, 
  LogOut, 
  Trash2, 
  User, 
  ChevronRight, 
  MoreVertical, 
  Sliders, 
  Moon, 
  Sparkles, 
  Terminal, 
  Shield, 
  Coins, 
  Cloud, 
  Crown,
  Pin,
  PinOff,
  Edit2,
  BookOpen,
  Check,
  Globe
} from 'lucide-react';
import { ActiveTool, ChatSession, UserProfile } from '../types';
import { formatTokenDisplay, getTokenStatus } from '../lib/tokenManager';

interface SidebarProps {
  activeTool: ActiveTool;
  onSelectTool: (tool: ActiveTool) => void;
  sessions: ChatSession[];
  currentSessionId: string;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string) => void;
  onPinSession?: (id: string) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  user: UserProfile | null;
  onLogout: () => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenSettings: () => void;
  onOpenAdminPanel?: () => void;
  onOpenFirebaseModal?: () => void;
  onOpenNote?: () => void;
  onOpenCommandPalette?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTool,
  onSelectTool,
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onPinSession,
  onRenameSession,
  user,
  onLogout,
  isOpen,
  onToggleOpen,
  onOpenSettings,
  onOpenAdminPanel,
  onOpenFirebaseModal,
  onOpenNote,
  onOpenCommandPalette,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const isAdminOrDev = user?.role === 'developer' || user?.role === 'admin';
  const tokenStatus = getTokenStatus(user?.email || '');

  // Tools in Sidebar (Coding IDE + Notes & Changelog domain.com/note + OpenRouter domain.my.id/openr - Dev/Admin only)
  const tools = [
    { id: 'coding' as ActiveTool, name: 'Coding IDE', icon: Code2, badge: 'Sandbox' },
    { id: 'note' as ActiveTool, name: 'Notes & Changelog', icon: BookOpen, badge: 'v2.5' },
    ...(isAdminOrDev ? [{ id: 'openr' as ActiveTool, name: 'OpenRouter Hub', icon: Globe, badge: 'Admin' }] : []),
  ];

  // Sort sessions: pinned sessions come first
  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  const handleStartRename = (session: ChatSession) => {
    setRenamingSessionId(session.id);
    setRenameInput(session.title || 'Untitled Conversation');
  };

  const handleSaveRename = (sessionId: string) => {
    if (renameInput.trim() && onRenameSession) {
      onRenameSession(sessionId, renameInput.trim());
    }
    setRenamingSessionId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
          onClick={onToggleOpen}
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 flex flex-col w-64 bg-[#0a0a0a] border-r border-neutral-900 transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header: LemAI Brand */}
        <div className="p-4 border-b border-neutral-900/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#121212] border border-neutral-800 p-1 flex items-center justify-center shadow-inner">
              <img src="/logo.svg" alt="LemAI" className="w-6 h-6 object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-base text-white tracking-tight leading-none">
                LemAI
              </h1>
              <span className="text-[10px] font-mono text-neutral-500 tracking-wider">
                Black Intelligence
              </span>
            </div>
          </div>
        </div>

        {/* Action: New Chat & Command Palette Buttons */}
        <div className="p-3 space-y-1.5">
          <button
            type="button"
            onClick={() => {
              onSelectTool('chat');
              onNewChat();
            }}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#141414] hover:bg-neutral-800 text-white border border-neutral-800 hover:border-neutral-700 text-xs font-semibold transition-all duration-150 shadow-sm group"
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4 text-neutral-400 group-hover:text-white transition-colors" />
              <span>New Chat</span>
            </div>
            <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
              ⌘N
            </span>
          </button>

          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-[#111111] hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-850 hover:border-neutral-700 text-xs font-medium transition-all duration-150 group"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-300 transition-colors" />
                <span>Command Menu</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                ⌘K
              </span>
            </button>
          )}

          {/* Token Status Badge Card */}
          <div className="p-2.5 rounded-xl bg-[#111111] border border-neutral-800/80 text-[11px] font-mono">
            <div className="flex items-center justify-between text-neutral-400 mb-1">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-semibold">Token Quota</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                tokenStatus.isUnlimited ? 'bg-amber-950/80 text-amber-300 border border-amber-800' : 'bg-neutral-800 text-neutral-300'
              }`}>
                {tokenStatus.role}
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-white font-bold">
                {formatTokenDisplay(tokenStatus.tokensRemaining)}
              </span>
              {!tokenStatus.isUnlimited && (
                <span className="text-[10px] text-neutral-500">
                  / 500K
                </span>
              )}
            </div>
            {!tokenStatus.isUnlimited && (
              <div className="mt-1.5 text-[9px] text-neutral-500 flex items-center justify-between border-t border-neutral-800/60 pt-1">
                <span>Reset 7 Hari</span>
                <span className="text-neutral-400">{tokenStatus.daysUntilReset} hari lagi</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Navigation Sections */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
          
          {/* Admin & Dev Panel Access if Authorized */}
          {isAdminOrDev && (
            <div>
              <div className="px-2 pb-1.5 text-[10px] font-mono font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Shield className="w-3 h-3" />
                <span>Control Center</span>
              </div>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => onOpenAdminPanel?.()}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium bg-amber-950/30 hover:bg-amber-900/40 text-amber-200 border border-amber-800/60 transition shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    {user?.role === 'developer' ? <Crown className="w-4 h-4 text-amber-400" /> : <Shield className="w-4 h-4 text-emerald-400" />}
                    <span className="font-semibold">Admin Panel</span>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-900/80 text-amber-200 border border-amber-700">
                    MANAGE
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Tools Suite (Only Coding) */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-mono font-medium text-neutral-500 uppercase tracking-wider">
              Tools
            </div>
            <div className="space-y-1">
              {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => onSelectTool(tool.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-neutral-800 text-white font-semibold shadow-sm'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                      <span>{tool.name}</span>
                    </div>
                    {tool.badge && (
                      <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                        isActive
                          ? 'bg-white text-black border-white font-bold'
                          : 'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}>
                        {tool.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent Chats Section */}
          <div>
            <div className="px-2 pb-1.5 text-[11px] font-mono font-medium text-neutral-500 uppercase tracking-wider flex items-center justify-between">
              <span>Chats</span>
              <span className="text-[10px] text-neutral-600 font-mono">
                {sessions.length}
              </span>
            </div>
            <div className="space-y-0.5">
              {sortedSessions.length === 0 ? (
                <div className="px-3 py-4 text-center text-[11px] text-neutral-600 font-mono">
                  No previous conversations
                </div>
              ) : (
                sortedSessions.map((session) => {
                  const isActive = activeTool === 'chat' && currentSessionId === session.id;
                  const isRenaming = renamingSessionId === session.id;

                  return (
                    <div
                      key={session.id}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800/90 text-white font-medium'
                          : 'text-neutral-400 hover:bg-neutral-900/80 hover:text-neutral-200'
                      }`}
                      onClick={() => {
                        if (!isRenaming) {
                          onSelectTool('chat');
                          onSelectSession(session.id);
                        }
                      }}
                    >
                      {isRenaming ? (
                        <div className="flex items-center gap-1.5 w-full" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameInput}
                            onChange={(e) => setRenameInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(session.id);
                              if (e.key === 'Escape') setRenamingSessionId(null);
                            }}
                            autoFocus
                            className="w-full bg-[#161616] border border-neutral-600 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-white font-sans"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(session.id)}
                            className="p-1 rounded bg-white text-black hover:bg-neutral-200 flex-shrink-0"
                            title="Simpan"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2 overflow-hidden mr-1">
                            {session.pinned ? (
                              <Pin className="w-3.5 h-3.5 flex-shrink-0 text-amber-400 fill-amber-400" />
                            ) : (
                              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 text-neutral-500 group-hover:text-neutral-300" />
                            )}
                            <span className="truncate">{session.title || 'Untitled Conversation'}</span>
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onPinSession && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onPinSession(session.id);
                                }}
                                className={`p-1 rounded hover:bg-neutral-700 transition ${
                                  session.pinned ? 'text-amber-400' : 'text-neutral-400 hover:text-white'
                                }`}
                                title={session.pinned ? 'Lepas Sematan (Unpin)' : 'Sematkan Chat (Pin)'}
                              >
                                {session.pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                              </button>
                            )}

                            {onRenameSession && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartRename(session);
                                }}
                                className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white transition"
                                title="Ganti Nama Chat"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Hapus percakapan ini?')) {
                                  onDeleteSession(session.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition"
                              title="Hapus Chat"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Profile & Settings */}
        <div className="p-3 border-t border-neutral-900 bg-[#080808] relative">
          {profileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#121212] border border-neutral-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-2 duration-150">
              <div className="px-3 py-2 border-b border-neutral-800/80 mb-1">
                <div className="text-xs font-semibold text-white flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>{user?.displayName || user?.username || 'LemAI Developer'}</span>
                  </div>
                  <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                    {user?.role || 'user'}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono truncate mt-0.5 select-all">
                  {user?.email || 'guest@limone.my.id'}
                </div>
              </div>

              <div className="space-y-0.5">
                {isAdminOrDev && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      onOpenAdminPanel?.();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-amber-300 hover:bg-amber-950/40 transition-colors"
                  >
                    <Shield className="w-3.5 h-3.5" />
                    <span>Admin Control Panel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onSelectTool('note');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Notes & Changelog (Limone)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onOpenSettings();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 hover:text-white transition-colors"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Settings & Preferences</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-950/30 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}

          <div
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-900 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-white">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  (user?.username?.[0] || 'L').toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-medium text-white truncate flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  {user?.username || 'Developer'}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono truncate">
                  {user?.email || 'username@limone.my.id'}
                </div>
              </div>
            </div>

            <MoreVertical className="w-4 h-4 text-neutral-500 hover:text-white" />
          </div>
        </div>
      </aside>
    </>
  );
};
