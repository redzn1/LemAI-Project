import React, { useState, useMemo } from 'react';
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
    if (confirm('Hapus file ini secara permanen?')) {
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
    const msg = folderFiles.length > 0 
      ? `Hapus folder beserta ${folderFiles.length} file di dalamnya?` 
      : 'Hapus folder ini?';
    
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
        <div className="w-52 sm:w-56 bg-[#0a0a0a] border-r border-neutral-800 flex flex-col flex-shrink-0">
          
          {/* Header Action Bar */}
          <div className="p-2.5 border-b border-neutral-800/80 flex items-center justify-between">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
              Explorer
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleAddFile(null)}
                title="Tambah File Baru"
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              >
                <FilePlus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleAddFolder}
                title="Tambah Folder Baru"
                className="p-1 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
              >
                <FolderPlus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Explorer Tree List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            
            {/* 1. Folders List */}
            {folders.map((folder) => {
              const isExpanded = !!expandedFolders[folder.id];
              const folderFiles = files.filter(f => f.folderId === folder.id);

              return (
                <div key={folder.id} className="space-y-0.5">
                  <div className="group flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-mono text-neutral-300 hover:bg-neutral-900 cursor-pointer transition">
                    <div 
                      className="flex items-center gap-1.5 truncate flex-1"
                      onClick={() => toggleFolder(folder.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-3 h-3 text-neutral-500" />
                      ) : (
                        <ChevronRight className="w-3 h-3 text-neutral-500" />
                      )}
                      {isExpanded ? (
                        <FolderOpen className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-amber-400/80" />
                      )}
                      <span className="font-medium text-neutral-200 truncate">{folder.name}</span>
                      <span className="text-[10px] text-neutral-600">({folderFiles.length})</span>
                    </div>

                    {/* Folder Quick Actions */}
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddFile(folder.id);
                        }}
                        title="Tambah file ke folder ini"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(folder.id, 'folder', folder.name);
                        }}
                        title="Rename folder"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFolder(folder.id);
                        }}
                        title="Hapus folder"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>

                  {/* Files inside this folder */}
                  {isExpanded && (
                    <div className="pl-4 space-y-0.5 border-l border-neutral-800/80 ml-2.5 my-0.5">
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
                                  ? 'bg-neutral-800 text-white font-semibold'
                                  : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                                <span className="truncate">{file.name}</span>
                              </div>

                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startRename(file.id, 'file', file.name);
                                  }}
                                  title="Rename file"
                                  className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFile(file.id);
                                  }}
                                  title="Hapus file"
                                  className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
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

            {/* 2. Root Files List (folderId === null) */}
            <div className="pt-1 space-y-0.5">
              <div className="px-2 py-1 text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
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
                        ? 'bg-neutral-800 text-white font-semibold'
                        : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-neutral-500'}`} />
                      <span className="truncate">{file.name}</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(file.id, 'file', file.name);
                        }}
                        title="Rename file"
                        className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-white"
                      >
                        <Edit2 className="w-2.5 h-2.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteFile(file.id);
                        }}
                        title="Hapus file"
                        className="p-1 rounded hover:bg-neutral-700 text-neutral-400 hover:text-red-400"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
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
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-white">{activeFile.name}</span>
              <span className="text-neutral-500">({activeFile.language})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => startRename(activeFile.id, 'file', activeFile.name)}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition px-2 py-1 rounded hover:bg-neutral-800"
                title="Rename active file"
              >
                <Edit2 className="w-3 h-3" />
                <span>Rename</span>
              </button>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition px-2 py-1 rounded hover:bg-neutral-800"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Editable Code Editor */}
          <div className="flex-1 relative flex overflow-hidden">
            <textarea
              value={activeFile.content}
              onChange={(e) => handleUpdateContent(e.target.value)}
              className="w-full h-full bg-[#0c0c0c] text-neutral-100 p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none border-0 selection:bg-neutral-700"
              spellCheck={false}
              autoCapitalize="none"
              autoComplete="off"
            />
          </div>

          {/* Bottom Quick AI Prompt Bar in Coding Engine */}
          <div className="p-3 bg-[#111111] border-t border-neutral-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-neutral-400 flex-shrink-0" />
            <input
              type="text"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRunAiAction('scaffold')}
              placeholder={`Ask ${selectedCodingModel === 'lemai-1.1-pro' ? 'LemAI 1.1 Pro (POST)' : 'LemAI GET Engine'}: 'Add a dark mode toggle', 'Create a React timer', 'Refactor code'..`}
              className="flex-1 bg-[#181818] border border-neutral-700/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-white font-mono"
            />
            <button
              onClick={() => handleRunAiAction('scaffold')}
              disabled={isAiLoading || !aiPrompt.trim()}
              className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Generate ({selectedCodingModel === 'lemai-1.1-pro' ? 'POST' : 'GET'})</span>
            </button>
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
            <div className="max-h-60 overflow-y-auto p-3 bg-[#111111] border-t border-neutral-800 text-xs font-mono text-neutral-300">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800 font-bold text-white">
                <span>LemAI AI Response ({selectedCodingModel === 'lemai-1.1-pro' ? 'POST' : 'GET'})</span>
                <button onClick={() => setAiOutput(null)} className="text-neutral-500 hover:text-white">✕</button>
              </div>
              <pre className="whitespace-pre-wrap">{aiOutput}</pre>
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
