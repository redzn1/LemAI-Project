import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ActiveTool, 
  ChatSession, 
  Message, 
  UserProfile, 
  Attachment,
  TokenStatus
} from './types';
import { Sidebar } from './components/Sidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { CodingWorkspace } from './components/CodingWorkspace';
import { ResearchWorkspace } from './components/ResearchWorkspace';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { ImageGenWorkspace } from './components/ImageGenWorkspace';
import { VideoGenWorkspace } from './components/VideoGenWorkspace';
import { NotePage } from './components/NotePage';
import { OpenRouterDashboard } from './components/OpenRouterDashboard';
import { SettingsPage } from './components/SettingsPage';
import { AuthScreen } from './components/AuthScreen';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanel } from './components/AdminPanel';
import { CommandPalette } from './components/CommandPalette';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { FirebaseDeploymentModal } from './components/FirebaseDeploymentModal';
import { LoadingScreen } from './components/LoadingScreen';
import { subscribeToAuth, logout } from './lib/firebase';
import { streamMessage, sendMessage } from './api/api';
import { notifyResponseComplete, soundEffects } from './lib/notifications';
import { getTokenStatus, deductTokensForResponse } from './lib/tokenManager';
import { 
  Menu, 
  Sparkles, 
  Terminal, 
  Code2, 
  Search, 
  Layout, 
  Image, 
  Video, 
  Shield, 
  AlertTriangle, 
  Lock,
  Keyboard as KeyboardIcon
} from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'lemai_chat_sessions_v3';
const STORAGE_KEY_MODEL = 'lemai_selected_model_v2';
const STORAGE_KEY_GUEST = 'lemai_guest_user_v2';

/**
 * Generate unique 24-character alphanumeric session ID
 * Format: chat_(24 random letters & numbers)
 */
export function generate24CharSessionId(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `chat_${result}`;
}

