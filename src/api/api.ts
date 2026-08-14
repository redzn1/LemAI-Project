import { LemAIModel, Attachment } from '../types';

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
};

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
 * Generic Request Abstraction capable of handling GET, POST, and Multi-Provider routing
 */
export async function requestAI(options: GenericAIRequestOptions): Promise<{ text: string; sources?: Array<{ title: string; url: string }> }> {
  const modelConfig = AI_MODELS[options.modelId as keyof typeof AI_MODELS] || AI_MODELS['lemai-1.0-flash'];
  const endpoint = options.customEndpoint || modelConfig.api;
  const method = options.method || modelConfig.method || 'POST';

  try {
    let response: Response;

    if (method === 'GET') {
      // Endpoint with query parameter support
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
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `AI Request failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      text: data.text || data.response || '',
      sources: data.sources || [],
    };
  } catch (error: any) {
    console.error('requestAI error:', error);
    throw error;
  }
}

/**
 * Streaming message completion with Server-Sent Events / chunk stream reader
 */
export async function streamMessage(options: GenericAIRequestOptions, callbacks: StreamCallbacks): Promise<() => void> {
  const controller = new AbortController();
  const modelConfig = AI_MODELS[options.modelId as keyof typeof AI_MODELS] || AI_MODELS['lemai-1.0-flash'];
  
  (async () => {
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

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Stream failed with HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported on this response.');
      }

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
              // Plain text stream fallback
              if (dataStr) {
                accumulatedText += dataStr;
                callbacks.onChunk(dataStr);
              }
            }
          }
        }
      }

      callbacks.onComplete(accumulatedText);
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
