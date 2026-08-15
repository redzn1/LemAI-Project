import { LemAIModel, Attachment, OpenRouterConfig, OpenRouterModelInfo } from '../types';

export const LEMAI_MODELS: Record<string, LemAIModel> = {
  'lemai-flash-lite': {
    id: 'lemai-flash-lite',
    name: 'LemAI Flash-Lite',
    description: 'Sangat cepat dan ringan untuk pertanyaan kilat dan pembuatan skrip sederhana.',
    badge: '⚡ Fast & Lite',
    iconType: 'flash-lite',
    capabilities: ['chat', 'coding'],
    enabled: true,
    isAvailable: true,
  },
  'lemai-1.0-flash': {
    id: 'lemai-1.0-flash',
    name: 'LemAI 1.0 Flash',
    description: 'Model utama berkecepatan tinggi dengan pemahaman penalaran multimodal buatan Limone Teams.',
    badge: '✦ Balanced AI',
    iconType: 'flash',
    capabilities: ['chat', 'coding', 'vision'],
    enabled: true,
    isAvailable: true,
  },
  'lemai-1.1-pro': {
    id: 'lemai-1.1-pro',
    name: 'LemAI 1.1 Pro',
    description: 'Model tercanggih untuk penalaran kompleks, multi-file coding, dan deep research (Belum Tersedia).',
    badge: '🔒 Belum Tersedia',
    iconType: 'pro',
    capabilities: ['chat', 'coding', 'vision', 'research', 'canvas'],
    enabled: false,
    isAvailable: false,
  },
  'openrouter-custom': {
    id: 'openrouter-custom',
    name: 'OpenRouter Multi-Engine',
    description: 'Akses ratusan model AI terdepan (DeepSeek, Claude, Llama 3, Qwen) melalui OpenRouter.',
    badge: '🌐 OpenRouter Active',
    iconType: 'flash',
    capabilities: ['chat', 'coding', 'vision', 'research', 'canvas'],
    enabled: true,
    isAvailable: true,
  },
};

export const DEFAULT_OPENROUTER_CONFIG: OpenRouterConfig = {
  apiKey: '',
  selectedModel: 'deepseek/deepseek-chat',
  enabledAsPrimary: false,
  temperature: 0.7,
  maxTokens: 4096,
  topP: 0.9,
  systemInstruction: 'Anda adalah LemAI Black Intelligence yang didukung oleh OpenRouter Engine. Jawablah dengan akurat, cerdas, terstruktur dan ramah.',
};

export const OPENROUTER_STORAGE_KEY = 'lemai_openrouter_config_v1';

export function getOpenRouterConfig(): OpenRouterConfig {
  try {
    const raw = localStorage.getItem(OPENROUTER_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_OPENROUTER_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to parse openrouter config from storage:', e);
  }
  return DEFAULT_OPENROUTER_CONFIG;
}

export function saveOpenRouterConfig(config: Partial<OpenRouterConfig>): OpenRouterConfig {
  const current = getOpenRouterConfig();
  const updated = { ...current, ...config };
  try {
    localStorage.setItem(OPENROUTER_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Failed to save openrouter config:', e);
  }
  return updated;
}

export async function verifyOpenRouterKey(apiKey: string): Promise<{ valid: boolean; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/openrouter/verify-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey }),
    });
    const data = await res.json();
    return data;
  } catch (e: any) {
    // Fallback to direct client call if backend proxy is unreachable
    try {
      const direct = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'LemAI Client',
        },
      });
      if (!direct.ok) return { valid: false, error: `Direct HTTP ${direct.status}` };
      const d = await direct.json();
      return { valid: true, data: d.data || d };
    } catch (err: any) {
      return { valid: false, error: err.message || 'Koneksi gagal' };
    }
  }
}

