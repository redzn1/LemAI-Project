import React, { useState, useRef, useMemo } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Check, 
  Copy, 
  Download, 
  Eye, 
  Code as CodeIcon, 
  WrapText, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Wrench, 
  RefreshCw,
  Smartphone,
  Monitor
} from 'lucide-react';
import { resolveLanguage, isWebPreviewable, generateSandboxSrcdoc, triggerCodeDownload } from '../utils/codeParser';

interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  onAction?: (action: 'explain' | 'fix' | 'improve', code: string, language: string) => void;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = 'text',
  filename,
  onAction,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [wrapLines, setWrapLines] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [previewKey, setPreviewKey] = useState(0);

  const langInfo = useMemo(() => resolveLanguage(language), [language]);
  const canPreview = useMemo(() => isWebPreviewable(langInfo.id, code), [langInfo.id, code]);
  const resolvedFilename = filename || langInfo.defaultFilename;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    triggerCodeDownload(resolvedFilename, code);
  };

  const handleRefreshPreview = () => {
    setPreviewKey(prev => prev + 1);
  };

  const srcDoc = useMemo(() => {
    if (!canPreview) return '';
    return generateSandboxSrcdoc(code, langInfo.id);
  }, [code, langInfo.id, canPreview]);

  const lineCount = code.split('\n').length;
  const isLargeCode = lineCount > 25;

  return (
    <div className="my-4 rounded-xl border border-neutral-800 bg-[#0c0c0c] overflow-hidden shadow-2xl transition-all duration-200">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-3.5 py-2.5 bg-[#141414] border-b border-neutral-800/80 gap-2 text-xs">
        {/* Left: Language badge & Tab Switcher (if previewable) */}
        <div className="flex items-center gap-2">
          {canPreview ? (
            <div className="flex items-center bg-[#090909] p-0.5 rounded-lg border border-neutral-800">
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'code'
                    ? 'bg-neutral-800 text-white shadow-sm'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <CodeIcon className="w-3.5 h-3.5" />
                Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-white text-black shadow-sm font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Preview
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-neutral-300 font-mono font-medium px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800">
              <span className="w-1.5 h-1.5 rounded-full bg-neutral-400"></span>
              {langInfo.name}
            </div>
          )}

          {filename && (
            <span className="text-neutral-400 font-mono text-[11px] hidden sm:inline-block">
              {filename}
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {activeTab === 'preview' && (
            <div className="flex items-center gap-1 mr-2 border-r border-neutral-800 pr-2">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                title="Desktop View"
                className={`p-1.5 rounded hover:bg-neutral-800 transition-colors ${
                  previewDevice === 'desktop' ? 'text-white bg-neutral-800' : 'text-neutral-400'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                title="Mobile View"
                className={`p-1.5 rounded hover:bg-neutral-800 transition-colors ${
                  previewDevice === 'mobile' ? 'text-white bg-neutral-800' : 'text-neutral-400'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleRefreshPreview}
                title="Reload Preview"
                className="p-1.5 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'code' && (
            <>
              <button
                type="button"
                onClick={() => setWrapLines(!wrapLines)}
                title="Toggle Line Wrap"
                className={`p-1.5 rounded transition-colors ${
                  wrapLines ? 'text-white bg-neutral-800' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <WrapText className="w-3.5 h-3.5" />
              </button>

              {onAction && (
                <div className="hidden sm:flex items-center gap-1 border-l border-neutral-800 pl-1 ml-1">
                  <button
                    type="button"
                    onClick={() => onAction('explain', code, langInfo.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-[11px]"
                  >
                    <Sparkles className="w-3 h-3" />
                    Explain
                  </button>
                  <button
                    type="button"
                    onClick={() => onAction('fix', code, langInfo.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors text-[11px]"
                  >
                    <Wrench className="w-3 h-3" />
                    Fix
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleDownload}
                title={`Download ${resolvedFilename}`}
                className="flex items-center gap-1 px-2 py-1 rounded text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors text-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Download</span>
              </button>
            </>
          )}

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Copy code only"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              copied
                ? 'bg-neutral-100 text-black font-semibold shadow-sm'
                : 'bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content: Code or Sandboxed Preview */}
      {activeTab === 'code' ? (
        <div className="relative group">
          <div
            className={`overflow-x-auto transition-all duration-300 ${
              !isExpanded && isLargeCode ? 'max-h-[420px]' : 'max-h-none'
            }`}
          >
            <SyntaxHighlighter
              language={langInfo.id === 'text' ? 'text' : langInfo.id}
              style={vscDarkPlus}
              wrapLongLines={wrapLines}
              customStyle={{
                margin: 0,
                padding: '1.25rem 1rem',
                background: '#090909',
                fontSize: '0.85rem',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.6,
              }}
              showLineNumbers={lineCount > 3}
              lineNumberStyle={{
                minWidth: '2.5em',
                paddingRight: '1em',
                color: '#404040',
                textAlign: 'right',
                userSelect: 'none',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </div>

          {/* Expand / Collapse gradient footer for long code */}
          {isLargeCode && (
            <div
              className={`flex items-center justify-center py-2 bg-gradient-to-t from-[#090909] via-[#090909]/95 to-transparent border-t border-neutral-800/60 ${
                !isExpanded ? 'sticky bottom-0 left-0 right-0' : ''
              }`}
            >
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-medium transition-all shadow-md"
              >
                {isExpanded ? (
                  <>
                    <Minimize2 className="w-3 h-3" />
                    Collapse Code
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" />
                    Expand {lineCount} Lines
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Isolated Sandboxed Web Preview */
        <div className="bg-[#050505] p-3 sm:p-4 flex flex-col items-center justify-center min-h-[350px]">
          <div
            className={`w-full transition-all duration-300 bg-white rounded-lg overflow-hidden shadow-2xl border border-neutral-800 ${
              previewDevice === 'mobile' ? 'max-w-[375px] h-[550px]' : 'max-w-full h-[450px]'
            }`}
          >
            <iframe
              key={previewKey}
              title="LemAI Sandboxed Web Preview"
              srcDoc={srcDoc}
              sandbox="allow-scripts allow-forms allow-popups allow-modals"
              className="w-full h-full border-0 bg-white"
            />
          </div>
          <div className="mt-2 text-center">
            <span className="text-[11px] text-neutral-500 font-mono">
              Sandboxed isolated iframe • Auth & credentials protected
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
