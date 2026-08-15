import React, { useState, useMemo, useRef } from 'react';
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
  Code, 
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
  Save
} from 'lucide-react';
import { CodingFile } from '../types';
import { resolveLanguage, triggerCodeDownload, isWebPreviewable } from '../utils/codeParser';
import { generateCode, LEMAI_MODELS } from '../api/api';
import { ScrollControls } from './ScrollControls';

interface FolderNode {
  id: string;
  name: string;
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
    <p class="text-sm text-neutral-400 mb-6 font-mono">Real-time live sandboxed web execution by Limone Teams</p>
    
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

export const CodingWorkspace: React.FC = () => {
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

  const fileTreeRef = useRef<HTMLDivElement>(null);
  const codeEditorRef = useRef<HTMLTextAreaElement>(null);
  const aiOutputRef = useRef<HTMLPreElement>(null);

  // Rename modal / inline state
  const [renamingItem, setRenamingItem] = useState<{ id: string; type: 'file' | 'folder'; currentName: string } | null>(null);
  const [renameInput, setRenameInput] = useState('');

  const activeFile = useMemo(() => {
    return files.find(f => f.id === activeFileId) || files[0];
  }, [files, activeFileId]);

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
    setFiles(prev => prev.map(f => {
      if (f.id === activeFileId) {
        return { ...f, content: cleanCode };
      }
      return f;
    }));
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
    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFileId);
    setApplyNotice(`File baru "${newFileName}" berhasil dibuat dan diterapkan!`);
    setTimeout(() => setApplyNotice(null), 3500);
  };

  const handleUpdateContent = (newContent: string) => {
    setFiles(prev => prev.map(f => f.id === activeFileId ? { ...f, content: newContent } : f));
  };

  // Add File (to Root or specific folder)
  const handleAddFile = (folderId: string | null = null) => {
    const fileName = prompt('Masukkan nama file baru (contoh: App.tsx, helpers.js, styles.css):');
    if (!fileName || !fileName.trim()) return;

    const trimmed = fileName.trim();
    const lang = resolveLanguage(trimmed.split('.').pop());

    const newFile: CodingFile = {
      id: `file-${Date.now()}`,
      name: trimmed,
      language: lang.id,
      type: 'file',
      folderId: folderId,
      content: `// File: ${trimmed}\n// LemAI Code Workspace\n`,
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileId(newFile.id);
  };

  // Add Folder
  const handleAddFolder = () => {
    const folderName = prompt('Masukkan nama folder baru (contoh: components, utils, styles):');
    if (!folderName || !folderName.trim()) return;

    const trimmed = folderName.trim().replace(/[\/\\]/g, '');
    const newFolder: FolderNode = {
      id: `folder-${Date.now()}`,
      name: trimmed,
    };

    setFolders(prev => [...prev, newFolder]);
    setExpandedFolders(prev => ({ ...prev, [newFolder.id]: true }));
  };

  // Start Renaming Item
  const startRename = (id: string, type: 'file' | 'folder', currentName: string) => {
    setRenamingItem({ id, type, currentName });
    setRenameInput(currentName);
  };

  // Submit Rename
  const handleSaveRename = () => {
    if (!renamingItem || !renameInput.trim()) {
      setRenamingItem(null);
      return;
    }

    const trimmed = renameInput.trim();
    if (renamingItem.type === 'file') {
      const lang = resolveLanguage(trimmed.split('.').pop());
      setFiles(prev => prev.map(f => {
        if (f.id === renamingItem.id) {
          return {
            ...f,
            name: trimmed,
            language: lang.id,
          };
        }
        return f;
      }));
    } else {
      setFolders(prev => prev.map(folder => {
        if (folder.id === renamingItem.id) {
          return { ...folder, name: trimmed };
        }
        return folder;
      }));
    }

    setRenamingItem(null);
  };

  // Delete File
  const handleDeleteFile = (id: string) => {
    if (files.length <= 1) {
      alert('Project harus memiliki setidaknya satu file.');
      return;
    }
    const targetFile = files.find(f => f.id === id);
    if (confirm(`Hapus file "${targetFile?.name || 'ini'}" secara permanen?`)) {
      setFiles(prev => prev.filter(f => f.id !== id));
      if (activeFileId === id) {
        const remaining = files.filter(f => f.id !== id);
        setActiveFileId(remaining[0]?.id || '');
      }
    }
  };

  // Delete Folder
  const handleDeleteFolder = (folderId: string) => {
    const folderFiles = files.filter(f => f.folderId === folderId);
    const targetFolder = folders.find(f => f.id === folderId);
    const msg = folderFiles.length > 0 
      ? `Hapus folder "${targetFolder?.name}" beserta ${folderFiles.length} file di dalamnya?` 
      : `Hapus folder "${targetFolder?.name}"?`;
    
    if (confirm(msg)) {
      setFolders(prev => prev.filter(f => f.id !== folderId));
      setFiles(prev => prev.filter(f => f.folderId !== folderId));
      if (folderFiles.some(f => f.id === activeFileId)) {
        const remaining = files.filter(f => f.folderId !== folderId);
        if (remaining.length > 0) {
          setActiveFileId(remaining[0].id);
        }
      }
    }
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleCopyCode = async () => {
    if (activeFile) {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadActiveFile = () => {
    if (activeFile) {
      triggerCodeDownload(activeFile.name, activeFile.content);
    }
  };

  const handleRunAiAction = async (action: 'explain' | 'fix' | 'optimize' | 'convert' | 'scaffold') => {
    setIsAiLoading(true);
    setAiOutput(null);
    try {
      const res = await generateCode({
        modelId: selectedCodingModel,
        action,
        prompt: aiPrompt || `Perform ${action} on current file ${activeFile.name}`,
        code: activeFile.content,
        targetLanguage: activeFile.language,
        files: files.map(f => ({ name: f.name, content: f.content })),
      });
      setAiOutput(res.text);

      // Auto apply to active file if action generates or modifies code
      if (autoApplyGeneratedCode && (action === 'fix' || action === 'optimize' || action === 'scaffold')) {
        applyCodeToActiveFile(res.text);
      }
    } catch (err: any) {
      setAiOutput(`Error: ${err.message}`);
    } finally {
      setIsAiLoading(false);
    }
  };

  const isPreviewSupported = isWebPreviewable(activeFile.language, activeFile.content) || files.some(f => f.name.endsWith('.html'));

  return (
    <div className="h-full flex flex-col bg-[#080808] overflow-hidden text-neutral-200">
      {/* Top Action Bar */}
      <div className="h-14 border-b border-neutral-800 bg-[#0d0d0d] px-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code className="w-5 h-5 text-white" />
            <span className="font-bold text-sm text-white tracking-tight">AI Coding Workspace</span>
          </div>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-neutral-800 text-[11px] font-mono text-neutral-400">
            {files.length} Files • {folders.length} Folders
          </span>
        </div>

        {/* Model Selector for Coding Workspace */}
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-xl text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 text-neutral-400" />
            <span className="text-neutral-500">Engine:</span>
            <select
              value={selectedCodingModel}
              onChange={(e) => setSelectedCodingModel(e.target.value)}
              className="bg-transparent text-white font-semibold focus:outline-none cursor-pointer"
            >
              <option value="lemai-1.0-flash" className="bg-[#141414] text-white">
                LemAI 1.0 Flash (GET)
              </option>
              <option value="lemai-flash-lite" className="bg-[#141414] text-white">
                LemAI Flash-Lite (GET)
              </option>
              <option value="lemai-1.1-pro" className="bg-[#141414] text-neutral-300">
                LemAI 1.1 Pro (POST SDK)
              </option>
            </select>
            <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
              selectedCodingModel === 'lemai-1.1-pro' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
            }`}>
              {selectedCodingModel === 'lemai-1.1-pro' ? 'POST' : 'GET'}
            </span>
          </div>

          {/* Mobile Tab Switcher */}
          <div className="flex md:hidden bg-neutral-900 p-0.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setMobileTab('editor')}
              className={`px-3 py-1 rounded-md font-medium ${mobileTab === 'editor' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              Editor
            </button>
            <button
              onClick={() => setMobileTab('preview')}
              className={`px-3 py-1 rounded-md font-medium ${mobileTab === 'preview' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              Preview
            </button>
            <button
              onClick={() => setMobileTab('ai')}
              className={`px-3 py-1 rounded-md font-medium ${mobileTab === 'ai' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              AI Dev
            </button>
          </div>

          {/* Top Quick Actions */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => handleRunAiAction('optimize')}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white border border-neutral-800 transition"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Optimize
            </button>
            <button
              onClick={() => handleRunAiAction('fix')}
              disabled={isAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white border border-neutral-800 transition"
            >
              <Wrench className="w-3.5 h-3.5 text-blue-400" />
              Fix Bugs
            </button>
            <button
              onClick={handleDownloadActiveFile}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        
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

                    {/* Folder Action Buttons (Always accessible) */}
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
                          return (
                            <div
                              key={file.id}
                              onClick={() => setActiveFileId(file.id)}
                              className={`group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs cursor-pointer font-mono transition ${
                                isActive
                                  ? 'bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-700'
                                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                                <span className="truncate">{file.name}</span>
                              </div>

                              <div className="flex items-center gap-1">
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
                return (
                  <div
                    key={file.id}
                    onClick={() => setActiveFileId(file.id)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer font-mono transition ${
                      isActive
                        ? 'bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-700'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-neutral-500'}`} />
                      <span className="truncate">{file.name}</span>
                    </div>

                    <div className="flex items-center gap-1">
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
          
          {/* File Tab Bar */}
          <div className="h-10 bg-[#111111] border-b border-neutral-800 flex items-center justify-between px-4">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-white">{activeFile.name}</span>
              <span className="text-neutral-500">({activeFile.language})</span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Scroll Up/Down controls for long code files */}
              <ScrollControls containerRef={codeEditorRef} variant="inline" />

              <button
                onClick={() => startRename(activeFile.id, 'file', activeFile.name)}
                className="flex items-center gap-1 text-xs text-neutral-300 hover:text-white transition px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700 font-mono"
                title="Rename file aktif"
              >
                <Edit2 className="w-3 h-3 text-amber-400" />
                <span>Rename</span>
              </button>

              <button
                onClick={() => handleDeleteFile(activeFile.id)}
                className="flex items-center gap-1 text-xs text-neutral-300 hover:text-red-400 transition px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-red-950/40 border border-neutral-700 font-mono"
                title="Hapus file aktif"
              >
                <Trash2 className="w-3 h-3 text-red-400" />
                <span>Hapus</span>
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

          {/* Editable Code Editor */}
          <div className="flex-1 relative flex overflow-hidden">
            <textarea
              ref={codeEditorRef}
              value={activeFile.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
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
      </div>

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
