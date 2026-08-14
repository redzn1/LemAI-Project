import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  ExternalLink, 
  Copy, 
  Check, 
  CheckCircle2, 
  Loader2, 
  Compass, 
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react';
import { research } from '../api/api';
import { MarkdownRenderer } from './MarkdownRenderer';

export const ResearchWorkspace: React.FC = () => {
  const [query, setQuery] = useState('');
  const [depth, setDepth] = useState<'quick' | 'deep' | 'exhaustive'>('deep');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [sources, setSources] = useState<Array<{ title: string; url: string }>>([]);
  const [keyFindings, setKeyFindings] = useState<string[]>([]);
  const [steps, setSteps] = useState<string[]>([]);

  const handleStartResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setReport(null);
    setSources([]);
    setKeyFindings([]);
    setSteps(['Formulating search strategy...', 'Scanning multi-domain literature & live ground...', 'Synthesizing verified findings...']);

    try {
      const res = await research(query, depth);
      setReport(res.report);
      setSources(res.sources || []);
      setKeyFindings(res.keyFindings || []);
    } catch (err: any) {
      setReport(`### Research Error\n\nFailed to conduct deep research: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyReport = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#080808] text-neutral-200 overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Header */}
      <div className="h-14 border-b border-neutral-800 bg-[#0c0c0c] px-6 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Search className="w-5 h-5 text-white" />
          <span className="font-bold text-sm text-white tracking-tight">Deep Research Engine</span>
          <span className="px-2 py-0.5 rounded bg-neutral-800 text-[10px] font-mono text-neutral-300">
            Grounding Verified
          </span>
        </div>

        {report && (
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Report' : 'Copy Report'}</span>
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-5xl mx-auto w-full">
        {/* Research Input Form */}
        <form onSubmit={handleStartResearch} className="mb-8 space-y-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-neutral-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter complex topic to research (e.g., 'Modern Rust Web Architecture 2026', 'Quantum Cryptography', 'AI Agent Protocols')..."
              className="w-full bg-[#121212] border border-neutral-800 hover:border-neutral-700 focus:border-white focus:ring-1 focus:ring-white rounded-2xl pl-12 pr-28 py-3.5 text-sm text-white placeholder-neutral-500 transition shadow-inner font-medium"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition flex items-center gap-1.5 shadow disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Investigate</span>
            </button>
          </div>

          {/* Depth selector */}
          <div className="flex items-center justify-between text-xs text-neutral-400 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase text-neutral-500">Research Depth:</span>
              {(['quick', 'deep', 'exhaustive'] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDepth(d)}
                  className={`px-2.5 py-1 rounded-lg capitalize text-xs font-medium transition ${
                    depth === d
                      ? 'bg-neutral-800 text-white font-semibold border border-neutral-700'
                      : 'text-neutral-500 hover:text-neutral-300'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline-block">
              Powered by LemAI Pro Search Synthesizer
            </span>
          </div>
        </form>

        {/* Loading status steps */}
        {isLoading && (
          <div className="p-6 rounded-2xl bg-[#0f0f0f] border border-neutral-800/80 mb-6 space-y-4 animate-pulse">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span className="font-semibold text-sm text-white">Synthesizing Deep Research Report...</span>
            </div>
            <div className="space-y-2 pl-8 text-xs font-mono text-neutral-400">
              {steps.map((step, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Container */}
        {report && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Key Findings Card */}
            {keyFindings.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#111111] border border-neutral-800 shadow-xl">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-white" />
                  Key Synthesized Findings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {keyFindings.map((finding, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-neutral-900 border border-neutral-800/60 text-xs text-neutral-300">
                      {finding}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Report */}
            <div className="p-6 sm:p-8 rounded-2xl bg-[#0c0c0c] border border-neutral-800 shadow-2xl">
              <MarkdownRenderer content={report} />
            </div>

            {/* Sources & Citations */}
            {sources.length > 0 && (
              <div className="p-5 rounded-2xl bg-[#111111] border border-neutral-800">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-white" />
                  Verified Citations ({sources.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-[#161616] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white transition group"
                    >
                      <span className="truncate mr-2">{src.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-500 group-hover:text-white flex-shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state placeholder */}
        {!report && !isLoading && (
          <div className="mt-12 text-center max-w-md mx-auto space-y-3 text-neutral-400">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto text-white">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">Continuous Research & Grounding</h3>
            <p className="text-xs text-neutral-500 leading-relaxed font-mono">
              LemAI aggregates verified scientific, architectural, and real-time domain datasets to produce structured research briefs.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
