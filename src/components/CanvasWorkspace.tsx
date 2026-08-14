import React, { useState } from 'react';
import { 
  Layout, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  FileEdit, 
  Eye, 
  Maximize2, 
  Wand2, 
  Loader2,
  FileText
} from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { requestAI } from '../api/api';

const DEFAULT_CANVAS_TEXT = `# LemAI System Architecture & Engineering Brief

## 1. Overview
LemAI represents a unified Black Intelligence AI operating workspace featuring first-class coding compilation, multi-model execution, and sandboxed execution.

### Key Capabilities Matrix
| Dimension | LemAI Flash-Lite | LemAI 1.0 Flash | LemAI 1.1 Pro |
| :--- | :--- | :--- | :--- |
| Latency | < 300ms | < 650ms | Deep Reasoning |
| Modality | Text, Code | Multimodal, Vision | Full Multimodal, Grounding |
| Context | Fast Scripts | General Dev | Enterprise Architecture |

## 2. Sandboxed Web Execution
Code rendered within LemAI is completely isolated:

\`\`\`javascript
function initializeLemAISandbox() {
  const context = {
    brand: 'LemAI',
    authIsolated: true,
    storageIsolated: true
  };
  return Object.freeze(context);
}
\`\`\`

## 3. Next Steps
- Implement real-time canvas collaborative sync
- Add automated unit-test scaffolding
`;

export const CanvasWorkspace: React.FC = () => {
  const [content, setContent] = useState(DEFAULT_CANVAS_TEXT);
  const [copied, setCopied] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>('split');

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LemAI-Canvas.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleAiRefine = async (instruction: string) => {
    setIsAiProcessing(true);
    try {
      const res = await requestAI({
        modelId: 'lemai-1.0-flash',
        prompt: `Please refine and edit the following canvas markdown document based on this instruction: "${instruction}".
Return ONLY the updated markdown document without conversational filler.

Current Document:
${content}`,
      });

      if (res.text) {
        setContent(res.text);
      }
    } catch (err: any) {
      console.error('Canvas AI refine error:', err);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#080808] text-neutral-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header */}
      <div className="h-14 border-b border-neutral-800 bg-[#0c0c0c] px-4 sm:px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Layout className="w-5 h-5 text-white" />
          <span className="font-bold text-sm text-white tracking-tight">Interactive Canvas</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-400">
            Live Markdown & Code Scratchpad
          </span>
        </div>

        {/* View Mode Toggle & Actions */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex bg-neutral-900 p-0.5 rounded-xl border border-neutral-800 text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded-lg font-medium transition ${viewMode === 'split' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              Split
            </button>
            <button
              onClick={() => setViewMode('edit')}
              className={`px-3 py-1 rounded-lg font-medium transition ${viewMode === 'edit' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              Edit
            </button>
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 rounded-lg font-medium transition ${viewMode === 'preview' ? 'bg-neutral-800 text-white' : 'text-neutral-400'}`}
            >
              Preview
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-white transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* AI Enhancement Quick Actions Bar */}
      <div className="h-10 border-b border-neutral-800/80 bg-[#111111] px-4 flex items-center gap-2 overflow-x-auto text-xs flex-shrink-0">
        <span className="text-[10px] font-mono text-neutral-500 uppercase flex items-center gap-1 mr-1">
          <Wand2 className="w-3 h-3 text-neutral-400" /> AI Tools:
        </span>
        <button
          onClick={() => handleAiRefine('Improve grammar, vocabulary and executive tone')}
          disabled={isAiProcessing}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition disabled:opacity-50 flex items-center gap-1 text-[11px]"
        >
          {isAiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          Polish Prose
        </button>
        <button
          onClick={() => handleAiRefine('Add structured Markdown comparison tables and bullet points')}
          disabled={isAiProcessing}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition disabled:opacity-50 text-[11px]"
        >
          Format Tables
        </button>
        <button
          onClick={() => handleAiRefine('Add technical code snippets with syntax highlighting')}
          disabled={isAiProcessing}
          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition disabled:opacity-50 text-[11px]"
        >
          Enrich Code
        </button>
      </div>

      {/* Main Split Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Area */}
        {(viewMode === 'split' || viewMode === 'edit') && (
          <div className="flex-1 flex flex-col bg-[#0a0a0a] border-r border-neutral-800 overflow-hidden">
            <div className="px-4 py-2 bg-[#121212] border-b border-neutral-800 text-xs font-mono text-neutral-400 flex items-center justify-between">
              <span>Markdown Source</span>
              <span>{content.length} chars</span>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 w-full bg-[#0a0a0a] text-neutral-100 p-4 font-mono text-sm leading-relaxed resize-none focus:outline-none"
              spellCheck={false}
            />
          </div>
        )}

        {/* Live Rendered Preview Area */}
        {(viewMode === 'split' || viewMode === 'preview') && (
          <div className="flex-1 flex flex-col bg-[#0c0c0c] overflow-y-auto p-6 sm:p-8">
            <MarkdownRenderer content={content} />
          </div>
        )}
      </div>
    </div>
  );
};