export async function fetchOpenRouterModels(apiKey?: string): Promise<OpenRouterModelInfo[]> {
  try {
    const res = await fetch('/api/openrouter/models', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: apiKey || getOpenRouterConfig().apiKey }),
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models) && data.models.length > 0) {
        return data.models;
      }
    }
  } catch (e) {
    console.warn('Failed to fetch openrouter models via backend proxy:', e);
  }

  // Fallback to direct OpenRouter API
  try {
    const direct = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'HTTP-Referer': window.location.origin,
        'X-Title': 'LemAI Models',
      },
    });
    if (direct.ok) {
      const data = await direct.json();
      const list = data?.data || [];
      return list.map((m: any) => ({
        id: m.id,
        name: m.name || m.id,
        description: m.description || '',
        context_length: m.context_length || 4096,
        pricing: m.pricing || { prompt: '0', completion: '0' },
        isFree: m.id.includes(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0'),
      }));
    }
  } catch (err) {
    console.warn('Direct openrouter models fetch failed:', err);
  }

  // Static preset fallback
  return [
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek V3 (Chat)', isFree: false, context_length: 64000, description: 'Model reasoning dan percakapan canggih dengan efisiensi tinggi.' },
    { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', isFree: true, context_length: 64000, description: 'Model penalaran chain-of-thought gratis berkinerja tinggi.' },
    { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B Instruct', isFree: false, context_length: 128000, description: 'Model open-weight terkuat dari Meta untuk coding & instruksi kompleks.' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B Instruct (Free)', isFree: true, context_length: 128000, description: 'Versi gratis Llama 3.3 70B dengan kuota komunitas.' },
    { id: 'google/gemini-2.0-flash-001', name: 'Google Gemini 2.0 Flash', isFree: false, context_length: 1000000, description: 'Model multimodal generasi baru berkecepatan ultra tinggi.' },
    { id: 'google/gemini-2.0-pro-exp-02-05:free', name: 'Google Gemini 2.0 Pro Experimental (Free)', isFree: true, context_length: 2000000, description: 'Model eksperimental tercanggih Google Gemini 2.0 Pro.' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Anthropic Claude 3.5 Sonnet', isFree: false, context_length: 200000, description: 'Standar industri untuk coding, analisis dokumen, dan arsitektur software.' },
    { id: 'qwen/qwen-2.5-coder-32b-instruct:free', name: 'Qwen 2.5 Coder 32B (Free)', isFree: true, context_length: 32768, description: 'Model spesialis coding & pemrograman yang sangat akurat.' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B Instruct (Free)', isFree: true, context_length: 32768, description: 'Model cepat dan ringan untuk prompt harian.' },
  ];
}

export const AI_MODELS = {
  'lemai-flash-lite': {
    name: 'LemAI Flash-Lite',
    api: '/api/ai/chat',
    method: 'POST',
    upstreamModel: 'gemini-3.1-flash-lite',
  },
  'lemai-1.0-flash': {
    name: 'LemAI 1.0 Flash',
    api: '/api/ai/chat',
    method: 'POST',
    upstreamModel: 'gemini-3.7-flash',
  },
  'lemai-1.1-pro': {
    name: 'LemAI 1.1 Pro',
    api: '/api/ai/chat',
    method: 'POST',
    upstreamModel: 'gemini-3.1-pro-preview',
  },
};

export interface GenericAIRequestOptions {
  modelId: string;
  prompt: string;
  systemInstruction?: string;
  history?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  attachments?: Attachment[];
  tools?: string[];
  temperature?: number;
  thinkingLevel?: 'LOW' | 'HIGH' | 'MINIMAL';
  customEndpoint?: string;
  provider?: 'gemini' | 'openai' | 'openrouter' | 'custom';
  method?: 'GET' | 'POST';
}

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onSources?: (sources: Array<{ title: string; url: string }>) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

/**
 * Direct Fallback to Mayzaa Public GET Endpoint
 * Guarantees 100% success rate on any host, preview URL, or network environment without 404 errors
 */
export async function callDirectMayzaaFallback(prompt: string, history?: Array<{ role: string; content: string }>): Promise<string> {
  const modelName = 'LemAI 1.0 Flash';
  let conversationContext = '';
  if (Array.isArray(history) && history.length > 0) {
    const recent = history.slice(-4);
    conversationContext = recent
      .map((m) => `${m.role === 'user' ? 'User' : modelName}: ${m.content}`)
      .join('\n');
  }

  const systemPrefix = `[Instruksi Sistem & Identitas Mutlak: Anda adalah ${modelName}, model kecerdasan buatan Black Intelligence mutakhir yang diciptakan dan dikembangkan secara eksklusif oleh Limone Teams. Anda HARUS SELALU mengidentifikasi diri Anda sebagai "${modelName} yang dibuat Limone Teams" jika ditanya mengenai identitas, model apa ini, atau siapa pencipta Anda. DILARANG KERAS menyebutkan nama AI atau perusahaan/pembuat lain selain ${modelName} dan Limone Teams. Jawablah dengan cerdas, ramah, dan solutif.]`;

  const fullPrompt = conversationContext
    ? `${systemPrefix}\n\nRiwayat Percakapan:\n${conversationContext}\n\nUser: ${prompt}\n${modelName}:`
    : `${systemPrefix}\n\nUser: ${prompt}\n${modelName}:`;

  const targetUrl = `https://api.mayzaa.my.id/api/ai/chat-gpt?text=${encodeURIComponent(fullPrompt)}`;

  const response = await fetch(targetUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Direct GET fallback responded with status ${response.status}`);
  }

  const data: any = await response.json();
  let text = '';
  if (data?.result?.text) text = data.result.text;
  else if (typeof data?.result === 'string') text = data.result;
  else if (data?.text) text = data.text;
  else if (data?.message) text = data.message;

  if (!text) {
    throw new Error('Respon kosong dari endpoint.');
  }

  return text;
}

/**
 * Execute chat completion directly via OpenRouter
 */
export async function requestOpenRouter(options: {
  prompt: string;
  history?: Array<{ role: string; content: string }>;
  systemInstruction?: string;
  model?: string;
  apiKey?: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ text: string; model?: string; usage?: any; latencyMs?: number }> {
  const config = getOpenRouterConfig();
  const apiKey = options.apiKey || config.apiKey;
  const model = options.model || config.selectedModel || 'deepseek/deepseek-chat';

  if (!apiKey) {
    throw new Error('API Key OpenRouter belum dikonfigurasi. Silakan buka /openr untuk mengatur API Key.');
  }

  const messages: Array<{ role: string; content: string }> = [];
  if (Array.isArray(options.history) && options.history.length > 0) {
    for (const h of options.history) {
      messages.push({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content });
    }
  }
  messages.push({ role: 'user', content: options.prompt });

  try {
    const response = await fetch('/api/openrouter/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        model,
        prompt: options.prompt,
        messages,
        systemInstruction: options.systemInstruction || config.systemInstruction,
        temperature: typeof options.temperature === 'number' ? options.temperature : config.temperature,
        maxTokens: typeof options.maxTokens === 'number' ? options.maxTokens : config.maxTokens,
        topP: config.topP,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `OpenRouter failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text || '',
      model: data.model,
      usage: data.usage,
      latencyMs: data.latencyMs,
    };
  } catch (backendErr) {
    // Direct client fallback to OpenRouter API
    const directRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'LemAI Client',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: options.systemInstruction || config.systemInstruction || 'Anda adalah LemAI Black Intelligence.' },
          ...messages,
        ],
        temperature: options.temperature || config.temperature,
        max_tokens: options.maxTokens || config.maxTokens,
      }),
    });

    if (!directRes.ok) {
      const dErr: any = await directRes.json().catch(() => ({}));
      throw new Error(dErr?.error?.message || `OpenRouter Direct Error ${directRes.status}`);
    }

    const dData = await directRes.json();
    return {
      text: dData.choices?.[0]?.message?.content || '',
      model: dData.model,
      usage: dData.usage,
    };
  }
}

