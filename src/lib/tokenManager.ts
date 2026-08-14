import { UserProfile, UserRole, TokenStatus } from '../types';

export const FREE_USER_TOKEN_LIMIT = 500000; // 500K tokens
export const RESET_CYCLE_DAYS = 7;
export const RESET_CYCLE_MS = RESET_CYCLE_DAYS * 24 * 60 * 60 * 1000;

export const DEVELOPER_EMAIL = 'developer@limone.my.id';

const STORAGE_KEY_TOKEN_PREFIX = 'lemai_tokens_v2_';
const STORAGE_KEY_USERS_REGISTRY = 'lemai_users_registry_v2';
const STORAGE_KEY_ADMINS_LIST = 'lemai_admins_list_v2';

export interface UserTokenRecord {
  email: string;
  username: string;
  role: UserRole;
  tokensRemaining: number;
  tokensLimit: number;
  lastResetTimestamp: number;
  totalTokensUsed: number;
  updatedAt: number;
}

/**
 * Calculate token cost based on character length
 * Rule: 5 characters/numbers/symbols per 2 tokens
 */
export function calculateTokensFromText(text: string): number {
  if (!text) return 0;
  const len = text.length;
  // 5 chars = 2 tokens -> 1 char = 0.4 tokens
  return Math.max(1, Math.ceil((len / 5) * 2));
}

/**
 * Formats token count nicely (e.g. 485.5K or 500,000)
 */
export function formatTokenDisplay(tokens: number): string {
  if (tokens === Infinity || tokens >= 999999999) return '∞ Unlimited';
  if (tokens >= 1000000) return `${(tokens / 1000000).toFixed(2)}M`;
  if (tokens >= 1000) return `${(tokens / 1000).toFixed(1)}K`;
  return tokens.toLocaleString();
}

/**
 * Checks if an email belongs to the Developer
 */
export function isDeveloperAccount(email: string): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean === DEVELOPER_EMAIL.toLowerCase() || clean === 'developer' || clean.startsWith('developer@');
}

/**
 * Checks if an email belongs to an Admin
 */
export function isAdminAccount(email: string): boolean {
  if (!email) return false;
  if (isDeveloperAccount(email)) return true;
  try {
    const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMINS_LIST) || '[]');
    return list.includes(email.trim().toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Get or initialize token record for a user
 */
export function getUserTokenRecord(email: string, username?: string): UserTokenRecord {
  const cleanEmail = email ? email.trim().toLowerCase() : 'guest@limone.my.id';
  const isDev = isDeveloperAccount(cleanEmail);
  const isAdmin = isAdminAccount(cleanEmail);
  
  const role: UserRole = isDev ? 'developer' : isAdmin ? 'admin' : 'user';
  const key = STORAGE_KEY_TOKEN_PREFIX + cleanEmail;
  const now = Date.now();

  let record: UserTokenRecord | null = null;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      record = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading token record:', e);
  }

  // If no existing record or weekly cycle expired, initialize / reset
  if (!record) {
    record = {
      email: cleanEmail,
      username: username || cleanEmail.split('@')[0],
      role,
      tokensRemaining: isDev ? Infinity : FREE_USER_TOKEN_LIMIT,
      tokensLimit: FREE_USER_TOKEN_LIMIT,
      lastResetTimestamp: now,
      totalTokensUsed: 0,
      updatedAt: now,
    };
  } else {
    // Check for 7-day weekly reset
    const elapsed = now - (record.lastResetTimestamp || now);
    if (!isDev && elapsed >= RESET_CYCLE_MS) {
      record.tokensRemaining = record.tokensLimit || FREE_USER_TOKEN_LIMIT;
      record.lastResetTimestamp = now;
      record.updatedAt = now;
    }
    // Maintain role consistency
    record.role = role;
    if (isDev) {
      record.tokensRemaining = Infinity;
    }
  }

  // Persist record & save in registry
  saveUserTokenRecord(record);
  return record;
}

/**
 * Save user token record
 */
