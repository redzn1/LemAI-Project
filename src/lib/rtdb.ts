import { getDatabase, ref, set, get, update, onValue, off, DatabaseReference } from 'firebase/database';
import { app, firebaseConfig } from '../config/firebase';
import { UserProfile, UserRole } from '../types';

// Initialize Realtime Database instance
export const rtdb = getDatabase(app, firebaseConfig.databaseURL);

export interface RTDBUserRecord {
  uid: string;
  email: string;
  displayName: string;
  username: string;
  bio?: string;
  photoURL?: string | null;
  provider: 'google' | 'password';
  role: UserRole;
  accessToken: string;
  tokensRemaining: number;
  tokensLimit: number;
  lastLoginAt: number;
  createdAt: number;
  status: 'active' | 'suspended';
}

export interface RTDBModelConfig {
  id: string;
  name: string;
  provider: 'gemini' | 'openrouter' | 'custom';
  category: 'reasoning' | 'coding' | 'vision' | 'chat' | 'fast' | 'custom';
  description: string;
  badge?: string;
  locked: boolean;
  enabled: boolean;
  systemInstruction?: string;
  contextLength?: number;
  pricing?: { prompt?: string; completion?: string };
  updatedAt?: number;
}

export interface ModuleModelSettings {
  chatModel: string;
  codingModel: string;
  visionModel: string;
  imageModel: string;
  audioModel: string;
  speechModel: string;
  videoModel: string;
  reasoningModel: string;
  customModel: string;
}

export const DEFAULT_MODULE_MODELS: ModuleModelSettings = {
  chatModel: 'lemai-1.0-flash',
  codingModel: 'lemai-1.0-flash',
  visionModel: 'lemai-1.0-flash',
  imageModel: 'imagen-3.0-generate-002',
  audioModel: 'gemini-2.5-flash',
  speechModel: 'speech-synthesis-v2',
  videoModel: 'veo-2.0-generate-001',
  reasoningModel: 'gemini-2.5-pro',
  customModel: 'openrouter/auto',
};

/**
 * Clean model ID to be a safe Firebase RTDB key (cannot contain '.', '#', '$', '[', or ']')
 */
