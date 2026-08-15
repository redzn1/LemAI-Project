import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Key, 
  Cpu, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Search, 
  Sliders, 
  Send, 
  RotateCcw, 
  ExternalLink, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Layers, 
  Copy, 
  CheckCheck, 
  Code2, 
  Globe, 
  RefreshCw,
  Terminal,
  BrainCircuit,
  Eye,
  EyeOff,
  Flame,
  Gift
} from 'lucide-react';
import { 
  OpenRouterConfig, 
  OpenRouterModelInfo 
} from '../types';
import { 
  getOpenRouterConfig, 
  saveOpenRouterConfig, 
  verifyOpenRouterKey, 
  fetchOpenRouterModels, 
  requestOpenRouter 
} from '../api/api';
import { ScrollControls } from './ScrollControls';

interface OpenRouterDashboardProps {
  onBackToApp: () => void;
}

const PRESET_CATEGORIES = [
  { id: 'all', label: 'Semua Model' },
  { id: 'free', label: '🆓 100% Gratis (Free)', icon: Gift },
  { id: 'popular', label: '🌟 Rekomendasi Unggulan', icon: Flame },
  { id: 'coding', label: '💻 Coding & Reasoning', icon: BrainCircuit },
  { id: 'fast', label: '⚡ Ultra Fast', icon: Zap },
];