export function saveUserTokenRecord(record: UserTokenRecord): void {
  try {
    const key = STORAGE_KEY_TOKEN_PREFIX + record.email.toLowerCase();
    localStorage.setItem(key, JSON.stringify(record));

    // Register user in users registry for Admin Panel lookup
    const registryStr = localStorage.getItem(STORAGE_KEY_USERS_REGISTRY);
    const registry: Record<string, { email: string; username: string; role: UserRole; tokens: number; updatedAt: number }> = registryStr ? JSON.parse(registryStr) : {};
    
    registry[record.email.toLowerCase()] = {
      email: record.email,
      username: record.username,
      role: record.role,
      tokens: record.tokensRemaining === Infinity ? 999999999 : record.tokensRemaining,
      updatedAt: record.updatedAt,
    };

    localStorage.setItem(STORAGE_KEY_USERS_REGISTRY, JSON.stringify(registry));
  } catch (e) {
    console.error('Error saving user token record:', e);
  }
}

/**
 * Get comprehensive Token Status for the active user
 */
export function getTokenStatus(email: string): TokenStatus {
  const record = getUserTokenRecord(email);
  const isDev = record.role === 'developer';
  const now = Date.now();
  const nextReset = (record.lastResetTimestamp || now) + RESET_CYCLE_MS;
  const remainingMs = Math.max(0, nextReset - now);
  const daysUntilReset = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  const nextResetDate = new Date(nextReset).toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });

  const hasQuota = isDev || record.tokensRemaining > 0;

  return {
    tokensRemaining: isDev ? Infinity : Math.max(0, record.tokensRemaining),
    tokensLimit: record.tokensLimit || FREE_USER_TOKEN_LIMIT,
    isUnlimited: isDev,
    daysUntilReset,
    nextResetDate,
    hasQuota,
    role: record.role,
  };
}

/**
 * Deduct tokens after an AI response is generated
 */
export function deductTokensForResponse(
  email: string,
  responseText: string
): { success: boolean; deducted: number; tokensRemaining: number; hasQuota: boolean } {
  const cleanEmail = email ? email.trim().toLowerCase() : 'guest@limone.my.id';
  const record = getUserTokenRecord(cleanEmail);

  if (record.role === 'developer') {
    return {
      success: true,
      deducted: 0,
      tokensRemaining: Infinity,
      hasQuota: true,
    };
  }

  const tokenCost = calculateTokensFromText(responseText);
  record.tokensRemaining = Math.max(0, record.tokensRemaining - tokenCost);
  record.totalTokensUsed = (record.totalTokensUsed || 0) + tokenCost;
  record.updatedAt = Date.now();

  saveUserTokenRecord(record);

  return {
    success: true,
    deducted: tokenCost,
    tokensRemaining: record.tokensRemaining,
    hasQuota: record.tokensRemaining > 0,
  };
}

/**
 * Get all registered users for Admin Panel
 */
export function getAllRegisteredUsers(): UserTokenRecord[] {
  try {
    const registryStr = localStorage.getItem(STORAGE_KEY_USERS_REGISTRY);
    if (!registryStr) return [];
    const registry = JSON.parse(registryStr);
    const emails = Object.keys(registry);
    return emails.map((email) => getUserTokenRecord(email, registry[email].username));
  } catch (e) {
    console.error('Error listing registered users:', e);
    return [];
  }
}

// ==========================================
// ADMIN PANEL ACTIONS
// ==========================================

export interface AdminActionResult {
  success: boolean;
  message: string;
  record?: UserTokenRecord;
}

/**
 * 1. Add Token to User
 */
export function adminAddToken(targetEmail: string, amount: number, callerRole: UserRole): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetEmail) return { success: false, message: 'Email user target wajib diisi.' };
  if (!amount || amount <= 0) return { success: false, message: 'Jumlah token harus lebih dari 0.' };

  const record = getUserTokenRecord(targetEmail);
  if (record.role === 'developer') {
    return { success: true, message: 'Akun Developer selalu memiliki Token Unlimited (∞).', record };
  }

  record.tokensRemaining = (record.tokensRemaining || 0) + amount;
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Berhasil menambahkan ${amount.toLocaleString()} Token untuk ${targetEmail}. Saldo baru: ${record.tokensRemaining.toLocaleString()} Token.`,
    record,
  };
}

/**
 * 2. Reduce Token from User
 */
export function adminReduceToken(targetEmail: string, amount: number, callerRole: UserRole): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetEmail) return { success: false, message: 'Email user target wajib diisi.' };
  if (!amount || amount <= 0) return { success: false, message: 'Jumlah token harus lebih dari 0.' };

  const record = getUserTokenRecord(targetEmail);
  if (record.role === 'developer') {
    return { success: false, message: 'Tidak dapat memotong token akun Developer.' };
  }

  record.tokensRemaining = Math.max(0, (record.tokensRemaining || 0) - amount);
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Berhasil memotong ${amount.toLocaleString()} Token dari ${targetEmail}. Saldo tersisa: ${record.tokensRemaining.toLocaleString()} Token.`,
    record,
  };
}