export default function App() {
  // Auth state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Modals & Panels state
  const [activeTool, setActiveTool] = useState<ActiveTool>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsModalOpen, setShortcutsModalOpen] = useState(false);
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);
  const [quotaExhaustedAlert, setQuotaExhaustedAlert] = useState<string | null>(null);

  // Token status tracker
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(() => {
    return getTokenStatus('guest@limone.my.id');
  });

  // Model selection
  const [selectedModelId, setSelectedModelId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_MODEL) || 'lemai-1.0-flash';
  });

  // Refresh token status when user changes
  const refreshTokens = useCallback(() => {
    const currentEmail = user?.email || 'guest@limone.my.id';
    const status = getTokenStatus(currentEmail);
    setTokenStatus(status);
  }, [user]);

  useEffect(() => {
    refreshTokens();
  }, [user, refreshTokens]);

  // Chat sessions state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SESSIONS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load sessions from storage:', e);
    }
    return [];
  });

  // currentSessionId can be a specific 'chat_...' ID or 'new'
  const [currentSessionId, setCurrentSessionId] = useState<string>('new');

  const [isGenerating, setIsGenerating] = useState(false);
  const [stopStreamFn, setStopStreamFn] = useState<(() => void) | null>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions:', e);
    }
  }, [sessions]);

  // Sync selected model
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MODEL, selectedModelId);
  }, [selectedModelId]);

  // Check guest state
  useEffect(() => {
    const guestSaved = localStorage.getItem(STORAGE_KEY_GUEST);
    if (guestSaved === 'true') {
      setIsGuest(true);
    }
  }, []);

  // Firebase auth state observer
  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sync state from current URL path
  const syncRouteFromPath = useCallback(() => {
    const rawPath = window.location.pathname;
    const cleanPath = rawPath.replace(/^\/+/, '').trim();

    if (!cleanPath || cleanPath === 'new') {
      setActiveTool('chat');
      setCurrentSessionId('new');
    } else if (cleanPath === 'settings') {
      setActiveTool('settings');
    } else if (cleanPath === 'note' || cleanPath === 'notes') {
      setActiveTool('note');
    } else if (cleanPath === 'coding') {
      setActiveTool('coding');
    } else if (cleanPath === 'canvas') {
      setActiveTool('canvas');
    } else if (cleanPath === 'image') {
      setActiveTool('image');
    } else if (cleanPath === 'video') {
      setActiveTool('video');
    } else if (cleanPath === 'research') {
      setActiveTool('research');
    } else if (cleanPath === 'openr' || cleanPath === 'openrouter') {
      setActiveTool('openr');
    } else if (cleanPath.startsWith('chat_') || cleanPath.startsWith('chat/')) {
      const chatId = cleanPath.startsWith('chat/') ? cleanPath.replace('chat/', 'chat_') : cleanPath;
      setActiveTool('chat');
      setCurrentSessionId(chatId);
    } else if (cleanPath.startsWith('session-')) {
      // Legacy session format support
      setActiveTool('chat');
      setCurrentSessionId(cleanPath);
    } else {
      // Default to chat
      setActiveTool('chat');
    }
  }, []);

  useEffect(() => {
    syncRouteFromPath();
    window.addEventListener('popstate', syncRouteFromPath);
    return () => window.removeEventListener('popstate', syncRouteFromPath);
  }, [syncRouteFromPath]);

  // Find active chat session
  const currentSession = currentSessionId === 'new' 
    ? null 
    : sessions.find((s) => s.id === currentSessionId) || null;

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    if (currentSessionId !== 'new') {
      setSessions((prev) =>
        prev.map((s) => (s.id === currentSessionId ? { ...s, modelId } : s))
      );
    }
  };

  /**
   * Navigate to a dedicated page / tool
   */
  const handleToolChange = (tool: ActiveTool) => {
    soundEffects.playClickPop();
    setActiveTool(tool);
    setSidebarOpen(false);

    if (tool === 'chat') {
      if (currentSessionId === 'new' || !currentSession) {
        window.history.pushState(null, '', '/new');
      } else {
        window.history.pushState(null, '', `/${currentSession.id}`);
      }
    } else if (tool === 'settings') {
      window.history.pushState(null, '', '/settings');
    } else if (tool === 'note') {
      window.history.pushState(null, '', '/note');
    } else if (tool === 'coding') {
      window.history.pushState(null, '', '/coding');
    } else if (tool === 'canvas') {
      window.history.pushState(null, '', '/canvas');
    } else if (tool === 'image') {
      window.history.pushState(null, '', '/image');
    } else if (tool === 'video') {
      window.history.pushState(null, '', '/video');
    } else if (tool === 'research') {
      window.history.pushState(null, '', '/research');
    } else if (tool === 'openr') {
      window.history.pushState(null, '', '/openr');
    }
  };

  /**
   * New Chat Handler:
   * Sets currentSessionId to 'new', sets activeTool to 'chat', updates URL to /new.
   * Does NOT add anything to sessions until a message is sent!
   */
  const handleNewChat = () => {
    soundEffects.playClickPop();
    setCurrentSessionId('new');
    setActiveTool('chat');
    setSidebarOpen(false);
    window.history.pushState(null, '', '/new');
  };

  /**
   * Select an existing chat session:
   * Updates state & URL to domain.com/chat_(24 chars)
   */
  const handleSelectSession = (id: string) => {
    soundEffects.playClickPop();
    setCurrentSessionId(id);
    setActiveTool('chat');
    setSidebarOpen(false);
    window.history.pushState(null, '', `/${id}`);
  };

  /**
   * Global Keyboard Shortcut Manager:
   * '?' -> Keyboard Shortcuts cheat-sheet overlay
   * Ctrl+K / Cmd+K -> Command Palette
   * Ctrl+N / Cmd+N -> New Chat (/new)
   * Ctrl+, / Cmd+, -> Settings (/settings)
   * Esc -> Close all modals
   * Ctrl+1..8 -> Quick tool navigation
   */
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const isTyping = activeElement instanceof HTMLInputElement || 
                       activeElement instanceof HTMLTextAreaElement ||
                       activeElement?.getAttribute('contenteditable') === 'true';

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const isModifier = isMac ? e.metaKey : e.ctrlKey;

      // 1. Cheat-Sheet Overlay Trigger: '?' (when not typing)
      if (e.key === '?' && !isTyping && !isModifier) {
        e.preventDefault();
        soundEffects.playClickPop();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 1.5 Alt Shortcut for Help: Ctrl+/ or Cmd+/
      if (isModifier && e.key === '/') {
        e.preventDefault();
        soundEffects.playClickPop();
        setShortcutsModalOpen((prev) => !prev);
        return;
      }

      // 2. Command Palette: Ctrl+K / Cmd+K
      if (isModifier && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        soundEffects.playClickPop();
        setCommandPaletteOpen((prev) => !prev);
        return;
      }

      // 3. Start New Chat: Ctrl+N / Cmd+N
      if (isModifier && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleNewChat();
        setCommandPaletteOpen(false);
        return;
      }

      // 4. Open Settings: Ctrl+, / Cmd+,
      if (isModifier && e.key === ',') {
        e.preventDefault();
        handleToolChange('settings');
        setCommandPaletteOpen(false);
        return;
      }

      // 5. Escape closes any active modal
      if (e.key === 'Escape') {
        if (shortcutsModalOpen) {
          setShortcutsModalOpen(false);
        } else if (commandPaletteOpen) {
          setCommandPaletteOpen(false);
        } else if (settingsOpen) {
          setSettingsOpen(false);
        } else if (adminPanelOpen) {
          setAdminPanelOpen(false);
        } else if (firebaseModalOpen) {
          setFirebaseModalOpen(false);
        }
      }

      // 6. Tool switching shortcuts (Ctrl+1 to Ctrl+8)
      if (isModifier && !e.shiftKey && !e.altKey && !isTyping) {
        if (e.key === '1') {
          e.preventDefault();
          handleToolChange('chat');
        } else if (e.key === '2') {
          e.preventDefault();
          handleToolChange('coding');
        } else if (e.key === '3') {
          e.preventDefault();
          handleToolChange('note');
        } else if (e.key === '4') {
          e.preventDefault();
          handleToolChange('canvas');
        } else if (e.key === '5') {
          e.preventDefault();
          handleToolChange('image');
        } else if (e.key === '6') {
          e.preventDefault();
          handleToolChange('video');
        } else if (e.key === '7') {
          e.preventDefault();
          handleToolChange('research');
        } else if (e.key === '8') {
          if (user?.role === 'developer' || user?.role === 'admin') {
            e.preventDefault();
            handleToolChange('openr');
          }
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [commandPaletteOpen, shortcutsModalOpen, settingsOpen, adminPanelOpen, firebaseModalOpen, user, currentSessionId]);

  const handlePinSession = (id: string) => {
    soundEffects.playClickPop();
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    soundEffects.playClickPop();
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle.trim() || s.title, updatedAt: Date.now() } : s))
    );
  };

  const handleDeleteSession = (id: string) => {
    soundEffects.playClickPop();
    const remaining = sessions.filter((s) => s.id !== id);
    setSessions(remaining);

    if (currentSessionId === id) {
      if (remaining.length > 0) {
        handleSelectSession(remaining[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    soundEffects.playClickPop();
    if (currentSessionId === 'new') return;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const msgIndex = s.messages.findIndex((m) => m.id === messageId);
          if (msgIndex === -1) return s;
          const targetMsg = s.messages[msgIndex];
          let newMessages = [...s.messages];
          if (targetMsg.role === 'user' && newMessages[msgIndex + 1]?.role === 'assistant') {
            newMessages.splice(msgIndex, 2);
          } else {
            newMessages.splice(msgIndex, 1);
          }
          return {
            ...s,
            messages: newMessages,
          };
        }
        return s;
      })
    );
  };

  const handleEditUserMessage = async (messageId: string, newText: string) => {
    if (currentSessionId === 'new') return;
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;

    const msgIndex = session.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = session.messages[msgIndex];
    const historyBefore = session.messages.slice(0, msgIndex);

    const updatedUserMessage: Message = {
      ...targetMsg,
      content: newText,
      timestamp: Date.now(),
    };

    const assistantMessageId = `msg-asst-${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: selectedModelId,
      status: 'streaming',
    };

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            updatedAt: Date.now(),
            messages: [...historyBefore, updatedUserMessage, initialAssistantMessage],
          };
        }
        return s;
      })
    );

    setIsGenerating(true);

    try {
      const currentEmail = user?.email || 'guest@limone.my.id';
      const abortFn = await streamMessage(
        {
          modelId: selectedModelId,
          prompt: newText,
          attachments: targetMsg.attachments,
          history: historyBefore.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onChunk: (chunk: string) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === currentSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + chunk }
                        : m
                    ),
                  };
                }
                return s;
              })
            );
          },
          onSources: (sources) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === currentSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, sources } : m
                    ),
                  };
                }
                return s;
              })
            );
          },
          onComplete: (fullText: string) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === currentSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: fullText || m.content, status: 'complete' }
                        : m
                    ),
                  };
                }
                return s;
              })
            );
            setIsGenerating(false);
            setStopStreamFn(null);

            deductTokensForResponse(currentEmail, fullText);
            refreshTokens();
            notifyResponseComplete('LemAI • Respon Diperbarui', 'Pesan berhasil diedit dan AI telah memperbarui jawaban.');
          },
          onError: async (error: Error) => {
            console.error('Error during message edit stream:', error);
            setIsGenerating(false);
            setStopStreamFn(null);
          },
        }
      );

      setStopStreamFn(() => abortFn);
    } catch (err: any) {
      console.error('Edit message initiation failed:', err);
      setIsGenerating(false);
    }
  };

  const handleRegenerateResponse = async (assistantMessageId: string) => {
    if (currentSessionId === 'new') return;
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;

    const asstIndex = session.messages.findIndex((m) => m.id === assistantMessageId);
    if (asstIndex === -1) return;

    let precedingUserMsg: Message | null = null;
    for (let i = asstIndex - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        precedingUserMsg = session.messages[i];
        break;
      }
    }

    if (!precedingUserMsg) return;

    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: s.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: '', status: 'streaming', modelId: selectedModelId }
                : m
            ),
          };
        }
        return s;
      })
    );

    setIsGenerating(true);
    const historyBefore = session.messages.slice(0, session.messages.indexOf(precedingUserMsg));

    try {
      const currentEmail = user?.email || 'guest@limone.my.id';
      const abortFn = await streamMessage(
        {
          modelId: selectedModelId,
          prompt: precedingUserMsg.content,
          attachments: precedingUserMsg.attachments,
          history: historyBefore.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        },
        {
          onChunk: (chunk: string) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === currentSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + chunk }
                        : m
                    ),
                  };
                }
                return s;
              })
            );
          },
          onComplete: (fullText: string) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === currentSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: fullText || m.content, status: 'complete' }
                        : m
                    ),
                  };
                }
                return s;
              })
            );
            setIsGenerating(false);
            setStopStreamFn(null);
            deductTokensForResponse(currentEmail, fullText);
            refreshTokens();
            notifyResponseComplete('LemAI • Jawaban Baru Dibuat', 'AI telah membuat ulang respon.');
          },
          onError: () => {
            setIsGenerating(false);
            setStopStreamFn(null);
          },
        }
      );
      setStopStreamFn(() => abortFn);
    } catch (err: any) {
      setIsGenerating(false);
    }
  };

  /**
   * Main Send Message Handler:
   * 1. If currently on `/new`:
   *    - Generates 24-character session ID `chat_...`
   *    - Creates session entry
   *    - Updates browser URL to `/${newId}`
   *    - Streams response!
   * 2. If in existing chat:
   *    - Appends messages and streams response!
   */
  const handleSendMessage = async (text: string, attachments: Attachment[] = []) => {
    if (!text.trim() && attachments.length === 0) return;

    // Check token quota
    const currentEmail = user?.email || 'guest@limone.my.id';
    const currentStatus = getTokenStatus(currentEmail);

    if (!currentStatus.isUnlimited && currentStatus.tokensRemaining <= 0) {
      setQuotaExhaustedAlert(
        `⚠️ Batas Kuota Token Mingguan Habis (0 / ${currentStatus.tokensLimit.toLocaleString()} Token). Kuota akan direset otomatis setiap 7 hari (${currentStatus.daysUntilReset} hari lagi), atau hubungi Admin / Developer untuk penambahan token.`
      );
      return;
    }

    setQuotaExhaustedAlert(null);

    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
    };

    const assistantMessageId = `msg-asst-${Date.now()}`;
    const initialAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      modelId: selectedModelId,
      status: 'streaming',
    };

    let targetSessionId = currentSessionId;
    let historyForApi: { role: 'user' | 'assistant'; content: string }[] = [];

    if (currentSessionId === 'new' || !currentSession) {
      // First message in new chat -> create unique 24-character session
      const newChatId = generate24CharSessionId();
      targetSessionId = newChatId;

      const newSession: ChatSession = {
        id: newChatId,
        title: text.slice(0, 34) + (text.length > 34 ? '...' : ''),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        messages: [userMessage, initialAssistantMessage],
        modelId: selectedModelId,
      };

      setSessions((prev) => [newSession, ...prev]);
      setCurrentSessionId(newChatId);
      window.history.pushState(null, '', `/${newChatId}`);
    } else {
      // Existing chat
      historyForApi = currentSession.messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        }));

      setSessions((prev) =>
        prev.map((session) => {
          if (session.id === targetSessionId) {
            return {
              ...session,
              updatedAt: Date.now(),
              messages: [...session.messages, userMessage, initialAssistantMessage],
            };
          }
          return session;
        })
      );
    }

    setIsGenerating(true);

    try {
      const abortFn = await streamMessage(
        {
          modelId: selectedModelId,
          prompt: text,
          attachments,
          history: historyForApi,
        },
        {
          onChunk: (chunk: string) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === targetSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: m.content + chunk }
                        : m
                    ),
                  };
                }
                return s;
              })
            );
          },
          onSources: (sources) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === targetSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, sources } : m
                    ),
                  };
                }
                return s;
              })
            );
          },
          onComplete: (fullText: string) => {
            setSessions((prev) =>
              prev.map((s) => {
                if (s.id === targetSessionId) {
                  return {
                    ...s,
                    messages: s.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: fullText || m.content, status: 'complete' }
                        : m
                    ),
                  };
                }
                return s;
              })
            );
            setIsGenerating(false);
            setStopStreamFn(null);
            
            // Deduct tokens for completed response
            deductTokensForResponse(currentEmail, fullText);
            refreshTokens();
            
            notifyResponseComplete('LemAI • Jawaban Selesai', 'AI telah selesai memproses jawaban Anda.');
          },
          onError: async (error: Error) => {
            console.warn('Stream failed, attempting fallback completion:', error);
            try {
              const fallback = await sendMessage({
                modelId: selectedModelId,
                prompt: text,
                attachments,
              });

              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: fallback.text,
                              sources: fallback.sources,
                              status: 'complete',
                            }
                          : m
                      ),
                    };
                  }
                  return s;
                })
              );

              deductTokensForResponse(currentEmail, fallback.text);
              refreshTokens();
              notifyResponseComplete('LemAI • Jawaban Selesai', 'AI telah selesai memproses jawaban Anda.');
            } catch (fallbackErr: any) {
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === targetSessionId) {
                    return {
                      ...s,
                      messages: s.messages.map((m) =>
                        m.id === assistantMessageId
                          ? {
                              ...m,
                              content: `Error: ${fallbackErr.message || error.message || 'Failed to generate response.'}`,
                              status: 'error',
                            }
                          : m
                      ),
                    };
                  }
                  return s;
                })
              );
            } finally {
              setIsGenerating(false);
              setStopStreamFn(null);
            }
          },
        }
      );

      setStopStreamFn(() => abortFn);
    } catch (err: any) {
      console.error('Message initiation failed:', err);
      setIsGenerating(false);
    }
  };

  const handleStopGeneration = () => {
    if (stopStreamFn) {
      stopStreamFn();
      setStopStreamFn(null);
    }
    setIsGenerating(false);
  };

  const handleClearHistory = () => {
    if (currentSessionId === 'new') return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === currentSessionId ? { ...s, messages: [] } : s
      )
    );
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setIsGuest(false);
    localStorage.removeItem(STORAGE_KEY_GUEST);
  };

  const handleContinueAsGuest = () => {
    const guestUser: UserProfile = {
      uid: 'guest-' + Date.now(),
      username: 'guest_dev',
      email: 'guest@limone.my.id',
      displayName: 'Guest Developer',
      provider: 'password',
    };
    setUser(guestUser);
    setIsGuest(true);
    localStorage.setItem(STORAGE_KEY_GUEST, 'true');
  };

  // Render Modern Loading Screen on startup
  if (initialLoading) {
    return (
      <LoadingScreen
        minDurationMs={3000}
        isComplete={!authLoading}
        onComplete={() => setInitialLoading(false)}
      />
    );
  }

  // Render Auth screen if not authenticated and not in guest mode
  if (!user && !isGuest) {
    return (
      <AuthScreen
        onSuccess={(loggedUser) => setUser(loggedUser)}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#080808] text-[#eaeaea] overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Quota Exhausted Notification Popup */}
      {quotaExhaustedAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] p-4 rounded-2xl bg-red-950/95 border border-red-800 text-red-200 shadow-2xl backdrop-blur-md flex items-start gap-3 animate-in fade-in slide-in-from-top-4 duration-200">
          <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 text-xs">
            <span className="font-bold block mb-1">Akses AI Terbatas</span>
            <p className="leading-relaxed font-mono">{quotaExhaustedAlert}</p>
          </div>
          <button
            type="button"
            onClick={() => setQuotaExhaustedAlert(null)}
            className="text-red-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTool={activeTool}
        onSelectTool={handleToolChange}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onPinSession={handlePinSession}
        onRenameSession={handleRenameSession}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => handleToolChange('settings')}
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        onOpenFirebaseModal={() => setFirebaseModalOpen(true)}
        onOpenNote={() => handleToolChange('note')}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
        {/* Mobile Header with Hamburger Menu */}
        <div className="h-12 border-b border-neutral-900 bg-[#0a0a0a] px-3 flex items-center justify-between lg:hidden flex-shrink-0">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <img src="/logo.svg" alt="LemAI" className="w-5 h-5 object-contain" />
            <span className="font-bold text-sm text-white">LemAI</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShortcutsModalOpen(true)}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
              title="Pintasan Keyboard (?)"
            >
              <KeyboardIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNewChat}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
              title="Chat Baru"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dynamic Page / Tool Workspace Container (100% Native Scrollable) */}
        <div className="flex-1 h-full overflow-hidden">
          {activeTool === 'chat' && (
            <ChatWorkspace
              messages={currentSession?.messages || []}
              onSendMessage={handleSendMessage}
              currentModelId={selectedModelId}
              onSelectModel={handleSelectModel}
              isLoading={isGenerating}
              onStopGeneration={handleStopGeneration}
              onClearHistory={handleClearHistory}
              onSelectTool={handleToolChange}
              onEditUserMessage={handleEditUserMessage}
              onDeleteMessage={handleDeleteMessage}
              onRegenerateResponse={handleRegenerateResponse}
            />
          )}

          {activeTool === 'settings' && (
            <SettingsPage
              user={user}
              onLogout={handleLogout}
              defaultModelId={selectedModelId}
              onSelectDefaultModel={handleSelectModel}
              onUpdateUser={(updated) => setUser(updated)}
              onBackToApp={() => handleToolChange('chat')}
            />
          )}

          {activeTool === 'coding' && <CodingWorkspace currentUser={user} />}

          {activeTool === 'note' && <NotePage onBackToApp={() => handleToolChange('chat')} />}

          {/* OpenRouter Hub: Restricted to Admin & Developer Only */}
          {activeTool === 'openr' && (
            user?.role === 'developer' || user?.role === 'admin' ? (
              <OpenRouterDashboard onBackToApp={() => handleToolChange('chat')} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0a] font-['Plus_Jakarta_Sans',sans-serif]">
                <div className="w-16 h-16 rounded-3xl bg-amber-950/40 border border-amber-800/80 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
                  <Lock className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-white mb-2">Akses Terbatas: OpenRouter Hub</h2>
                <p className="text-xs text-neutral-400 max-w-md mb-6 leading-relaxed font-mono">
                  OpenRouter Gateway Hub hanya dapat diakses secara privat oleh akun dengan peran <strong>Developer</strong> atau <strong>Admin</strong> terverifikasi dengan token otorisasi.
                </p>
                <button
                  type="button"
                  onClick={() => handleToolChange('chat')}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold text-xs transition shadow-lg"
                >
                  Kembali ke Chat Workspace
                </button>
              </div>
            )
          )}

          {activeTool === 'research' && <ResearchWorkspace />}

          {activeTool === 'canvas' && <CanvasWorkspace />}

          {activeTool === 'image' && <ImageGenWorkspace />}

          {activeTool === 'video' && <VideoGenWorkspace />}
        </div>
      </main>

      {/* Keyboard Shortcuts Cheat-Sheet Overlay ('?' key) */}
      <KeyboardShortcutsModal
        isOpen={shortcutsModalOpen}
        onClose={() => setShortcutsModalOpen(false)}
        onSelectTool={handleToolChange}
        onNewChat={handleNewChat}
        onOpenSettings={() => handleToolChange('settings')}
        onOpenCommandPalette={() => setCommandPaletteOpen(true)}
      />

      {/* Global Command Palette (Ctrl+K / Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        onSelectTool={handleToolChange}
        onNewChat={handleNewChat}
        onOpenSettings={() => handleToolChange('settings')}
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        onOpenShortcutsModal={() => setShortcutsModalOpen(true)}
        onSelectModel={handleSelectModel}
        currentUser={user}
      />

      {/* Quick Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onLogout={handleLogout}
        defaultModelId={selectedModelId}
        onSelectDefaultModel={handleSelectModel}
        onUpdateUser={(updated) => setUser(updated)}
        onShowLoadingScreen={() => {
          setInitialLoading(true);
        }}
      />

      {/* Admin Control Panel */}
      <AdminPanel
        isOpen={adminPanelOpen}
        onClose={() => {
          setAdminPanelOpen(false);
          refreshTokens();
        }}
        currentUser={user}
        onRefreshUser={refreshTokens}
      />

      {/* Firebase & Vercel Deployment Modal */}
      <FirebaseDeploymentModal
        isOpen={firebaseModalOpen}
        onClose={() => setFirebaseModalOpen(false)}
      />
    </div>
  );
}
