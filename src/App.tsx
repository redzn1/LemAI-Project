import React, { useState, useEffect, useCallback } from 'react';
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
import { AuthScreen } from './components/AuthScreen';
import { SettingsModal } from './components/SettingsModal';
import { AdminPanel } from './components/AdminPanel';
import { FirebaseDeploymentModal } from './components/FirebaseDeploymentModal';
import { LoadingScreen } from './components/LoadingScreen';
import { subscribeToAuth, logout } from './lib/firebase';
import { streamMessage, sendMessage } from './api/api';
import { notifyResponseComplete } from './lib/notifications';
import { getTokenStatus, deductTokensForResponse } from './lib/tokenManager';
import { Menu, Sparkles, Terminal, Code2, Search, Layout, Image, Video, Shield, AlertTriangle } from 'lucide-react';

const STORAGE_KEY_SESSIONS = 'lemai_chat_sessions_v2';
const STORAGE_KEY_MODEL = 'lemai_selected_model_v2';
const STORAGE_KEY_GUEST = 'lemai_guest_user_v2';

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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load sessions from storage:', e);
    }
    const initialSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: 'lemai-1.0-flash',
    };
    return [initialSession];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session-${Date.now()}`;
  });

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

  const currentSession = sessions.find((s) => s.id === currentSessionId) || sessions[0];

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    setSessions((prev) =>
      prev.map((s) => (s.id === currentSessionId ? { ...s, modelId } : s))
    );
  };

  // URL Route Sync (supports domain.com/note)
  useEffect(() => {
    const syncRoute = () => {
      if (window.location.pathname === '/note') {
        setActiveTool('note');
      }
    };
    syncRoute();
    window.addEventListener('popstate', syncRoute);
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  const handleToolChange = (tool: ActiveTool) => {
    setActiveTool(tool);
    setSidebarOpen(false);
    if (tool === 'note') {
      window.history.pushState(null, '', '/note');
    } else {
      if (window.location.pathname === '/note') {
        window.history.pushState(null, '', '/');
      }
    }
  };

  const handlePinSession = (id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s))
    );
  };

  const handleRenameSession = (id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle.trim() || s.title, updatedAt: Date.now() } : s))
    );
  };

  const handleDeleteMessage = (messageId: string) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id === currentSessionId) {
          const msgIndex = s.messages.findIndex((m) => m.id === messageId);
          if (msgIndex === -1) return s;
          const targetMsg = s.messages[msgIndex];
          // If user message, also remove following assistant message if directly paired
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
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;

    const msgIndex = session.messages.findIndex((m) => m.id === messageId);
    if (msgIndex === -1) return;

    const targetMsg = session.messages[msgIndex];
    // Slice history strictly up to this user message (truncate future messages)
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
    const session = sessions.find((s) => s.id === currentSessionId);
    if (!session) return;

    const asstIndex = session.messages.findIndex((m) => m.id === assistantMessageId);
    if (asstIndex === -1) return;

    // Find preceding user message
    let precedingUserMsg: Message | null = null;
    for (let i = asstIndex - 1; i >= 0; i--) {
      if (session.messages[i].role === 'user') {
        precedingUserMsg = session.messages[i];
        break;
      }
    }

    if (!precedingUserMsg) return;

    // Reset this assistant message
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

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Conversation',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
      modelId: selectedModelId,
    };
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setActiveTool('chat');
    setSidebarOpen(false);
  };

  const handleDeleteSession = (id: string) => {
    setSessions((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      if (filtered.length === 0) {
        const fresh: ChatSession = {
          id: `session-${Date.now()}`,
          title: 'New Conversation',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          messages: [],
          modelId: selectedModelId,
        };
        return [fresh];
      }
      return filtered;
    });

    if (currentSessionId === id) {
      const remaining = sessions.filter((s) => s.id !== id);
      setCurrentSessionId(remaining[0]?.id || `session-${Date.now()}`);
    }
  };

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

    // Update active session messages
    setSessions((prev) =>
      prev.map((session) => {
        if (session.id === currentSessionId) {
          const isFirstMessage = session.messages.length === 0;
          const updatedTitle = isFirstMessage && text ? text.slice(0, 32) + (text.length > 32 ? '...' : '') : session.title;
          return {
            ...session,
            title: updatedTitle,
            updatedAt: Date.now(),
            messages: [...session.messages, userMessage, initialAssistantMessage],
          };
        }
        return session;
      })
    );

    setIsGenerating(true);

    try {
      const abortFn = await streamMessage(
        {
          modelId: selectedModelId,
          prompt: text,
          attachments,
          history: currentSession.messages.map((m) => ({
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
            
            // Deduct tokens for completed response (5 chars = 2 tokens)
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
                  if (s.id === currentSessionId) {
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

              // Deduct tokens for fallback response
              deductTokensForResponse(currentEmail, fallback.text);
              refreshTokens();

              notifyResponseComplete('LemAI • Jawaban Selesai', 'AI telah selesai memproses jawaban Anda.');
            } catch (fallbackErr: any) {
              setSessions((prev) =>
                prev.map((s) => {
                  if (s.id === currentSessionId) {
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
        minDurationMs={1400}
        isComplete={!authLoading}
        onComplete={() => setInitialLoading(false)}
      />
    );
  }

  // Render Auth screen if not authenticated and not in guest mode
  if (!authLoading && !user && !isGuest) {
    return (
      <AuthScreen
        onSuccess={(loggedUser) => setUser(loggedUser)}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  return (
    <div className="flex h-screen w-screen bg-[#080808] text-[#eaeaea] overflow-hidden select-none font-['Plus_Jakarta_Sans',sans-serif]">
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
        onSelectSession={(id) => {
          setCurrentSessionId(id);
          setActiveTool('chat');
          if (window.location.pathname === '/note') {
            window.history.pushState(null, '', '/');
          }
          setSidebarOpen(false);
        }}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onPinSession={handlePinSession}
        onRenameSession={handleRenameSession}
        user={user}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggleOpen={() => setSidebarOpen(!sidebarOpen)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAdminPanel={() => setAdminPanelOpen(true)}
        onOpenFirebaseModal={() => setFirebaseModalOpen(true)}
        onOpenNote={() => handleToolChange('note')}
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

          <button
            type="button"
            onClick={handleNewChat}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 transition"
          >
            <Sparkles className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Tool Workspace Container */}
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

          {activeTool === 'coding' && <CodingWorkspace />}

          {activeTool === 'note' && <NotePage onBackToApp={() => handleToolChange('chat')} />}

          {activeTool === 'research' && <ResearchWorkspace />}

          {activeTool === 'canvas' && <CanvasWorkspace />}

          {activeTool === 'image' && <ImageGenWorkspace />}

          {activeTool === 'video' && <VideoGenWorkspace />}
        </div>
      </main>

      {/* Settings Modal */}
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