/**
 * 3. Set Token for User
 */
export function adminSetToken(targetEmail: string, amount: number, callerRole: UserRole): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetEmail) return { success: false, message: 'Email user target wajib diisi.' };
  if (amount < 0) return { success: false, message: 'Jumlah token tidak boleh negatif.' };

  const record = getUserTokenRecord(targetEmail);
  if (record.role === 'developer') {
    return { success: true, message: 'Akun Developer selalu Unlimited (∞).', record };
  }

  record.tokensRemaining = amount;
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Saldo token untuk ${targetEmail} berhasil diset menjadi ${amount.toLocaleString()} Token.`,
    record,
  };
}

/**
 * 4. Remove / Reset Token for User
 */
export function adminRemoveToken(targetEmail: string, callerRole: UserRole): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetEmail) return { success: false, message: 'Email user target wajib diisi.' };

  const record = getUserTokenRecord(targetEmail);
  if (record.role === 'developer') {
    return { success: false, message: 'Tidak dapat menghapus token akun Developer.' };
  }

  record.tokensRemaining = 0;
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Token untuk ${targetEmail} berhasil di-reset menjadi 0 Token.`,
    record,
  };
}

/**
 * 5. Set Admin (Developer ONLY)
 */
export function adminSetAdminRole(targetEmail: string, callerRole: UserRole): AdminActionResult {
  if (callerRole !== 'developer') {
    return { 
      success: false, 
      message: 'Akses Ditolak: Hanya Developer (developer@limone.my.id) yang memiliki hak untuk menetapkan Admin.' 
    };
  }
  if (!targetEmail) return { success: false, message: 'Email user target wajib diisi.' };
  const cleanEmail = targetEmail.trim().toLowerCase();

  try {
    const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMINS_LIST) || '[]');
    if (!list.includes(cleanEmail)) {
      list.push(cleanEmail);
      localStorage.setItem(STORAGE_KEY_ADMINS_LIST, JSON.stringify(list));
    }

    const record = getUserTokenRecord(cleanEmail);
    record.role = 'admin';
    record.updatedAt = Date.now();
    saveUserTokenRecord(record);

    return {
      success: true,
      message: `User ${targetEmail} berhasil ditetapkan sebagai Admin!`,
      record,
    };
  } catch (e: any) {
    return { success: false, message: `Gagal menetapkan admin: ${e.message}` };
  }
}

/**
 * 6. Remove Admin (Developer ONLY)
 */
export function adminRemoveAdminRole(targetEmail: string, callerRole: UserRole): AdminActionResult {
  if (callerRole !== 'developer') {
    return { 
      success: false, 
      message: 'Akses Ditolak: Hanya Developer (developer@limone.my.id) yang memiliki hak untuk mencabut status Admin.' 
    };
  }
  if (!targetEmail) return { success: false, message: 'Email user target wajib diisi.' };
  const cleanEmail = targetEmail.trim().toLowerCase();

  if (isDeveloperAccount(cleanEmail)) {
    return { success: false, message: 'Tidak dapat mencabut hak Developer utama.' };
  }

  try {
    const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMINS_LIST) || '[]');
    const updatedList = list.filter((e) => e !== cleanEmail);
    localStorage.setItem(STORAGE_KEY_ADMINS_LIST, JSON.stringify(updatedList));

    const record = getUserTokenRecord(cleanEmail);
    record.role = 'user';
    record.updatedAt = Date.now();
    saveUserTokenRecord(record);

    return {
      success: true,
      message: `Status Admin untuk ${targetEmail} berhasil dicabut. Akun kembali menjadi user biasa.`,
      record,
    };
  } catch (e: any) {
    return { success: false, message: `Gagal mencabut status admin: ${e.message}` };
  }
}