export function sanitizeModelKey(modelId: string): string {
  return modelId.replace(/[.#$[\]/:]/g, '_');
}

/**
 * Synchronize user profile into RTDB at `users/{uid}`
 */
export async function syncUserToRTDB(
  uid: string,
  data: Partial<RTDBUserRecord>
): Promise<RTDBUserRecord | null> {
  if (!uid) return null;
  try {
    const userRef = ref(rtdb, `users/${uid}`);
    const snapshot = await get(userRef);
    const now = Date.now();

    if (snapshot.exists()) {
      const existing = snapshot.val() as RTDBUserRecord;
      const updated: Partial<RTDBUserRecord> = {
        ...data,
        lastLoginAt: now,
      };
      await update(userRef, updated);
      return { ...existing, ...updated };
    } else {
      const newRecord: RTDBUserRecord = {
        uid,
        email: data.email || '',
        displayName: data.displayName || data.username || 'User',
        username: data.username || 'user',
        bio: data.bio || '',
        photoURL: data.photoURL || null,
        provider: data.provider || 'password',
        role: data.role || (data.email === 'developer@limone.my.id' || data.email === 'tetaps132@gmail.com' ? 'developer' : 'user'),
        accessToken: data.accessToken || `lemai_${Math.random().toString(36).substring(2, 12)}`,
        tokensRemaining: data.tokensRemaining ?? 250000,
        tokensLimit: data.tokensLimit ?? 250000,
        lastLoginAt: now,
        createdAt: now,
        status: 'active',
      };
      await set(userRef, newRecord);
      return newRecord;
    }
  } catch (error) {
    console.warn('Firebase RTDB user sync warning:', error);
    return null;
  }
}

/**
 * Fetch User Record from RTDB by UID
 */
export async function getRTDBUser(uid: string): Promise<RTDBUserRecord | null> {
  if (!uid) return null;
  try {
    const userRef = ref(rtdb, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      return snapshot.val() as RTDBUserRecord;
    }
    return null;
  } catch (error) {
    console.warn('Failed to get user from RTDB:', error);
    return null;
  }
}

/**
 * Fetch all registered users from RTDB (Admin only)
 */
export async function getAllRTDBUsers(): Promise<RTDBUserRecord[]> {
  try {
    const usersRef = ref(rtdb, 'users');
    const snapshot = await get(usersRef);
    if (snapshot.exists()) {
      const val = snapshot.val();
      return Object.values(val) as RTDBUserRecord[];
    }
    return [];
  } catch (error) {
    console.warn('Failed to fetch RTDB users list:', error);
    return [];
  }
}

/**
 * Update user role in RTDB
 */
export async function updateRTDBUserRole(uid: string, role: UserRole): Promise<boolean> {
  try {
    const userRef = ref(rtdb, `users/${uid}`);
    await update(userRef, { role });
    return true;
  } catch (error) {
    console.error('Failed to update RTDB user role:', error);
    return false;
  }
}

/**
 * Fetch managed models configuration from RTDB
 */
export async function getRTDBModels(): Promise<Record<string, RTDBModelConfig>> {
  try {
    const modelsRef = ref(rtdb, 'models');
    const snapshot = await get(modelsRef);
    if (snapshot.exists()) {
      return snapshot.val() as Record<string, RTDBModelConfig>;
    }
    return {};
  } catch (error) {
    console.warn('Failed to fetch RTDB models:', error);
    return {};
  }
}

/**
 * Set model lock/unlock status in RTDB
 */
export async function setRTDBModelLocked(modelId: string, locked: boolean): Promise<boolean> {
  try {
    const safeKey = sanitizeModelKey(modelId);
    const modelRef = ref(rtdb, `models/${safeKey}`);
    await update(modelRef, { 
      id: modelId,
      locked, 
      updatedAt: Date.now() 
    });
    return true;
  } catch (error) {
    console.error('Failed to set model locked status in RTDB:', error);
    return false;
  }
}

/**
 * Save or update a Model definition in RTDB
 */
export async function saveRTDBModel(model: RTDBModelConfig): Promise<boolean> {
  try {
    const safeKey = sanitizeModelKey(model.id);
    const modelRef = ref(rtdb, `models/${safeKey}`);
    await set(modelRef, {
      ...model,
      updatedAt: Date.now(),
    });
    return true;
  } catch (error) {
    console.error('Failed to save RTDB model:', error);
    return false;
  }
}

/**
 * Delete a model from RTDB
 */
export async function deleteRTDBModel(modelId: string): Promise<boolean> {
  try {
    const safeKey = sanitizeModelKey(modelId);
    const modelRef = ref(rtdb, `models/${safeKey}`);
    await set(modelRef, null);
    return true;
  } catch (error) {
    console.error('Failed to delete RTDB model:', error);
    return false;
  }
}

/**
 * Get module model settings from RTDB (fallback to localStorage or DEFAULT_MODULE_MODELS)
 */
export async function getModuleModelSettings(): Promise<ModuleModelSettings> {
  try {
    const settingsRef = ref(rtdb, 'settings/modules');
    const snapshot = await get(settingsRef);
    if (snapshot.exists()) {
      return { ...DEFAULT_MODULE_MODELS, ...snapshot.val() };
    }
  } catch (e) {
    console.warn('RTDB settings fetch failed, checking localStorage');
  }

  try {
    const local = localStorage.getItem('lemai_module_model_settings_v1');
    if (local) {
      return { ...DEFAULT_MODULE_MODELS, ...JSON.parse(local) };
    }
  } catch {}

  return DEFAULT_MODULE_MODELS;
}

/**
 * Save module model settings to RTDB & localStorage
 */
export async function saveModuleModelSettings(settings: ModuleModelSettings): Promise<boolean> {
  try {
    localStorage.setItem('lemai_module_model_settings_v1', JSON.stringify(settings));
    const settingsRef = ref(rtdb, 'settings/modules');
    await set(settingsRef, settings);
    return true;
  } catch (error) {
    console.warn('Failed to save module model settings to RTDB:', error);
    return false;
  }
}

/**
 * Save system personality for a module/model in RTDB (Admin feature)
 */
export async function saveModulePersonality(moduleId: string, personalityPrompt: string): Promise<boolean> {
  try {
    const personalityRef = ref(rtdb, `settings/personalities/${moduleId}`);
    await set(personalityRef, {
      prompt: personalityPrompt,
      updatedAt: Date.now()
    });
    return true;
  } catch (error) {
    console.error('Failed to save personality in RTDB:', error);
    return false;
  }
}

/**
 * Get system personality for a module/model from RTDB
 */
export async function getModulePersonality(moduleId: string): Promise<string | null> {
  try {
    const personalityRef = ref(rtdb, `settings/personalities/${moduleId}`);
    const snapshot = await get(personalityRef);
    if (snapshot.exists()) {
      return snapshot.val()?.prompt || null;
    }
    return null;
  } catch (error) {
    console.warn('Failed to fetch personality:', error);
    return null;
  }
}
