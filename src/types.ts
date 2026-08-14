export type ActiveTool = 'chat' | 'coding' | 'research' | 'canvas' | 'image' | 'video' | 'settings' | 'note';

export type SystemModuleType = 'image' | 'video' | 'research' | 'canvas';

export interface LemAIModel {
  id: string;
  name: string;
  description: string;
  badge: string;
  iconType: 'flash-lite' | 'flash' | 'pro';
  capabilities: ('chat' | 'coding' | 'vision' | 'research' | 'canvas')[];
  enabled: boolean;
  isAvailable?: boolean;
  isPaid?: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  type: 'image' | 'file' | 'code';
  mimeType?: string;
  url?: string;
  size?: number;
  content?: string;
  base64?: string;
}

export interface ParsedCodeBlock {
  id: string;
  language: string;
  code: string;
  isPreviewable: boolean;
  filename: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  modelId?: string;
  attachments?: Attachment[];
  type?: 'text' | 'code' | 'mixed';
  codeBlocks?: ParsedCodeBlock[];
  status?: 'pending' | 'streaming' | 'complete' | 'error';
  error?: string;
  sources?: { title: string; url: string }[];
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
  modelId: string;
  pinned?: boolean;
}

export interface CodingFile {
  id: string;
  name: string;
  language: string;
  content: string;
  isEntry?: boolean;
  type?: 'file' | 'folder';
  folderId?: string | null;
  path?: string;
}

export interface CodingProject {
  id: string;
  title: string;
  description: string;
  files: CodingFile[];
  activeFileId: string;
  createdAt: number;
  updatedAt: number;
}

export type UserRole = 'developer' | 'admin' | 'user';

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  displayName: string;
  bio?: string;
  photoURL?: string;
  provider: 'google' | 'password';
  role?: UserRole;
  tokensRemaining?: number;
  tokensLimit?: number;
  lastResetTimestamp?: number;
  createdAt?: number;
}

export interface TokenStatus {
  tokensRemaining: number;
  tokensLimit: number;
  isUnlimited: boolean;
  daysUntilReset: number;
  nextResetDate: string;
  hasQuota: boolean;
  role: UserRole;
}

export interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  aspectRatio: string;
  createdAt: number;
  model: string;
}

export interface GeneratedVideo {
  id: string;
  prompt: string;
  url?: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
  aspectRatio: string;
  createdAt: number;
}