export const OpenRouterDashboard: React.FC<OpenRouterDashboardProps> = ({ onBackToApp }) => {
  const [config, setConfig] = useState<OpenRouterConfig>(getOpenRouterConfig());
  const [showKey, setShowKey] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<{ valid: boolean; data?: any; error?: string } | null>(null);
  
  // Model catalog
  const [models, setModels] = useState<OpenRouterModelInfo[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [customModelInput, setCustomModelInput] = useState('');

  // Live Test Playground
  const [testPrompt, setTestPrompt] = useState('Jelaskan keunggulan arsitektur OpenRouter dan bagaimana model AI memproses prompt dengan efisien.');
  const [testResponse, setTestResponse] = useState('');
  const [testReasoning, setTestReasoning] = useState('');
  const [testLatency, setTestLatency] = useState<number | null>(null);
  const [testUsage, setTestUsage] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [activeTab, setActiveTab] = useState<'response' | 'reasoning' | 'json'>('response');
  const [saveToast, setSaveToast] = useState<string | null>(null);

  // Load models on mount
  useEffect(() => {
    loadModels();
    if (config.apiKey) {
      handleVerify(config.apiKey, false);
    }
  }, []);

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      const data = await fetchOpenRouterModels(config.apiKey);
      setModels(data);
    } catch (e) {
      console.warn('Failed to load models list:', e);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleVerify = async (keyToVerify?: string, showToast = true) => {
    const key = keyToVerify !== undefined ? keyToVerify : config.apiKey;
    if (!key.trim()) {
      setVerifyResult({ valid: false, error: 'Silakan masukkan API Key terlebih dahulu.' });
      return;
    }

    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const res = await verifyOpenRouterKey(key.trim());
      setVerifyResult(res);
      if (res.valid) {
        const updated = saveOpenRouterConfig({ apiKey: key.trim() });
        setConfig(updated);
        if (showToast) {
          showNotification('API Key OpenRouter Terverifikasi & Tersimpan!');
        }
      }
    } catch (e: any) {
      setVerifyResult({ valid: false, error: e.message || 'Verifikasi gagal' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveConfig = (updates: Partial<OpenRouterConfig>) => {
    const updated = saveOpenRouterConfig(updates);
    setConfig(updated);
    showNotification('Pengaturan OpenRouter Disimpan!');
  };

  const showNotification = (msg: string) => {
    setSaveToast(msg);
    setTimeout(() => setSaveToast(null), 3000);
  };

  const handleSelectModel = (modelId: string) => {
    handleSaveConfig({ selectedModel: modelId });
  };

  const handleRunTest = async () => {
    if (!config.apiKey && !verifyResult?.valid) {
      setTestError('Silakan masukkan dan simpan API Key OpenRouter Anda terlebih dahulu.');
      return;
    }
    if (!testPrompt.trim() || isTesting) return;

    setIsTesting(true);
    setTestError(null);
    setTestResponse('');
    setTestReasoning('');
    setTestLatency(null);
    setTestUsage(null);

    const startTime = Date.now();

    try {
      // Test using OpenRouter endpoint
      const result = await requestOpenRouter({
        prompt: testPrompt,
        apiKey: config.apiKey,
        model: config.selectedModel,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        systemInstruction: config.systemInstruction,
      });

      setTestResponse(result.text);
      setTestLatency(result.latencyMs || (Date.now() - startTime));
      setTestUsage(result.usage);
      setActiveTab('response');
    } catch (err: any) {
      setTestError(err.message || 'Gagal mengeksekusi test prompt via OpenRouter.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  // Filtered models
  const filteredModels = models.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedCategory === 'free') {
      return m.isFree || m.id.includes(':free');
    }
    if (selectedCategory === 'popular') {
      return [
        'deepseek/deepseek-chat',
        'deepseek/deepseek-r1:free',
        'anthropic/claude-3.5-sonnet',
        'meta-llama/llama-3.3-70b-instruct',
        'google/gemini-2.0-flash-001',
        'openai/gpt-4o',
      ].some((popId) => m.id.includes(popId));
    }
    if (selectedCategory === 'coding') {
      return m.id.includes('coder') || m.id.includes('r1') || m.id.includes('sonnet') || m.id.includes('deepseek');
    }
    if (selectedCategory === 'fast') {
      return m.id.includes('flash') || m.id.includes('8b') || m.id.includes('mini');
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#070707] text-neutral-200 selection:bg-neutral-800 font-sans overflow-y-auto">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 bg-[#0c0c0c]/80 backdrop-blur-xl border-b border-neutral-800/80 px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-mono text-neutral-300 hover:text-white transition shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Workspace</span>
          </button>

          <div className="h-4 w-[1px] bg-neutral-800 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-sm text-white tracking-tight">OpenRouter Engine Hub</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800/70 text-indigo-300 font-medium">
              /openr
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Inline Scroll Controls */}
          <ScrollControls variant="inline" />

          {/* Status Badge */}
          {config.apiKey ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Key Terpasang</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Key Diperlukan</span>
            </div>
          )}
        </div>
      </header>

      {/* Floating Scroll Controls */}
      <ScrollControls variant="floating" />

      {/* Toast Notification */}
      {saveToast && (
        <div className="fixed top-16 right-6 z-50 px-4 py-2.5 rounded-2xl bg-neutral-900 border border-emerald-500/50 text-emerald-400 text-xs font-mono shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 duration-200">
          <Check className="w-4 h-4" />
          <span>{saveToast}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* Hero Banner with Master Toggle */}
        <section className="relative rounded-3xl bg-gradient-to-b from-[#141414] to-[#0d0d0d] border border-neutral-800 p-6 sm:p-8 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/70 text-xs font-mono text-indigo-300">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                <span>Multi-Model API Gateway</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Integrasi OpenRouter untuk LemAI
              </h1>
              <p className="text-sm text-neutral-400 leading-relaxed font-sans">
                Gunakan API OpenRouter untuk menghubungkan LemAI dengan ratusan model terhebat di dunia (DeepSeek V3, DeepSeek R1, Claude 3.5 Sonnet, Llama 3.3 70B, Qwen 2.5 Coder) secara langsung dan stabil.
              </p>
            </div>

            {/* Master Toggle Card */}
            <div className="w-full md:w-auto p-4 rounded-2xl bg-[#181818] border border-neutral-700/80 shadow-xl space-y-3 flex-shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-mono font-semibold text-white">Engine Utama LemAI</div>
                  <div className="text-[11px] text-neutral-400">Rute semua chat via OpenRouter</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enabledAsPrimary}
                    onChange={(e) => handleSaveConfig({ enabledAsPrimary: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-2 border-t border-neutral-700/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-neutral-400">Model Aktif:</span>
                <span className="text-indigo-400 font-semibold truncate max-w-[150px]">{config.selectedModel}</span>
              </div>
            </div>
          </div>
        </section>

        {/* API Key Configuration Section */}
        <section className="rounded-2xl bg-[#0f0f0f] border border-neutral-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white font-mono">1. Pengaturan API Key OpenRouter</h2>
            </div>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-mono text-indigo-400 hover:text-indigo-300 hover:underline"
            >
              <span>Dapatkan API Key di OpenRouter.ai</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <label className="text-xs font-mono text-neutral-400">OpenRouter API Key (sk-or-v1-...)</label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                    placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full bg-[#181818] border border-neutral-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono placeholder-neutral-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleVerify()}
                  disabled={isVerifying || !config.apiKey.trim()}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white text-black font-semibold text-xs font-mono hover:bg-neutral-200 transition shadow disabled:opacity-50 flex-shrink-0"
                >
                  {isVerifying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  )}
                  <span>{isVerifying ? 'Memeriksa...' : 'Verifikasi & Simpan'}</span>
                </button>
              </div>

              {/* Verify feedback message */}
              {verifyResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-mono flex items-center justify-between gap-2 animate-in fade-in duration-150 ${
                    verifyResult.valid
                      ? 'bg-emerald-950/40 border border-emerald-800/60 text-emerald-300'
                      : 'bg-red-950/40 border border-red-800/60 text-red-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {verifyResult.valid ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span>
                      {verifyResult.valid
                        ? 'Key valid! Siap digunakan untuk inferensi model di LemAI.'
                        : `Gagal: ${verifyResult.error}`}
                    </span>
                  </div>
                  {verifyResult.valid && verifyResult.data?.label && (
                    <span className="text-[11px] text-neutral-400">Label: {verifyResult.data.label}</span>
                  )}
                </div>
              )}
            </div>

            {/* Quick Credit Info Card */}
            <div className="p-4 rounded-xl bg-[#161616] border border-neutral-800 space-y-2 flex flex-col justify-center">
              <div className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">Status Koneksi API</div>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${config.apiKey ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'}`} />
                <span className="font-bold text-sm text-white">
                  {config.apiKey ? 'Terhubung ke OpenRouter' : 'Belum Ada Key'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                Key Anda disimpan dengan aman di local workspace Anda dan diproxy secara aman ke server gateway.
              </p>
            </div>
          </div>
        </section>

        {/* Model Selection & Explorer */}
        <section className="rounded-2xl bg-[#0f0f0f] border border-neutral-800 p-6 space-y-5 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-white font-mono">2. Pilih Model AI dari OpenRouter</h2>
              </div>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Model saat ini: <strong className="text-indigo-400">{config.selectedModel}</strong>
              </p>
            </div>

            <button
              type="button"
              onClick={loadModels}
              disabled={isLoadingModels}
              className="flex items-center gap-1 text-xs font-mono text-neutral-400 hover:text-white px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingModels ? 'animate-spin' : ''}`} />
              <span>Refresh Daftar Model</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari model (misal: deepseek, claude, llama, free, gemini)..."
                  className="w-full bg-[#181818] border border-neutral-700 rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Custom Model Direct Input */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => setCustomModelInput(e.target.value)}
                  placeholder="Atau ketik ID Model custom..."
                  className="bg-[#181818] border border-neutral-700 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customModelInput.trim()) {
                      handleSelectModel(customModelInput.trim());
                      setCustomModelInput('');
                    }
                  }}
                  disabled={!customModelInput.trim()}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-mono font-semibold transition disabled:opacity-40"
                >
                  Pilih
                </button>
              </div>
            </div>

            {/* Category Pills */}
            <div className="flex flex-wrap gap-2">
              {PRESET_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-mono transition flex items-center gap-1.5 ${
                    selectedCategory === cat.id
                      ? 'bg-white text-black font-semibold shadow'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {cat.icon && <cat.icon className="w-3 h-3" />}
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Model Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredModels.map((m) => {
              const isSelected = config.selectedModel === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => handleSelectModel(m.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/50'
                      : 'bg-[#141414] hover:bg-[#1a1a1a] border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-xs text-white line-clamp-1">{m.name}</h3>
                      {m.isFree ? (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[9px] font-mono font-bold uppercase flex-shrink-0">
                          100% Free
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 border border-neutral-700 text-[9px] font-mono flex-shrink-0">
                          Pro
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-neutral-500 truncate">{m.id}</div>
                    {m.description && (
                      <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed font-sans">
                        {m.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-neutral-500">
                      Context: {m.context_length ? `${(m.context_length / 1000).toFixed(0)}k` : '4k'}
                    </span>
                    <button
                      type="button"
                      className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'bg-neutral-800 text-neutral-300 hover:text-white'
                      }`}
                    >
                      {isSelected ? '✓ Terpilih' : 'Gunakan Model'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Model Parameter Sliders & System Persona */}
        <section className="rounded-2xl bg-[#0f0f0f] border border-neutral-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-neutral-800">
            <Sliders className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white font-mono">3. Parameter Model & Persona Sistem</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Temperature */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Temperature (Kreativitas)</span>
                <span className="text-white font-bold">{config.temperature}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.5"
                step="0.05"
                value={config.temperature}
                onChange={(e) => handleSaveConfig({ temperature: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>0.0 (Presisi/Ketat)</span>
                <span>1.5 (Kreatif)</span>
              </div>
            </div>

            {/* Max Tokens */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Max Tokens Output</span>
                <span className="text-white font-bold">{config.maxTokens}</span>
              </div>
              <input
                type="range"
                min="512"
                max="16384"
                step="512"
                value={config.maxTokens}
                onChange={(e) => handleSaveConfig({ maxTokens: parseInt(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>512</span>
                <span>16,384</span>
              </div>
            </div>

            {/* Top-P */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-neutral-400">Top-P Sampling</span>
                <span className="text-white font-bold">{config.topP || 0.9}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={config.topP || 0.9}
                onChange={(e) => handleSaveConfig({ topP: parseFloat(e.target.value) })}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-[10px] font-mono text-neutral-500">
                <span>0.1</span>
                <span>1.0</span>
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="space-y-1 pt-2">
            <label className="text-xs font-mono text-neutral-400">Instruksi Persona Sistem</label>
            <textarea
              rows={2}
              value={config.systemInstruction || ''}
              onChange={(e) => handleSaveConfig({ systemInstruction: e.target.value })}
              className="w-full bg-[#181818] border border-neutral-700 rounded-xl p-3 text-xs text-neutral-200 focus:outline-none focus:border-indigo-500 font-sans"
              placeholder="Instruksi identitas dan gaya jawaban model..."
            />
          </div>
        </section>

        {/* Live Interactive Response Sandbox */}
        <section className="rounded-2xl bg-[#0f0f0f] border border-neutral-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white font-mono">4. Live Response Testing Console</h2>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-neutral-500">Model:</span>
              <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                {config.selectedModel}
              </span>
            </div>
          </div>

          {/* Prompt Input & Quick Templates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
              <span>Test Prompt:</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTestPrompt('Buat kode algoritma binary search dan visualisasi complexity di TypeScript.')}
                  className="hover:text-white"
                >
                  [Contoh Coding]
                </button>
                <button
                  type="button"
                  onClick={() => setTestPrompt('Jelaskan perbedaan mendasar antara model DeepSeek R1 dan GPT-4o.')}
                  className="hover:text-white"
                >
                  [Contoh Reasoning]
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                rows={3}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Ketik prompt untuk menguji respon model OpenRouter..."
                className="w-full bg-[#161616] border border-neutral-700 rounded-xl p-3 text-sm text-neutral-200 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
              />
              <button
                type="button"
                onClick={handleRunTest}
                disabled={isTesting || !testPrompt.trim()}
                className="absolute right-3 bottom-3.5 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black font-semibold text-xs font-mono hover:bg-neutral-200 transition shadow disabled:opacity-50"
              >
                {isTesting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isTesting ? 'Mengirim Request...' : 'Kirim Test'}</span>
              </button>
            </div>
          </div>

          {/* Error display */}
          {testError && (
            <div className="p-3 rounded-xl bg-red-950/50 border border-red-800/70 text-red-300 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span>{testError}</span>
            </div>
          )}

          {/* Output Viewer with Tabs */}
          {(testResponse || isTesting) && (
            <div className="rounded-xl bg-[#121212] border border-neutral-800 overflow-hidden space-y-0">
              {/* Output Header with Metrics */}
              <div className="bg-[#181818] px-4 py-2 border-b border-neutral-800 flex items-center justify-between flex-wrap gap-2 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('response')}
                    className={`px-2.5 py-1 rounded-lg transition ${
                      activeTab === 'response' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Respon Teks
                  </button>
                  {testUsage && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('json')}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        activeTab === 'json' ? 'bg-neutral-800 text-white font-semibold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Raw Metrics / JSON
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-neutral-400 text-[11px]">
                  {testLatency && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <Zap className="w-3 h-3" />
                      <span>{testLatency} ms</span>
                    </span>
                  )}
                  {testUsage?.total_tokens && (
                    <span>Tokens: {testUsage.total_tokens}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCopy(testResponse)}
                    className="flex items-center gap-1 hover:text-white text-neutral-400 transition"
                  >
                    {copiedResponse ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedResponse ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Output Content */}
              <div className="p-4 max-h-96 overflow-y-auto text-sm leading-relaxed text-neutral-200 font-sans">
                {activeTab === 'response' && (
                  <div className="whitespace-pre-wrap">{testResponse || 'Menunggu respon...'}</div>
                )}
                {activeTab === 'json' && (
                  <pre className="text-xs font-mono text-neutral-300 whitespace-pre-wrap">
                    {JSON.stringify({ usage: testUsage, latencyMs: testLatency, model: config.selectedModel }, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Footer info */}
        <footer className="text-center pt-6 border-t border-neutral-800 text-xs font-mono text-neutral-500 space-y-1.5">
          <p>© {new Date().getFullYear()} LemAI Black Intelligence with OpenRouter Engine.</p>
          <p className="text-[11px] text-neutral-600">Built by Limone Teams. Robust, resilient, and multi-model gateway.</p>
        </footer>

      </main>
    </div>
  );
};