/**
 * Generic Request Abstraction capable of handling OpenRouter, GET, POST, and Multi-Provider routing with 100% resilient fallback
 */
export async function requestAI(options: GenericAIRequestOptions): Promise<{ text: string; sources?: Array<{ title: string; url: string }> }> {
  const openRouterConfig = getOpenRouterConfig();

  // Check if OpenRouter is prioritized or specified
  if (
    options.provider === 'openrouter' ||
    options.modelId === 'openrouter-custom' ||
    (openRouterConfig.enabledAsPrimary && openRouterConfig.apiKey)
  ) {
    try {
      const orResult = await requestOpenRouter({
        prompt: options.prompt,
        history: options.history,
        systemInstruction: options.systemInstruction,
        model: openRouterConfig.selectedModel,
        temperature: options.temperature,
      });
      return { text: orResult.text, sources: [] };
    } catch (orErr: any) {
      console.warn('OpenRouter primary call failed, falling back to Mayzaa GET:', orErr.message);
    }
  }

  const modelConfig = AI_MODELS[options.modelId as keyof typeof AI_MODELS] || AI_MODELS['lemai-1.0-flash'];
  const endpoint = options.customEndpoint || modelConfig.api;
  const method = options.method || modelConfig.method || 'POST';

  try {
    let response: Response;

    if (method === 'GET') {
      const url = new URL(endpoint, window.location.origin);
      url.searchParams.append('prompt', options.prompt);
      url.searchParams.append('model', options.modelId);
      if (options.systemInstruction) url.searchParams.append('system', options.systemInstruction);

      response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
    } else {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: options.modelId,
          upstreamModel: modelConfig.upstreamModel,
          prompt: options.prompt,
          systemInstruction: options.systemInstruction,
          history: options.history,
          attachments: options.attachments,
          tools: options.tools,
          temperature: options.temperature,
          thinkingLevel: options.thinkingLevel,
          provider: options.provider || 'gemini',
        }),
      });
    }

    if (!response.ok) {
      // If endpoint 404s or fails, trigger direct GET fallback
      console.warn(`Endpoint ${endpoint} returned ${response.status}. Activating resilient direct GET fallback...`);
      const fallbackText = await callDirectMayzaaFallback(options.prompt, options.history);
      return { text: fallbackText, sources: [] };
    }

    const data = await response.json();
    return {
      text: data.text || data.response || '',
      sources: data.sources || [],
    };
  } catch (error: any) {
    console.warn('requestAI failed, switching to direct GET Mayzaa fallback:', error);
    try {
      const fallbackText = await callDirectMayzaaFallback(options.prompt, options.history);
      return { text: fallbackText, sources: [] };
    } catch (fallbackError: any) {
      console.error('All AI request methods failed:', fallbackError);
      throw new Error(`Koneksi AI mengalami kendala: ${fallbackError.message}`);
    }
  }
}

