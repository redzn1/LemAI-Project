import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  FileCode, 
  Folder,
  FolderOpen,
  FolderPlus,
  Play, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Wrench, 
  Zap, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Tablet, 
  Eye, 
  Terminal, 
  Code as Code2, 
  ArrowRightLeft,
  Send,
  Loader2,
  FilePlus,
  Maximize2,
  Edit2,
  ChevronRight,
  ChevronDown,
  Layers,
  Cpu,
  Save,
  Users,
  Radio,
  Share2,
  MessageSquare,
  Compass,
  UserCheck,
  Globe
} from 'lucide-react';
import { CodingFile, UserProfile } from '../types';
import { resolveLanguage, triggerCodeDownload, isWebPreviewable } from '../utils/codeParser';
import { generateCode, LEMAI_MODELS } from '../api/api';
import { ScrollControls } from './ScrollControls';
import { 
  CollabSessionManager, 
  Collaborator, 
  CollabChatMessage, 
  generateCollabRoomCode,
  getRandomCollabColor 
} from '../lib/collaboration';

interface FolderNode {
  id: string;
  name: string;
}

interface CodingWorkspaceProps {
  currentUser?: UserProfile | null;
}

const DEFAULT_PROJECT_FILES: CodingFile[] = [
  {
    id: 'html-1',
    name: 'index.html',
    language: 'html',
    isEntry: true,
    type: 'file',
    folderId: null,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LemAI Interactive App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="style.css">
</head>
<body class="bg-[#0c0c0c] text-white flex items-center justify-center min-h-screen p-4">
  <div class="max-w-md w-full p-6 bg-[#141414] border border-neutral-800 rounded-2xl shadow-2xl text-center">
    <div class="inline-flex p-3 rounded-2xl bg-neutral-900 border border-neutral-800 mb-4">
      <span class="text-2xl">⚡</span>
    </div>
    <h1 class="text-2xl font-bold tracking-tight text-white mb-2">LemAI Code Engine</h1>
    <p class="text-sm text-neutral-400 mb-6 font-mono">Real-time live collaborative web execution by Limone Teams</p>
    
    <div class="space-y-4">
      <div id="counter" class="text-4xl font-mono font-bold text-white">0</div>
      <div class="flex justify-center gap-3">
        <button id="dec-btn" class="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-xl text-sm font-semibold transition">-1</button>
        <button id="inc-btn" class="px-4 py-2 bg-white text-black hover:bg-neutral-200 rounded-xl text-sm font-semibold transition">+1</button>
      </div>
    </div>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
  },
  {
    id: 'css-1',
    name: 'style.css',
    language: 'css',
    type: 'file',
    folderId: null,
    content: `/* Custom LemAI Project Styles */
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

button {
  cursor: pointer;
  user-select: none;
}`,
  },
  {
    id: 'js-1',
    name: 'script.js',
    language: 'javascript',
    type: 'file',
    folderId: null,
    content: `// Counter interactive logic
let count = 0;
const counterEl = document.getElementById('counter');
const incBtn = document.getElementById('inc-btn');
const decBtn = document.getElementById('dec-btn');

if (incBtn && decBtn && counterEl) {
  incBtn.addEventListener('click', () => {
    count++;
    counterEl.textContent = count;
  });

  decBtn.addEventListener('click', () => {
    count--;
    counterEl.textContent = count;
  });
}

console.log('LemAI Web Environment Initialized successfully.');`,
  },
];

const DEFAULT_FOLDERS: FolderNode[] = [
  { id: 'src-folder', name: 'src' },
];

