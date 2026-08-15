import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Paperclip, 
  Mic, 
  MicOff, 
  Image as ImageIcon, 
  Sparkles, 
  StopCircle, 
  Trash2, 
  X, 
  FileText, 
  Code2, 
  Copy, 
  Check, 
  BookOpen, 
  ExternalLink,
  ChevronDown,
  Terminal,
  Layers,
  Search,
  Video as VideoIcon,
  Palette,
  Cpu,
  Square,
  AlertCircle,
  Radio,
  Edit2,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Message, Attachment, LemAIModel, ActiveTool, SystemModuleType } from '../types';
import { ModelSelector } from './ModelSelector';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ModernTypingIndicator } from './ModernTypingIndicator';
import { LEMAI_MODELS } from '../api/api';
import { soundEffects } from '../lib/notifications';
import { ScrollControls } from './ScrollControls';

interface ChatWorkspaceProps {
  messages: Message[];
  onSendMessage: (text: string, attachments?: Attachment[]) => Promise<void>;
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
  isLoading: boolean;
  onStopGeneration?: () => void;
  onClearHistory?: () => void;
  onSelectTool?: (tool: ActiveTool) => void;
  onEditUserMessage?: (messageId: string, newContent: string) => Promise<void>;
  onDeleteMessage?: (messageId: string) => void;
  onRegenerateResponse?: (messageId: string) => Promise<void>;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({
  messages,
  onSendMessage,
  currentModelId,
  onSelectModel,
  isLoading,
  onStopGeneration,
  onClearHistory,
  onSelectTool,
  onEditUserMessage,
  onDeleteMessage,
  onRegenerateResponse,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [speechLang, setSpeechLang] = useState<'id-ID' | 'en-US'>('id-ID');
  const [recognition, setRecognition] = useState<any>(null);
  
  // Message Edit & Copy State
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  
  // Module System State
  const [moduleTrayOpen, setModuleTrayOpen] = useState(false);
  const [activeModule, setActiveModule] = useState<SystemModuleType | null>(null);
  const [moduleToast, setModuleToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moduleTrayRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Click outside listener for module tray
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moduleTrayRef.current && !moduleTrayRef.current.contains(event.target as Node)) {
        setModuleTrayOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voice speech-to-text initialization with 100% functionality
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = speechLang;

        rec.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript.trim();
              if (text) {
                setInputText((prev) => (prev ? `${prev} ${text}` : text));
              }
            } else {
              currentTranscript += event.results[i][0].transcript;
            }
          }
        };

        rec.onerror = (err: any) => {
          console.warn('Speech recognition error:', err);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, [speechLang]);