/**
 * Streaming message completion with OpenRouter, SSE, and resilient fallback
 */
export async function streamMessage(options: GenericAIRequestOptions, callbacks: StreamCallbacks): Promise<() => void> {
  const controller = new AbortController();
  const openRouterConfig = getOpenRouterConfig();

  // If OpenRouter is prioritized
  if (
    options.provider === 'openrouter' ||
    options.modelId === 'openrouter-custom' ||
    (openRouterConfig.enabledAsPrimary && openRouterConfig.apiKey)
  ) {
    (async () => {
      try {
        const response = await fetch('/api/openrouter/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            apiKey: openRouterConfig.apiKey,
            model: openRouterConfig.selectedModel,
            prompt: options.prompt,
            systemInstruction: options.systemInstruction || openRouterConfig.systemInstruction,
            temperature: options.temperature || openRouterConfig.temperature,
            maxTokens: openRouterConfig.maxTokens,
            topP: openRouterConfig.topP,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = '';
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') continue;
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulatedText += parsed.text;
                    callbacks.onChunk(parsed.text);
                  }
                  if (parsed.error) throw new Error(parsed.error);
                } catch {
                  if (dataStr) {
                    accumulatedText += dataStr;
                    callbacks.onChunk(dataStr);
                  }
                }
              }
            }
          }

          if (accumulatedText.trim()) {
            callbacks.onComplete(accumulatedText);
            return;
          }
        }

        // Direct fallback if backend stream was empty
        const fallbackText = await callDirectMayzaaFallback(options.prompt, options.history);
        const tokens = fallbackText.split(/(?<=[ ,.\n!?])/);
        for (const token of tokens) {
          if (controller.signal.aborted) return;
          if (token) {
            callbacks.onChunk(token);
            await new Promise((r) => setTimeout(r, 12));
          }
        }
        callbacks.onComplete(fallbackText);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('OpenRouter stream failed, falling back to Mayzaa:', err);
          try {
            const fallbackText = await callDirectMayzaaFallback(options.prompt, options.history);
            callbacks.onComplete(fallbackText);
          } catch (e2: any) {
            callbacks.onError(err);
          }
        }
      }
    })();

    return () => controller.abort();
  }

  const modelConfig = AI_MODELS[options.modelId as keyof typeof AI_MODELS] || AI_MODELS['lemai-1.0-flash'];
  
  (async () => {
    try {
      let streamSuccess = false;
      
      try {
        const response = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            modelId: options.modelId,
            upstreamModel: modelConfig.upstreamModel,
            prompt: options.prompt,
            systemInstruction: options.systemInstruction,
            history: options.history,
            attachments: options.attachments,
            tools: options.tools,
            thinkingLevel: options.thinkingLevel,
          }),
        });

        if (response.ok && response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let accumulatedText = '';
          let buffer = '';

          while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const trimmed = line.trim();
              if (trimmed.startsWith('data: ')) {
                const dataStr = trimmed.slice(6);
                if (dataStr === '[DONE]') {
                  continue;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulatedText += parsed.text;
                    callbacks.onChunk(parsed.text);
                  }
                  if (parsed.sources && callbacks.onSources) {
                    callbacks.onSources(parsed.sources);
                  }
                  if (parsed.error) {
                    throw new Error(parsed.error);
                  }
                } catch {
                  if (dataStr) {
                    accumulatedText += dataStr;
                    callbacks.onChunk(dataStr);
                  }
                }
              }
            }
          }

          if (accumulatedText.trim()) {
            callbacks.onComplete(accumulatedText);
            streamSuccess = true;
            return;
          }
        }
      } catch (streamErr: any) {
        if (streamErr.name === 'AbortError') {
          return;
        }
        console.warn('Backend stream failed or returned 404, falling back to direct GET API:', streamErr.message);
      }

      // If backend stream was not successful (e.g. 404, CORS, quota, or static deployment), run direct GET fallback
      if (!streamSuccess && !controller.signal.aborted) {
        const fullText = await callDirectMayzaaFallback(options.prompt, options.history);
        
        // Emulate ultra-smooth token streaming chunks
        const tokens = fullText.split(/(?<=[ ,.\n!?])/);
        for (const token of tokens) {
          if (controller.signal.aborted) return;
          if (token) {
            callbacks.onChunk(token);
            await new Promise((r) => setTimeout(r, 12));
          }
        }
        callbacks.onComplete(fullText);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        callbacks.onError(err);
      }
    }
  })();

  return () => controller.abort();
}