export const CodingWorkspace: React.FC<CodingWorkspaceProps> = ({ currentUser }) => {
  const [files, setFiles] = useState<CodingFile[]>(DEFAULT_PROJECT_FILES);
  const [folders, setFolders] = useState<FolderNode[]>(DEFAULT_FOLDERS);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'src-folder': true,
  });

  const [activeFileId, setActiveFileId] = useState<string>('html-1');
  const [mobileTab, setMobileTab] = useState<'editor' | 'preview' | 'ai'>('editor');
  const [copied, setCopied] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);
  
  // Model selection in Coding Workspace (Default: 1.0 Flash GET)
  const [selectedCodingModel, setSelectedCodingModel] = useState<string>('lemai-1.0-flash');

  // AI assistant prompt in Coding mode
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [autoApplyGeneratedCode, setAutoApplyGeneratedCode] = useState(true);
  const [applyNotice, setApplyNotice] = useState<string | null>(null);

  // ==========================================
  // REAL-TIME COLLABORATION STATE
  // ==========================================
  const [isCollabActive, setIsCollabActive] = useState<boolean>(true);
  const [collabRoomId, setCollabRoomId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlRoom = urlParams.get('collab') || urlParams.get('room');
      if (urlRoom) return urlRoom.toUpperCase();
    }
    return 'LEM-MAIN';
  });
  const [collaborators, setCollaborators] = useState<Record<string, Collaborator>>({});
  const [collabMessages, setCollabMessages] = useState<CollabChatMessage[]>([]);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);
  const [isChatDrawerOpen, setIsChatDrawerOpen] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [copiedRoomCode, setCopiedRoomCode] = useState(false);
  const [copiedRoomLink, setCopiedRoomLink] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<{ line: number; ch: number }>({ line: 1, ch: 1 });

  const collabSessionRef = useRef<CollabSessionManager | null>(null);
  const fileTreeRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const aiOutputRef = useRef<HTMLPreElement>(null);

  // Effective user for collab identity
  const effectiveUser: UserProfile = useMemo(() => {
    if (currentUser) return currentUser;
    let tempId = 'guest-dev';
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('lemai_guest_dev_uid');
      if (saved) {
        tempId = saved;
      } else {
        tempId = 'guest-' + Math.random().toString(36).substring(2, 8);
        sessionStorage.setItem('lemai_guest_dev_uid', tempId);
      }
    }
    return {
      uid: tempId,
      username: 'guest_coder',
      displayName: 'Guest Coder',
      email: 'guest@limone.my.id',
      provider: 'password',
    };
  }, [currentUser]);

  // Rename modal / inline state
  const [renamingItem, setRenamingItem] = useState<{ id: string; type: 'file' | 'folder'; currentName: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const activeFile = useMemo(() => {
    return files.find(f => f.id === activeFileId) || files[0];
  }, [files, activeFileId]);

  // Initialize Real-time Collab Manager
  useEffect(() => {
    if (!isCollabActive) {
      if (collabSessionRef.current) {
        collabSessionRef.current.destroy();
        collabSessionRef.current = null;
      }
      return;
    }

    const session = new CollabSessionManager(
      collabRoomId,
      effectiveUser,
      files,
      (updatedRoom) => {
        // Remote file sync
        if (updatedRoom.files && updatedRoom.files.length > 0) {
          setFiles((prevFiles) => {
            const isDiff = JSON.stringify(prevFiles) !== JSON.stringify(updatedRoom.files);
            if (isDiff) {
              return updatedRoom.files;
            }
            return prevFiles;
          });
        }
        setCollaborators(updatedRoom.collaborators || {});
        if (updatedRoom.messages) {
          setCollabMessages(updatedRoom.messages);
        }
      }
    );

    collabSessionRef.current = session;

    return () => {
      session.destroy();
    };
  }, [isCollabActive, collabRoomId, effectiveUser.uid]);

  // Broadcast presence when active file changes
  useEffect(() => {
    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.sendPresence(activeFileId, { line: cursorPosition.line, ch: cursorPosition.ch, index: 0 });
    }
  }, [activeFileId, isCollabActive]);

  // Active collaborators who are NOT the current user
  const remoteCollaborators = useMemo(() => {
    return Object.values(collaborators).filter(c => c.id !== effectiveUser.uid);
  }, [collaborators, effectiveUser.uid]);

  // Collaborators currently viewing/editing the ACTIVE file
  const activeFileCollaborators = useMemo(() => {
    return remoteCollaborators.filter(c => c.activeFileId === activeFileId);
  }, [remoteCollaborators, activeFileId]);

  // Map of fileId -> array of collaborators on that file
  const fileCollaboratorMap = useMemo(() => {
    const map: Record<string, Collaborator[]> = {};
    remoteCollaborators.forEach(c => {
      if (!map[c.activeFileId]) map[c.activeFileId] = [];
      map[c.activeFileId].push(c);
    });
    return map;
  }, [remoteCollaborators]);

  // Combined web bundle for Sandboxed Preview (HTML + injected CSS and JS)
  const bundledSrcDoc = useMemo(() => {
    const htmlFile = files.find(f => f.name.endsWith('.html')) || activeFile;
    const cssFiles = files.filter(f => f.name.endsWith('.css'));
    const jsFiles = files.filter(f => f.name.endsWith('.js'));

    let html = htmlFile?.content || '<div>No HTML content</div>';

    // Inject all CSS
    if (cssFiles.length > 0) {
      const combinedCss = cssFiles.map(f => f.content).join('\n');
      if (html.includes('</head>')) {
        html = html.replace('</head>', `<style>${combinedCss}</style></head>`);
      } else {
        html = `<style>${combinedCss}</style>` + html;
      }
    }

    // Inject all JS
    if (jsFiles.length > 0) {
      const combinedJs = jsFiles.map(f => f.content).join('\n');
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<script>${combinedJs}</script></body>`);
      } else {
        html = html + `<script>${combinedJs}</script>`;
      }
    }

    return html;
  }, [files, activeFile]);

  // Helper to extract clean raw code from AI markdown fences
  const extractCodeFromText = (rawText: string): string => {
    const codeBlockRegex = /```(?:[a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;
    const matches = [...rawText.matchAll(codeBlockRegex)];
    if (matches.length > 0) {
      if (matches.length === 1) {
        return matches[0][1].trim();
      }
      return matches.map(m => m[1].trim()).join('\n\n');
    }
    return rawText.trim();
  };

  const applyCodeToActiveFile = (contentToApply: string) => {
    const cleanCode = extractCodeFromText(contentToApply);
    const updatedFiles = files.map(f => f.id === activeFileId ? { ...f, content: cleanCode } : f);
    setFiles(updatedFiles);
    
    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.updateFileContent(activeFileId, cleanCode);
    }

    setPreviewKey(k => k + 1);
    setApplyNotice(`Kode AI langsung diterapkan ke ${activeFile.name}!`);
    setTimeout(() => setApplyNotice(null), 3500);
  };

  const handleCreateNewFileFromAi = (contentToSave: string) => {
    const cleanCode = extractCodeFromText(contentToSave);
    const newFileId = `file-${Date.now()}`;
    const newFileName = `generated_${files.length + 1}.js`;
    const newFile: CodingFile = {
      id: newFileId,
      name: newFileName,
      language: 'javascript',
      type: 'file',
      folderId: null,
      content: cleanCode,
    };
    const updatedFiles = [...files, newFile];
    setFiles(updatedFiles);
    setActiveFileId(newFileId);

    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.syncAllFiles(updatedFiles);
    }

    setApplyNotice(`File baru "${newFileName}" berhasil dibuat dan diterapkan!`);
    setTimeout(() => setApplyNotice(null), 3500);
  };

  const handleUpdateContent = (newContent: string) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
    
    // Broadcast real-time change to Firebase and peers
    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.updateFileContent(activeFileId, newContent);
    }
  };

  // Cursor tracking for collaborative presence
  const handleEditorCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const pos = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, pos);
    const lines = textBefore.split('\n');
    const lineNum = lines.length;
    const colNum = lines[lines.length - 1].length + 1;

    setCursorPosition({ line: lineNum, ch: colNum });

    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.updateCursor(
        activeFileId, 
        { line: lineNum, ch: colNum, index: pos },
        true
      );
    }
  };

  // Add File (to Root or specific folder)
  const handleAddFile = (folderId: string | null = null) => {
    const fileName = prompt('Masukkan nama file baru (contoh: App.tsx, helpers.js, styles.css):');
    if (!fileName || !fileName.trim()) return;

    const trimmed = fileName.trim();
    const langInfo = resolveLanguage(trimmed.split('.').pop() || '');
    const langId = langInfo.id;

    const newFile: CodingFile = {
      id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      language: langId,
      isEntry: false,
      type: 'file',
      folderId,
      content: langId === 'html' 
        ? `<!-- ${trimmed} -->\n<div class="p-4 bg-neutral-900 text-white rounded-xl">\n  <h1 class="text-xl font-bold">New Page</h1>\n</div>`
        : `// ${trimmed}\n// LemAI Collaborative Workspace\n\nexport const init = () => {\n  console.log('${trimmed} ready');\n};\n`,
    };

    const updated = [...files, newFile];
    setFiles(updated);
    setActiveFileId(newFile.id);

    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.syncAllFiles(updated);
    }
  };

  // Add Folder
  const handleAddFolder = () => {
    const folderName = prompt('Masukkan nama folder baru (contoh: components, assets, utils):');
    if (!folderName || !folderName.trim()) return;

    const newFolderId = `folder-${Date.now()}`;
    setFolders(prev => [...prev, { id: newFolderId, name: folderName.trim() }]);
    setExpandedFolders(prev => ({ ...prev, [newFolderId]: true }));
  };

  // Delete File
  const handleDeleteFile = (fileId: string) => {
    if (files.length <= 1) {
      alert('Minimal harus ada 1 file dalam project.');
      return;
    }
    const fileToDelete = files.find(f => f.id === fileId);
    if (!window.confirm(`Hapus file "${fileToDelete?.name}"?`)) return;

    const remainingFiles = files.filter(f => f.id !== fileId);
    setFiles(remainingFiles);
    if (activeFileId === fileId) {
      setActiveFileId(remainingFiles[0].id);
    }

    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.syncAllFiles(remainingFiles);
    }
  };

  // Delete Folder
  const handleDeleteFolder = (folderId: string) => {
    const folderToDelete = folders.find(f => f.id === folderId);
    if (!window.confirm(`Hapus folder "${folderToDelete?.name}" beserta seluruh isinya?`)) return;

    setFolders(prev => prev.filter(f => f.id !== folderId));
    const remainingFiles = files.filter(f => f.folderId !== folderId);
    setFiles(remainingFiles);
    if (remainingFiles.length > 0 && !remainingFiles.some(f => f.id === activeFileId)) {
      setActiveFileId(remainingFiles[0].id);
    }

    if (isCollabActive && collabSessionRef.current) {
      collabSessionRef.current.syncAllFiles(remainingFiles);
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  // Rename handling
  const startRename = (id: string, type: 'file' | 'folder', currentName: string) => {
    setRenamingItem({ id, type, currentName });
    setRenameInput(currentName);
  };

  const handleSaveRename = () => {
    if (!renamingItem || !renameInput.trim()) return;
    const newName = renameInput.trim();

    if (renamingItem.type === 'file') {
      const lang = resolveLanguage(newName.split('.').pop());
      const updated = files.map(f => f.id === renamingItem.id ? { ...f, name: newName, language: lang } : f);
      setFiles(updated);
      if (isCollabActive && collabSessionRef.current) {
        collabSessionRef.current.syncAllFiles(updated);
      }
    } else {
      setFolders(prev => prev.map(fo => fo.id === renamingItem.id ? { ...fo, name: newName } : fo));
    }
    setRenamingItem(null);
  };

  // Execute AI action on code
  const handleRunAiAction = async (actionType: 'optimize' | 'fix' | 'scaffold') => {
    setIsAiLoading(true);
    setAiOutput(null);

    let promptText = '';
    if (actionType === 'optimize') {
      promptText = `Lakukan optimasi dan refactor pada kode ${activeFile.name} berikut agar lebih clean, modern, performant, dan bebas bug:\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``;
    } else if (actionType === 'fix') {
      promptText = `Analisis dan perbaiki segala potensi error, bug, atau syntax mistake pada kode ${activeFile.name} berikut:\n\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\``;
    } else {
      promptText = `Kebutuhan pengguna: "${aiPrompt}".\nFile aktif: ${activeFile.name} (${activeFile.language}).\nKonten saat ini:\n\`\`\`${activeFile.language}\n${activeFile.content}\n\`\`\`\n\nBuat kode lengkap yang diperbarui dan siap dijalankan.`;
    }

    try {
      const result = await generateCode(promptText, selectedCodingModel);
      setAiOutput(result);

      if (autoApplyGeneratedCode) {
        applyCodeToActiveFile(result);
      }
    } catch (err: any) {
      setAiOutput(`Terjadi kesalahan: ${err.message || 'Gagal memproses kode AI'}`);
    } finally {
      setIsAiLoading(false);
      setAiPrompt('');
    }
  };

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadActiveFile = () => {
    triggerCodeDownload(activeFile.name, activeFile.content);
  };

  // Jump to collaborator's active file & line
  const handleFollowCollaborator = (collab: Collaborator) => {
    if (collab.activeFileId) {
      setActiveFileId(collab.activeFileId);
      if (collab.cursor?.line && codeEditorRef.current) {
        const textarea = codeEditorRef.current;
        const lines = textarea.value.split('\n');
        let charIndex = 0;
        for (let i = 0; i < Math.min(lines.length, collab.cursor.line - 1); i++) {
          charIndex += lines[i].length + 1;
        }
        textarea.focus();
        textarea.setSelectionRange(charIndex, charIndex);
      }
    }
  };

  // Copy shareable room link
  const handleCopyRoomLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shareUrl = `${origin}/?collab=${collabRoomId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedRoomLink(true);
    setTimeout(() => setCopiedRoomLink(false), 2000);
  };

  const handleCopyRoomCode = () => {
    navigator.clipboard.writeText(collabRoomId);
    setCopiedRoomCode(true);
    setTimeout(() => setCopiedRoomCode(false), 2000);
  };

  const handleJoinNewRoom = () => {
    if (!joinRoomInput.trim()) return;
    const clean = joinRoomInput.trim().toUpperCase();
    setCollabRoomId(clean);
    setIsCollabModalOpen(false);
    setJoinRoomInput('');
  };

  const handleCreateNewRoomCode = () => {
    const newCode = generateCollabRoomCode();
    setCollabRoomId(newCode);
    setIsCollabModalOpen(false);
  };

  const handleSendCollabChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !collabSessionRef.current) return;
    collabSessionRef.current.sendChatMessage(chatInputText);
    setChatInputText('');
  };

  const isPreviewSupported = isWebPreviewable(activeFile.name);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080808] text-neutral-100 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      
      {/* Top Coding Workspace Header & Collaboration Bar */}
      <div className="h-14 border-b border-neutral-800 bg-[#0d0d0d] px-4 flex items-center justify-between flex-shrink-0">
        
        {/* Left: Brand / Title & Model Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-emerald-400 shadow-sm">
              <Code2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">LemAI IDE</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 font-bold">
                  v2.5 Live
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono hidden sm:block">
                Sandboxed Multi-file Runtime & Real-Time Collaboration
              </p>
            </div>
          </div>

          <div className="hidden lg:block h-5 w-px bg-neutral-800" />

          {/* Model Selector in Coding mode */}
          <div className="hidden lg:flex items-center gap-1.5 bg-[#141414] border border-neutral-800 rounded-xl px-2.5 py-1 text-xs">
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={selectedCodingModel}
              onChange={(e) => setSelectedCodingModel(e.target.value)}
              className="bg-transparent text-neutral-200 text-xs font-mono focus:outline-none cursor-pointer"
            >
              {LEMAI_MODELS.map((m) => (
                <option key={m.id} value={m.id} className="bg-neutral-900 text-white">
                  {m.name} ({m.badge})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center/Right: Real-Time Collaboration Hub Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Live Collaboration Pill & Collaborators Avatars */}
          <div className="flex items-center gap-2 bg-[#141414] border border-neutral-800/90 rounded-2xl p-1.5 shadow-inner">
            
            {/* Live Status Indicator */}
            <button
              onClick={() => setIsCollabModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-mono transition border border-neutral-800"
              title="Pengaturan Room Kolaborasi Real-Time"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span className="font-bold text-white tracking-wider">{collabRoomId}</span>
              <span className="hidden sm:inline text-[10px] text-emerald-400 font-semibold">
                ({remoteCollaborators.length + 1} online)
              </span>
            </button>

            {/* Collaborator Avatars Stack */}
            <div className="flex items-center -space-x-1.5 pl-1 pr-1">
              {/* Current User Avatar */}
              <div 
                className="relative w-6 h-6 rounded-full border-2 border-[#141414] bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white cursor-pointer shadow"
                title={`Anda (${effectiveUser.displayName || effectiveUser.username}) - Mengedit ${activeFile.name}`}
              >
                {effectiveUser.displayName?.charAt(0).toUpperCase() || 'U'}
                <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-black" />
              </div>

              {/* Remote Collaborators */}
              {remoteCollaborators.slice(0, 4).map((collab) => (
                <div
                  key={collab.id}
                  onClick={() => handleFollowCollaborator(collab)}
                  style={{ backgroundColor: collab.color }}
                  className="relative w-6 h-6 rounded-full border-2 border-[#141414] flex items-center justify-center text-[10px] font-bold text-white cursor-pointer hover:scale-110 transition shadow"
                  title={`Klik untuk ikuti ${collab.displayName} (di file ${collab.activeFileName || 'index.html'})`}
                >
                  {collab.displayName.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 right-0 w-1.5 h-1.5 rounded-full bg-emerald-400 ring-1 ring-black animate-pulse" />
                </div>
              ))}

              {remoteCollaborators.length > 4 && (
                <div className="w-6 h-6 rounded-full border-2 border-[#141414] bg-neutral-800 flex items-center justify-center text-[9px] font-mono text-neutral-300">
                  +{remoteCollaborators.length - 4}
                </div>
              )}
            </div>

            {/* Live Team Chat / Pairing Drawer Toggle */}
            <button
              onClick={() => setIsChatDrawerOpen(prev => !prev)}
              className={`p-1.5 rounded-xl text-xs transition relative ${
                isChatDrawerOpen ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
              title="Buka Chat / Diskusi Kode Tim Real-Time"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {collabMessages.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          </div>

          {/* Quick Share Button */}
          <button
            onClick={handleCopyRoomLink}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white border border-neutral-800 transition"
            title="Salin Link Undangan Kolaborasi"
          >
            {copiedRoomLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5 text-neutral-400" />}
            <span>{copiedRoomLink ? 'Link Tersalin' : 'Share Room'}</span>
          </button>

          {/* Top Quick Actions */}
          <div className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => handleRunAiAction('optimize')}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white border border-neutral-800 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Optimize</span>
            </button>
            <button
              onClick={handleDownloadActiveFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setMobileTab('editor')}
              className={`px-2.5 py-1 rounded-md font-medium ${mobileTab === 'editor' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-2.5 py-1 rounded-md font-medium ${mobileTab === 'preview' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              Preview
            </button>
          </div>

        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left: Files & Folders Explorer Sidebar */}
        <div className="w-56 sm:w-64 bg-[#0a0a0a] border-r border-neutral-800 flex flex-col flex-shrink-0">
          
          {/* Header Action Bar with Prominent Add Buttons */}
          <div className="p-3 border-b border-neutral-800 bg-[#0e0e0e] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-neutral-400">
                Explorer
              </span>
              <span className="text-[10px] font-mono text-neutral-500">
                {files.length} files
              </span>
            </div>

            {/* Prominent Action Buttons */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleAddFile(null)}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-emerald-400 border border-emerald-950/80 hover:border-emerald-800 transition shadow-sm"
                title="Tambah File Baru"
              >
                <FilePlus className="w-3.5 h-3.5" />
                <span>+ File</span>
              </button>

              <button
                onClick={handleAddFolder}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-xs font-semibold text-amber-400 border border-amber-950/80 hover:border-amber-800 transition shadow-sm"
                title="Tambah Folder Baru"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                <span>+ Folder</span>
              </button>
            </div>
          </div>

          {/* Explorer Tree List */}
          <div ref={fileTreeRef} className="flex-1 overflow-y-auto p-2 space-y-1 relative scroll-smooth">
            
            {/* 1. Folders List */}
            {folders.map((folder) => {
              const isExpanded = !!expandedFolders[folder.id];
              const folderFiles = files.filter(f => f.folderId === folder.id);

              return (
                <div key={folder.id} className="space-y-0.5">
                  <div className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono text-neutral-300 hover:bg-neutral-900/80 cursor-pointer transition border border-transparent hover:border-neutral-800">
                    <div 
                      className="flex items-center gap-1.5 truncate flex-1"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-amber-400" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-400/80" />
                      )}
                      <span className="font-semibold text-neutral-200 truncate">{folder.name}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">({folderFiles.length})</span>
                    </div>

                    {/* Folder Action Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFile(folder.id);
                        }}
                        title="Tambah file ke folder"
                        className="p-1 rounded bg-neutral-800/80 hover:bg-emerald-950 hover:text-emerald-300 text-neutral-400 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(folder.id, 'folder', folder.name);
                        }}
                        title="Rename folder"
                        className="p-1 rounded bg-neutral-800/80 hover:bg-amber-950 hover:text-amber-300 text-neutral-400 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        title="Hapus folder"
                        className="p-1 rounded bg-neutral-800/80 hover:bg-red-950 hover:text-red-300 text-neutral-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Files inside this folder */}
                  {isExpanded && (
                    <div className="pl-3 space-y-0.5 border-l-2 border-neutral-800 ml-3 my-0.5">
                      {folderFiles.length === 0 ? (
                        <div className="py-1 px-2 text-[10px] font-mono text-neutral-600 italic">
                          (folder kosong)
                        </div>
                      ) : (
                        folderFiles.map((file) => {
                          const isActive = file.id === activeFileId;
                          const fileCollabs = fileCollaboratorMap[file.id] || [];

                          return (
                            <div
                              key={file.id}
                              onClick={() => setActiveFileId(file.id)}
                              className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer font-mono transition relative ${
                                isActive
                                  ? 'bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-700'
                                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate flex-1">
                                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                                <span className="truncate">{file.name}</span>
                              </div>

                              {/* Remote Collaborator Presence Badge on File */}
                              {fileCollabs.length > 0 && (
                                <div className="flex items-center -space-x-1 mr-1">
                                  {fileCollabs.map(fc => (
                                    <span
                                      key={fc.id}
                                      style={{ backgroundColor: fc.color }}
                                      className="w-2 h-2 rounded-full ring-1 ring-black"
                                      title={`${fc.displayName} sedang membuka file ini`}
                                    />
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRename(file.id, 'file', file.name);
                                  }}
                                  title="Rename file"
                                  className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-amber-300 transition"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.id);
                                  }}
                                  title="Hapus file"
                                  className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. Root Files List */}
            <div className="pt-2 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                Root Files
              </div>
              {files.filter(f => !f.folderId).map((file) => {
                const isActive = file.id === activeFileId;
                const fileCollabs = fileCollaboratorMap[file.id] || [];

                return (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer font-mono transition relative ${
                      isActive
                        ? 'bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-700'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate flex-1">
                      <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                      <span className="truncate">{file.name}</span>
                    </div>

                    {/* Remote Collaborator Presence Badge */}
                    {fileCollabs.length > 0 && (
                      <div className="flex items-center -space-x-1 mr-1.5">
                        {fileCollabs.map(fc => (
                          <span
                            key={fc.id}
                            style={{ backgroundColor: fc.color }}
                            className="w-2 h-2 rounded-full ring-1 ring-black"
                            title={`${fc.displayName} sedang mengedit file ini`}
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(file.id, 'file', file.name);
                        }}
                        title="Rename file"
                        className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-amber-300 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        title="Hapus file"
                        className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Center: Code Editor Area */}
        <div className={`flex-1 flex flex-col bg-[#0c0c0c] min-w-0 ${mobileTab === 'editor' ? 'flex' : 'hidden md:flex'}`}>
          
          {/* File Tab Bar & Live Active Collaborator Presence Banner */}
          <div className="h-10 bg-[#111111] border-b border-neutral-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-3 text-xs font-mono text-neutral-300 truncate">
              <div className="flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="font-semibold text-white truncate">{activeFile.name}</span>
                <span className="text-neutral-500 hidden sm:inline">({activeFile.language})</span>
              </div>

              {/* Indicating who else is in this active file */}
              {activeFileCollaborators.length > 0 && (
                <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] text-neutral-400">
                  <Users className="w-3 h-3 text-emerald-400" />
                  <span>
                    {activeFileCollaborators.map(c => c.displayName).join(', ')} juga di file ini
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Scroll Up/Down controls for long code files */}
              <ScrollControls containerRef={codeEditorRef} variant="inline" />

              <button
                onClick={() => startRename(activeFile.id, 'file', activeFile.name)}
                className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white transition px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 font-mono"
                title="Rename file aktif"
              >
                <Edit2 className="w-3 h-3 text-amber-400" />
                <span className="hidden sm:inline">Rename</span>
              </button>

              <button
                onClick={() => handleDeleteFile(activeFile.id)}
                className="flex items-center gap-1 text-xs text-neutral-300 hover:text-red-400 transition px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-red-950/40 border border-neutral-700 font-mono"
                title="Hapus file aktif"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span className="hidden sm:inline">Hapus</span>
              </button>

              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white transition px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 font-mono"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-neutral-400" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {/* Direct Apply Notification */}
          {applyNotice && (
            <div className="p-2.5 bg-emerald-950/90 border-b border-emerald-800 text-emerald-200 text-xs font-mono flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{applyNotice}</span>
              </div>
              <button onClick={() => setApplyNotice(null)} className="text-emerald-400 hover:text-white text-xs">✕</button>
            </div>
          )}

          {/* Active Collaborator Cursor & Status Bar */}
          {activeFileCollaborators.length > 0 && (
            <div className="px-4 py-1 bg-neutral-900/60 border-b border-neutral-800/60 flex items-center gap-3 text-[11px] font-mono text-neutral-400 overflow-x-auto">
              <span className="text-neutral-500 font-semibold flex items-center gap-1">
                <Radio className="w-3 h-3 text-emerald-400" />
                Live Peers:
              </span>
              {activeFileCollaborators.map(c => (
                <div 
                  key={c.id}
                  onClick={() => handleFollowCollaborator(c)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700 hover:border-neutral-500 cursor-pointer transition text-white"
                >
                  <span style={{ backgroundColor: c.color }} className="w-2 h-2 rounded-full" />
                  <span className="font-semibold">{c.displayName}</span>
                  {c.cursor?.line && (
                    <span className="text-neutral-400 text-[10px]">
                      :L{c.cursor.line}
                    </span>
                  )}
                  {c.isTyping && (
                    <span className="text-emerald-400 animate-pulse text-[10px]">
                      (typing...)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Editable Code Editor */}
          <div className="flex-1 relative flex overflow-hidden">
            <textarea
              ref={codeEditorRef}
              value={activeFile.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              onKeyUp={handleEditorCursorChange}
              onClick={handleEditorCursorChange}
              onSelect={handleEditorCursorChange}
              className="w-full h-full bg-[#0c0c0c] text-neutral-100 p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none border-0 selection:bg-neutral-700 scroll-smooth"
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
            />
          </div>

          {/* Bottom Quick AI Prompt Bar in Coding Engine */}
          <div className="p-3 bg-[#111111] border-t border-neutral-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex items-center gap-2 flex-1">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAiAction('scaffold')}
                placeholder={`Prompt AI: 'Tambahkan dark mode', 'Buat kalkulator', 'Refactor'...`}
                className="w-full bg-[#181818] border border-neutral-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <label className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoApplyGeneratedCode}
                  onChange={(e) => setAutoApplyGeneratedCode(e.target.checked)}
                  className="rounded bg-neutral-800 border-neutral-700 text-emerald-500 focus:ring-0"
                />
                <span>Langsung Terapkan</span>
              </label>

              <button
                onClick={() => handleRunAiAction('scaffold')}
                disabled={isAiLoading || !aiPrompt.trim()}
                className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition disabled:opacity-50 flex items-center gap-1.5 shadow-md"
              >
                {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Generate & Terapkan</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Live Sandboxed Web Preview & AI Assistant Split */}
        <div className={`w-full md:w-[45%] lg:w-[48%] bg-[#080808] border-l border-neutral-800 flex flex-col flex-shrink-0 ${
          mobileTab === 'preview' || mobileTab === 'ai' ? 'flex' : 'hidden md:flex'
        }`}>
          {/* Top Bar for Preview Controls */}
          <div className="h-10 bg-[#111111] border-b border-neutral-800 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Eye className="w-4 h-4" />
              <span>Live Sandboxed Preview</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
                title="Desktop"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded ${previewDevice === 'tablet' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
                title="Tablet"
              >
                <Tablet className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
                title="Mobile"
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewKey(k => k + 1)}
                className="p-1.5 rounded text-neutral-400 hover:text-white transition"
                title="Refresh Preview"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Sandboxed iframe */}
          <div className="flex-1 bg-[#050505] p-3 flex items-center justify-center overflow-auto">
            {isPreviewSupported ? (
              <div
                className={`w-full h-full bg-white rounded-xl shadow-2xl overflow-hidden border border-neutral-800 transition-all ${
                  previewDevice === 'mobile'
                    ? 'max-w-[375px] max-h-[667px]'
                    : previewDevice === 'tablet'
                    ? 'max-w-[768px]'
                    : 'max-w-full'
                }`}
              >
                <iframe
                  key={previewKey}
                  title="LemAI Coding Preview"
                  srcDoc={bundledSrcDoc}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                  className="w-full h-full border-0 bg-white"
                />
              </div>
            ) : (
              <div className="text-center p-6 text-neutral-400">
                <FileCode className="w-10 h-10 mx-auto mb-3 text-neutral-600" />
                <h4 className="text-sm font-semibold text-white mb-1">Non-Web Programming Mode</h4>
                <p className="text-xs text-neutral-500 max-w-xs font-mono">
                  This language ({activeFile.language}) runs in backend execution environments rather than direct browser rendering.
                </p>
              </div>
            )}
          </div>

          {/* AI Result Drawer if available */}
          {aiOutput && (
            <div className="max-h-72 overflow-y-auto p-3.5 bg-[#111111] border-t border-neutral-800 text-xs font-mono text-neutral-300 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-800 font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  LemAI Response ({selectedCodingModel})
                </span>
                <button onClick={() => setAiOutput(null)} className="text-neutral-500 hover:text-white">✕</button>
              </div>

              <pre className="whitespace-pre-wrap bg-[#0c0c0c] p-2.5 rounded-lg border border-neutral-800 text-[11px] max-h-40 overflow-y-auto">{aiOutput}</pre>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={() => applyCodeToActiveFile(aiOutput)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shadow"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Terapkan ke {activeFile.name}</span>
                </button>
                <button
                  onClick={() => handleCreateNewFileFromAi(aiOutput)}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium text-xs flex items-center gap-1.5 border border-neutral-700"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                  <span>Buat Sebagai File Baru</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Live Team Pairing / Chat Drawer */}
        {isChatDrawerOpen && (
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#101010] border-l border-neutral-800 shadow-2xl z-30 flex flex-col animate-in slide-in-from-right-4 duration-200">
            <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-[#141414]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Room Chat & Notes</span>
              </div>
              <button 
                onClick={() => setIsChatDrawerOpen(false)}
                className="text-neutral-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Chat message list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
              {collabMessages.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
                  <p>Belum ada pesan.</p>
                  <p className="text-[10px] text-neutral-600">Diskusikan kode atau tinggalkan catatan untuk tim.</p>
                </div>
              ) : (
                collabMessages.map((msg) => {
                  const isMe = msg.senderId === effectiveUser.uid;
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-neutral-400">
                        <span style={{ color: msg.senderColor }} className="font-bold">
                          {msg.senderName}
                        </span>
                        <span className="text-neutral-600">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className={`p-2.5 rounded-xl max-w-[90%] text-xs ${
                        isMe ? 'bg-emerald-700 text-white' : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Chat form */}
            <form onSubmit={handleSendCollabChat} className="p-3 border-t border-neutral-800 bg-[#141414] flex gap-2">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Ketik catatan / pesan tim..."
                className="flex-1 bg-[#1c1c1c] border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-emerald-500"
              />
              <button
                type="submit"
                disabled={!chatInputText.trim()}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition shadow"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

      </div>

      {/* Real-time Collaboration Manager Modal */}
      {isCollabModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#121212] border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-950/70 border border-emerald-800/80 flex items-center justify-center text-emerald-400">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Real-Time Collaboration Hub</h3>
                  <p className="text-[11px] text-neutral-400 font-mono">Firebase Real-Time Multi-User IDE</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCollabModalOpen(false)}
                className="text-neutral-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            </div>

            {/* Room Information & Code */}
            <div className="p-4 rounded-xl bg-[#181818] border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-mono">Current Room Code:</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800 text-emerald-400 font-mono font-bold text-sm tracking-wider">
                  {collabRoomId}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyRoomCode}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition border border-neutral-700"
                >
                  {copiedRoomCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRoomCode ? 'Tersalin' : 'Salin Kode'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyRoomLink}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow"
                >
                  {copiedRoomLink ? <Check className="w-3.5 h-3.5 text-white" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>{copiedRoomLink ? 'Link Tersalin' : 'Salin Link Undangan'}</span>
                </button>
              </div>
            </div>

            {/* Active Members List */}
            <div>
              <h4 className="text-xs font-bold text-neutral-300 mb-2 font-mono flex items-center justify-between">
                <span>Active Collaborators ({remoteCollaborators.length + 1})</span>
                <span className="text-[10px] text-emerald-400 font-normal">● Live Synced</span>
              </h4>
              
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {/* Current User */}
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="text-white font-bold">{effectiveUser.displayName} (You)</span>
                  </div>
                  <span className="text-[10px] text-neutral-500">File: {activeFile.name}</span>
                </div>

                {/* Remote Users */}
                {remoteCollaborators.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-900/60 border border-neutral-800 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span style={{ backgroundColor: c.color }} className="w-2.5 h-2.5 rounded-full ring-1 ring-black" />
                      <span className="text-neutral-200">{c.displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-neutral-400">File: {c.activeFileName || 'index.html'}</span>
                      <button
                        onClick={() => {
                          handleFollowCollaborator(c);
                          setIsCollabModalOpen(false);
                        }}
                        className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-[10px] text-emerald-400"
                      >
                        Ikuti
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Join or Create Another Room */}
            <div className="pt-2 border-t border-neutral-800 space-y-3">
              <label className="text-[11px] font-mono text-neutral-400 block">
                Gabung ke Room Lain:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinRoomInput}
                  onChange={(e) => setJoinRoomInput(e.target.value)}
                  placeholder="Masukkan Room Code (misal LEM-7492)"
                  className="flex-1 bg-[#181818] border border-neutral-700 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none focus:border-white"
                />
                <button
                  type="button"
                  onClick={handleJoinNewRoom}
                  disabled={!joinRoomInput.trim()}
                  className="px-4 py-2 bg-white hover:bg-neutral-200 disabled:opacity-40 text-black text-xs font-bold rounded-xl transition"
                >
                  Gabung
                </button>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleCreateNewRoomCode}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-mono underline"
                >
                  + Buat Room Acak Baru
                </button>
                <button
                  type="button"
                  onClick={() => setIsCollabModalOpen(false)}
                  className="px-4 py-1.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition font-mono"
                >
                  Tutup
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Rename Modal Dialog */}
      {renamingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#121212] border border-neutral-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                <span>Rename {renamingItem.type === 'file' ? 'File' : 'Folder'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                className="text-neutral-500 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[11px] font-mono text-neutral-400 block mb-1.5">
                Nama Baru:
              </label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveRename()}
                autoFocus
                className="w-full bg-[#181818] border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenamingItem(null)}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 text-xs text-neutral-300 hover:bg-neutral-700 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                className="px-4 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