  const toggleRecording = () => {
    soundEffects.playClickPop();
    if (!recognition) {
      alert('Speech Recognition tidak didukung di browser ini. Gunakan Chrome, Edge, atau browser modern lainnya.');
      return;
    }

    if (isRecording) {
      try {
        recognition.stop();
      } catch (e) {}
      setIsRecording(false);
    } else {
      try {
        recognition.lang = speechLang;
        recognition.start();
        setIsRecording(true);
      } catch (e) {
        console.error('Failed to start speech recognition:', e);
        setIsRecording(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    soundEffects.playClickPop();
    Array.from(files).forEach((file) => {
      const reader = new FileReader();

      reader.onload = () => {
        const result = reader.result as string;
        const isImage = file.type.startsWith('image/');
        const newAttachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type: isImage ? 'image' : 'file',
          mimeType: file.type || 'text/plain',
          size: file.size,
          base64: result,
        };
        setAttachments((prev) => [...prev, newAttachment]);
      };

      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    soundEffects.playClickPop();
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  // Select Module System Handler
  const handleSelectModule = (module: SystemModuleType) => {
    soundEffects.playClickPop();
    setActiveModule(module);
    setModuleTrayOpen(false);

    let moduleName = 'Image';
    if (module === 'image') moduleName = 'Image Studio';
    if (module === 'video') moduleName = 'Video Generator';
    if (module === 'research') moduleName = 'Rezearch Mode';
    if (module === 'canvas') moduleName = 'Canvas & Coding';

    setModuleToast(`Sistem Module "${moduleName}" Diaktifkan!`);
    setTimeout(() => setModuleToast(null), 3000);

    // If user clicked canvas/coding, also give the option to launch dedicated workspace
    if (onSelectTool) {
      if (module === 'image') onSelectTool('image');
      else if (module === 'video') onSelectTool('video');
      else if (module === 'research') onSelectTool('research');
      else if (module === 'canvas') onSelectTool('canvas');
    }
  };

  const clearActiveModule = () => {
    soundEffects.playClickPop();
    setActiveModule(null);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachments.length === 0) || isLoading) return;

    if (isRecording && recognition) {
      try {
        recognition.stop();
      } catch (e) {}
      setIsRecording(false);
    }

    soundEffects.playClickPop();
    let text = inputText.trim();

    // Attach active module prefix if selected
    if (activeModule === 'image' && !text.toLowerCase().includes('/image')) {
      text = `[🎨 Module Image]: ${text}`;
    } else if (activeModule === 'video' && !text.toLowerCase().includes('/video')) {
      text = `[🎬 Module Video]: ${text}`;
    } else if (activeModule === 'research' && !text.toLowerCase().includes('/research')) {
      text = `[🔍 Module Rezearch]: ${text}`;
    } else if (activeModule === 'canvas' && !text.toLowerCase().includes('/canvas')) {
      text = `[⚡ Module Canvas]: ${text}`;
    }

    const currentAtts = [...attachments];
    setInputText('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    await onSendMessage(text, currentAtts);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCodeAction = (action: 'explain' | 'fix' | 'improve', code: string, language: string) => {
    const prompts = {
      explain: `Explain this ${language} code in technical detail:\n\`\`\`${language}\n${code}\n\`\`\``,
      fix: `Analyze and fix any bugs, race conditions, or syntax issues in this ${language} code:\n\`\`\`${language}\n${code}\n\`\`\``,
      improve: `Optimize and refactor this ${language} code for maximum performance and modern best practices:\n\`\`\`${language}\n${code}\n\`\`\``,
    };
    onSendMessage(prompts[action]);
  };

  const suggestedPrompts = [
    {
      title: 'Build a Modern Calculator',
      prompt: 'Create a responsive web app with HTML, CSS (Tailwind), and JavaScript for an elegant scientific calculator with live preview.',
      category: 'Web Dev',
    },
    {
      title: 'Rust Concurrency Engine',
      prompt: 'Write an asynchronous worker pool in Rust using Tokio channels and explain memory safety guarantees.',
      category: 'Rust',
    },
    {
      title: 'Python Data Pipeline',
      prompt: 'Build a Python script using pandas and SQLite to parse CSV data, clean missing values, and calculate statistical summaries.',
      category: 'Python',
    },
    {
      title: 'React Interactive Dashboard',
      prompt: 'Build a single-file React TSX component featuring a dark monochrome dashboard with metric counters and real-time state.',
      category: 'React TSX',
    },
  ];

  return (
    <div className="h-full flex flex-col bg-[#080808] text-neutral-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif] relative">
      
      {/* Module Toast Notification */}
      {moduleToast && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-xs font-mono shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold">{moduleToast}</span>
        </div>
      )}

      {/* Top App Bar */}
      <div className="h-14 border-b border-neutral-800/80 bg-[#0c0c0c] px-4 sm:px-6 flex items-center justify-between flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <ModelSelector
            currentModelId={currentModelId}
            onSelectModel={onSelectModel}
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Controls in Top Bar */}
          <ScrollControls containerRef={chatScrollRef} variant="inline" />

          {onSelectTool && (
            <button
              type="button"
              onClick={() => onSelectTool('openr')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-800/60 text-xs font-mono text-indigo-300 hover:text-white transition"
              title="Buka OpenRouter Gateway Dashboard"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>/openr</span>
            </button>
          )}

          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-400 hover:text-white transition"
              title="Bersihkan percakapan"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bersihkan</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages Stream Container */}
      <div ref={chatScrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6 relative scroll-smooth">
        {messages.length > 2 && (
          <ScrollControls containerRef={chatScrollRef} variant="floating" className="!bottom-28 !right-6" />
        )}
        {messages.length === 0 ? (
          /* Empty State / Welcome Screen */
          <div className="max-w-2xl mx-auto mt-8 sm:mt-16 text-center space-y-6 animate-in fade-in duration-300">
            <div className="inline-flex p-4 rounded-3xl bg-[#121212] border border-neutral-800 shadow-2xl">
              <img src="/logo.svg" alt="LemAI" className="w-12 h-12 object-contain" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                LemAI Workspace
              </h2>
              <p className="text-sm text-neutral-400 font-mono max-w-md mx-auto">
                First-class AI coding, sandboxed web execution, multi-model intelligence & deep research.
              </p>
            </div>

            {/* Quick Starter Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-left">
              {suggestedPrompts.map((card, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendMessage(card.prompt)}
                  className="p-4 rounded-2xl bg-[#111111] hover:bg-neutral-800/80 border border-neutral-800 hover:border-neutral-700 transition duration-150 text-left group shadow-lg"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white group-hover:text-white transition-colors">
                      {card.title}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
                      {card.category}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {card.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Active Chat Messages */
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => {
              const isUser = message.role === 'user';
              const isLastMessage = index === messages.length - 1;
              const isStreamingMessage = isLastMessage && !isUser && isLoading;

              return (
                <div
                  key={message.id}
                  className={`flex gap-4 ${isUser ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                >
                  {/* Assistant Avatar */}
                  {!isUser && (
                    <div className="w-8 h-8 rounded-xl bg-[#141414] border border-neutral-800 p-1 flex-shrink-0 flex items-center justify-center shadow-md mt-1">
                      <img src="/logo.svg" alt="LemAI" className="w-full h-full object-contain" />
                    </div>
                  )}

                  {/* Message Bubble Container */}
                  <div
                    className={`max-w-[90%] sm:max-w-[80%] rounded-2xl ${
                      isUser
                        ? 'bg-neutral-800/90 text-white px-4 py-3 border border-neutral-700 shadow-sm'
                        : 'bg-[#111111] border border-neutral-800/90 px-5 py-4 text-neutral-200 shadow-xl'
                    }`}
                  >
                    {/* Header info for assistant */}
                    {!isUser && (
                      <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-3 border-b border-neutral-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {LEMAI_MODELS[currentModelId]?.name || 'LemAI 1.0 Flash'}
                          </span>
                          <span className="text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded">
                            Limone Teams
                          </span>
                        </div>
                        {isStreamingMessage && (
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                              <span>Streaming...</span>
                            </span>
                            {onStopGeneration && (
                              <button
                                type="button"
                                onClick={onStopGeneration}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-[11px] text-red-400 font-mono transition"
                                title="Hentikan pembuatan pesan"
                              >
                                <Square className="w-2.5 h-2.5 fill-current" />
                                <span>Hentikan</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attachments Preview inside Message */}
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {message.attachments.map((att) => (
                          <div
                            key={att.id}
                            className="flex items-center gap-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs text-neutral-300 font-mono"
                          >
                            {att.type === 'image' && att.base64 ? (
                              <img src={att.base64} alt={att.name} className="w-10 h-10 object-cover rounded-lg" />
                            ) : (
                              <FileText className="w-4 h-4 text-neutral-400" />
                            )}
                            <span className="truncate max-w-[150px]">{att.name}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Message Body Content */}
                    {isUser ? (
                      <div>
                        {editingMessageId === message.id ? (
                          <div className="space-y-2 py-1">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              rows={3}
                              className="w-full bg-[#181818] border border-neutral-600 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-white resize-none"
                              autoFocus
                            />
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingMessageId(null)}
                                className="px-3 py-1 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-xs text-neutral-300 transition"
                              >
                                Batal
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (editingText.trim() && onEditUserMessage) {
                                    const textToSubmit = editingText.trim();
                                    setEditingMessageId(null);
                                    await onEditUserMessage(message.id, textToSubmit);
                                  }
                                }}
                                disabled={!editingText.trim() || isLoading}
                                className="px-3 py-1 rounded-lg bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition disabled:opacity-50 flex items-center gap-1.5"
                              >
                                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                                <span>Simpan & Ulangi Jawaban</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed font-sans select-text">
                              {message.content}
                            </p>
                            
                            {/* User Message Action Toolbar */}
                            <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-neutral-700/60 text-[11px] font-mono text-neutral-400">
                              <button
                                type="button"
                                onClick={async () => {
                                  await navigator.clipboard.writeText(message.content);
                                  setCopiedMessageId(message.id);
                                  setTimeout(() => setCopiedMessageId(null), 2000);
                                }}
                                className="flex items-center gap-1 hover:text-white transition px-1.5 py-0.5 rounded hover:bg-neutral-700/60"
                                title="Salin pesan ini"
                              >
                                {copiedMessageId === message.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-emerald-400" />
                                    <span className="text-emerald-400">Tersalin</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    <span>Salin</span>
                                  </>
                                )}
                              </button>

                              {onEditUserMessage && !isLoading && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMessageId(message.id);
                                    setEditingText(message.content);
                                  }}
                                  className="flex items-center gap-1 hover:text-white transition px-1.5 py-0.5 rounded hover:bg-neutral-700/60"
                                  title="Edit pesan & ulangi respon AI"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                              )}

                              {onDeleteMessage && !isLoading && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (confirm('Hapus pesan ini dari riwayat?')) {
                                      onDeleteMessage(message.id);
                                    }
                                  }}
                                  className="flex items-center gap-1 hover:text-red-400 transition px-1.5 py-0.5 rounded hover:bg-neutral-700/60"
                                  title="Hapus pesan"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div>
                        {isStreamingMessage && !message.content ? (
                          <ModernTypingIndicator
                            modelName={LEMAI_MODELS[currentModelId]?.name || 'LemAI 1.0 Flash'}
                            statusText="sedang menganalisis konteks & merespon..."
                          />
                        ) : (
                          <>
                            <MarkdownRenderer
                              content={message.content}
                              onCodeAction={handleCodeAction}
                            />
                            {isStreamingMessage && (
                              <span className="inline-block w-2 h-4 ml-1 bg-white animate-pulse align-middle" />
                            )}

                            {/* Assistant Message Actions Toolbar */}
                            {!isStreamingMessage && message.content && (
                              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-neutral-800/80 text-[11px] font-mono text-neutral-400">
                                <div className="text-[10px] text-neutral-500">
                                  LemAI Black Intelligence
                                </div>
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      await navigator.clipboard.writeText(message.content);
                                      setCopiedMessageId(message.id);
                                      setTimeout(() => setCopiedMessageId(null), 2000);
                                    }}
                                    className="flex items-center gap-1 hover:text-white transition px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
                                    title="Salin jawaban lengkap"
                                  >
                                    {copiedMessageId === message.id ? (
                                      <>
                                        <Check className="w-3 h-3 text-emerald-400" />
                                        <span className="text-emerald-400">Tersalin</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3 h-3" />
                                        <span>Salin Respon</span>
                                      </>
                                    )}
                                  </button>

                                  {onRegenerateResponse && !isLoading && (
                                    <button
                                      type="button"
                                      onClick={() => onRegenerateResponse(message.id)}
                                      className="flex items-center gap-1 hover:text-white transition px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 hover:bg-neutral-800"
                                      title="Ulangi pembuatan jawaban ini"
                                    >
                                      <RefreshCw className="w-3 h-3" />
                                      <span>Ulangi Jawaban</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Citations / Sources */}
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-neutral-800/80">
                        <div className="text-[11px] font-mono font-semibold text-neutral-400 mb-1.5 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Sources Grounding:</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {message.sources.map((src, i) => (
                            <a
                              key={i}
                              href={src.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1 transition font-mono truncate max-w-[200px]"
                            >
                              <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Standalone Typing Indicator fallback */}
            {isLoading && !messages.some((m) => m.role === 'assistant') && (
              <ModernTypingIndicator
                modelName={LEMAI_MODELS[currentModelId]?.name || 'LemAI 1.0 Flash'}
                statusText="sedang memproses penalaran AI..."
              />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Console */}
      <div className="p-3 sm:p-5 bg-[#0a0a0a] border-t border-neutral-900 flex-shrink-0">
        <div className="max-w-4xl mx-auto space-y-2">
          
          {/* Active Module Tag Indicator */}
          {activeModule && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 text-xs font-mono text-neutral-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-neutral-400">Active Module:</span>
                <span className="font-semibold text-white uppercase tracking-wider">
                  {activeModule === 'image' && '🎨 Image Studio'}
                  {activeModule === 'video' && '🎬 Video Generator'}
                  {activeModule === 'research' && '🔍 Rezearch Intelligence'}
                  {activeModule === 'canvas' && '⚡ Canvas & Coding'}
                </span>
              </div>
              <button
                type="button"
                onClick={clearActiveModule}
                className="text-neutral-500 hover:text-white text-[11px] flex items-center gap-1 font-mono transition"
              >
                <span>Reset Mode</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Active Attachments Preview */}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 p-2 bg-[#121212] border border-neutral-800 rounded-xl">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs text-neutral-300"
                >
                  <span className="truncate max-w-[180px] font-mono text-[11px]">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.id)}
                    className="text-neutral-500 hover:text-red-400"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Real-time Voice Recording Status Indicator */}
          {isRecording && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-between font-mono animate-in fade-in duration-200">
              <div className="flex items-center gap-2.5">
                <Radio className="w-4 h-4 text-red-400 animate-pulse" />
                <span>Mendengarkan suara ({speechLang === 'id-ID' ? 'Bahasa Indonesia' : 'English'})... Silakan bicara.</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSpeechLang(speechLang === 'id-ID' ? 'en-US' : 'id-ID')}
                  className="px-2 py-0.5 rounded bg-red-900/50 hover:bg-red-800 text-[10px] text-white border border-red-700 transition"
                >
                  Ganti: {speechLang === 'id-ID' ? 'EN' : 'ID'}
                </button>
                <button
                  type="button"
                  onClick={toggleRecording}
                  className="px-2 py-0.5 rounded bg-white text-black font-semibold text-[10px] transition"
                >
                  Selesai
                </button>
              </div>
            </div>
          )}

          {/* Main Input Form */}
          <form
            onSubmit={handleSend}
            className="relative rounded-2xl bg-[#121212] border border-neutral-800 focus-within:border-neutral-600 transition-all shadow-2xl p-2"
          >
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Ketik instruksi, tanya kode, riset, atau gunakan tombol Module di bawah..."
              className="w-full bg-transparent text-sm text-neutral-100 placeholder-neutral-500 px-3 py-1.5 resize-none focus:outline-none leading-relaxed"
            />

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              className="hidden"
            />

            {/* Input Actions Footer */}
            <div className="flex items-center justify-between pt-2 px-2 border-t border-neutral-800/60">
              
              {/* Left Action Area: Upload Button + Module Tray Button beside it */}
              <div className="flex items-center gap-1.5 relative">
                
                {/* 1. Upload File / Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Unggah gambar atau berkas kode"
                  className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition active:scale-95"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* 2. MODULE TRAY TRIGGER (Disamping Kanan Tombol Upload) */}
                <div className="relative" ref={moduleTrayRef}>
                  <button
                    type="button"
                    onClick={() => {
                      soundEffects.playClickPop();
                      setModuleTrayOpen(!moduleTrayOpen);
                    }}
                    title="Buka Tray Module Sistem (Image, Video, Rezearch, Canvas)"
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition duration-150 active:scale-95 ${
                      moduleTrayOpen || activeModule
                        ? 'bg-neutral-800 text-white border-neutral-600 shadow-md'
                        : 'bg-neutral-900/80 text-neutral-300 hover:text-white hover:bg-neutral-800 border-neutral-800'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-neutral-300" />
                    <span className="font-semibold">Module</span>
                    <ChevronDown className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${moduleTrayOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* FLOATING MODULE TRAY POPOVER */}
                  {moduleTrayOpen && (
                    <div className="absolute bottom-full left-0 mb-3 w-64 sm:w-72 rounded-2xl bg-[#111111] border border-neutral-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 backdrop-blur-xl">
                      <div className="px-3 py-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500 border-b border-neutral-800/80 mb-1 flex items-center justify-between">
                        <span>Pilih Module Sistem</span>
                        <span className="text-[10px] text-neutral-600">LemAI OS</span>
                      </div>

                      <div className="space-y-1">
                        {/* Module 1: Image */}
                        <button
                          type="button"
                          onClick={() => handleSelectModule('image')}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent hover:border-neutral-800 transition flex items-center gap-3 group"
                        >
                          <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 text-white">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-white">Image</span>
                              <span className="text-[9px] bg-neutral-800 px-1 py-0.2 rounded font-mono text-neutral-400">Visual</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-snug">
                              Generator & Visual Intelligence
                            </p>
                          </div>
                        </button>

                        {/* Module 2: Video */}
                        <button
                          type="button"
                          onClick={() => handleSelectModule('video')}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent hover:border-neutral-800 transition flex items-center gap-3 group"
                        >
                          <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 text-white">
                            <VideoIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-white">Video</span>
                              <span className="text-[9px] bg-neutral-800 px-1 py-0.2 rounded font-mono text-neutral-400">Motion</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-snug">
                              Video Concept & Sandbox Engine
                            </p>
                          </div>
                        </button>

                        {/* Module 3: Rezearch */}
                        <button
                          type="button"
                          onClick={() => handleSelectModule('research')}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent hover:border-neutral-800 transition flex items-center gap-3 group"
                        >
                          <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 text-white">
                            <Search className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-white">Rezearch</span>
                              <span className="text-[9px] bg-neutral-800 px-1 py-0.2 rounded font-mono text-neutral-400">Grounding</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-snug">
                              Deep Web Intelligence & Research
                            </p>
                          </div>
                        </button>

                        {/* Module 4: Canvas */}
                        <button
                          type="button"
                          onClick={() => handleSelectModule('canvas')}
                          className="w-full text-left p-2.5 rounded-xl hover:bg-neutral-900 text-neutral-300 hover:text-white border border-transparent hover:border-neutral-800 transition flex items-center gap-3 group"
                        >
                          <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800 group-hover:bg-neutral-800 text-white">
                            <Code2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-xs text-white">Canvas</span>
                              <span className="text-[9px] bg-neutral-800 px-1 py-0.2 rounded font-mono text-neutral-400">Coding</span>
                            </div>
                            <p className="text-[11px] text-neutral-400 leading-snug">
                              Interactive Sandbox & Execution
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action Area: VOICE BUTTON (Disamping Kiri Tombol Kirim Pesan) + SEND BUTTON */}
              <div className="flex items-center gap-2">
                
                {/* 3. VOICE INPUT BUTTON (Disamping Kiri Tombol Kirim Pesan) */}
                <button
                  type="button"
                  onClick={toggleRecording}
                  title={isRecording ? "Hentikan perekaman suara" : "Mulai input suara (Speech-to-Text)"}
                  className={`p-2.5 rounded-xl transition duration-200 flex items-center justify-center active:scale-95 ${
                    isRecording
                      ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800'
                  }`}
                >
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                {/* 4. SEND / STOP BUTTON */}
                {isLoading && onStopGeneration ? (
                  <button
                    type="button"
                    onClick={onStopGeneration}
                    className="px-3 py-2 rounded-xl bg-red-950/40 text-red-400 hover:bg-red-900/60 border border-red-800/50 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                  >
                    <StopCircle className="w-4 h-4" />
                    <span>Stop</span>
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={(!inputText.trim() && attachments.length === 0) || isLoading}
                    className="p-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed shadow-md active:scale-95"
                    title="Kirim pesan"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </form>

          {/* Model indicator footer */}
          <div className="text-center text-[11px] font-mono text-neutral-500">
            LemAI Black Intelligence • Limone Teams • Sandboxed execution active
          </div>
        </div>
      </div>
    </div>
  );
};