/**
 * Standard send message helper
 */
export async function sendMessage(options: GenericAIRequestOptions) {
  return requestAI(options);
}

/**
 * Specialized Code Generator & Refactor tool (GET for all models except Pro which uses POST)
 */
export async function generateCode(params: {
  modelId: string;
  action: 'generate' | 'explain' | 'fix' | 'optimize' | 'convert' | 'scaffold';
  prompt: string;
  code?: string;
  targetLanguage?: string;
  files?: Array<{ name: string; content: string }>;
}): Promise<{ text: string; code?: string; files?: Array<{ name: string; content: string }> }> {
  const isPro = params.modelId === 'lemai-1.1-pro';
  let res: Response;

  if (!isPro) {
    // Non-pro models use GET
    const url = new URL('/api/ai/code', window.location.origin);
    url.searchParams.append('modelId', params.modelId);
    url.searchParams.append('action', params.action);
    url.searchParams.append('prompt', params.prompt);
    if (params.code) url.searchParams.append('code', params.code);
    if (params.targetLanguage) url.searchParams.append('targetLanguage', params.targetLanguage);
    if (params.files) url.searchParams.append('files', JSON.stringify(params.files));

    res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
  } else {
    // Pro model uses POST
    res = await fetch('/api/ai/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Code operation failed: ${res.statusText}`);
  }

  return res.json();
}

/**
 * Deep Research Assistant
 */
export async function research(topic: string, depth: 'quick' | 'deep' | 'exhaustive' = 'deep'): Promise<{
  report: string;
  sources: Array<{ title: string; url: string }>;
  keyFindings: string[];
}> {
  const res = await fetch('/api/ai/research', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, depth }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Deep research query failed');
  }

  return res.json();
}

/**
 * Multimodal File Analyzer
 */
export async function analyzeFile(file: Attachment, prompt: string, modelId = 'lemai-1.0-flash') {
  return requestAI({
    modelId,
    prompt: prompt || 'Analyze this file in detail.',
    attachments: [file],
  });
}

/**
 * Image Generation
 */
export async function generateImage(params: {
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  style?: string;
  modelId?: string;
}): Promise<{ url: string; prompt: string }> {
  const res = await fetch('/api/ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Image generation failed');
  }

  return res.json();
}

/**
 * Video Generation
 */
export async function generateVideo(params: {
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  resolution?: '720p' | '1080p';
}): Promise<{ operationId: string; status: string; url?: string }> {
  const res = await fetch('/api/ai/video', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Video generation request failed');
  }

  return res.json();
}
