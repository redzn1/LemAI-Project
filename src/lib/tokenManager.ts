import { UserProfile, UserRole, TokenStatus } from '../types';

export const FREE_USER_TOKEN_LIMIT = 500000; // 500K tokens
export const RESET_CYCLE_DAYS = 7;
export const RESET_CYCLE_MS = RESET_CYCLE_DAYS * 24 * 60 * 60 * 1000;

export const DEVELOPER_EMAIL = 'developer@limone.my.id';
export const DEVELOPER_TOKEN = 'lemai_root_developer_master';

const STORAGE_KEY_TOKEN_PREFIX = 'lemai_tokens_v2_';
const STORAGE_KEY_TOKEN_BY_TOKEN_PREFIX = 'lemai_by_token_';
const STORAGE_KEY_USERS_REGISTRY = 'lemai_users_registry_v2';
const STORAGE_KEY_ADMIN_TOKENS = 'lemai_admin_tokens_v2';
const STORAGE_KEY_ADMINS_LIST = 'lemai_admins_list_v2';
const STORAGE_KEY_DEV_TOKENS = 'lemai_dev_tokens_v2';
const STORAGE_KEY_DEV_EMAILS = 'lemai_dev_emails_v2';

export interface UserTokenRecord {
  email: string;
  username: string;
  role: UserRole;
  accessToken: string;
  tokensRemaining: number;
  tokensLimit: number;
  lastResetTimestamp: number;
  totalTokensUsed: number;
  updatedAt: number;
  provider?: 'password' | 'google' | 'guest';
}

/**
 * Generate unique access token in format: lemai_ + 10 random alphanumeric characters
 */
export function generateUserAccessToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let rand = '';
  for (let i = 0; i < 10; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `lemai_${rand}`;
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
 * Checks if an identifier (email or token) belongs to a Developer (Root or Assigned)
 */
export function isDeveloperAccount(identifier: string, token?: string): boolean {
  if (!identifier && !token) return false;
  const cleanId = identifier ? identifier.trim().toLowerCase() : '';
  const cleanTok = token ? token.trim() : '';

  // 1. Root Developer constants
  if (
    cleanId === DEVELOPER_EMAIL.toLowerCase() ||
    cleanId === 'developer' ||
    cleanId.startsWith('developer@') ||
    cleanId === DEVELOPER_TOKEN.toLowerCase() ||
    cleanTok === DEVELOPER_TOKEN
  ) {
    return true;
  }

  // 2. Check dynamic Developer Tokens list
  try {
    const devTokens: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_DEV_TOKENS) || '[]');
    if (devTokens.includes(cleanTok) || devTokens.includes(cleanId)) {
      return true;
    }
  } catch {}

  // 3. Check dynamic Developer Emails list
  try {
    const devEmails: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_DEV_EMAILS) || '[]');
    if (devEmails.includes(cleanId)) {
      return true;
    }
  } catch {}

  return false;
}

/**
 * Checks if an Access Token has Admin privileges
 */
export function isAdminToken(token: string): boolean {
  if (!token) return false;
  const cleanToken = token.trim();
  if (cleanToken === DEVELOPER_TOKEN) return true;
  try {
    const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMIN_TOKENS) || '[]');
    return list.includes(cleanToken);
  } catch {
    return false;
  }
}

/**
 * Checks if an email belongs to an Admin (either via email list or token list)
 */
export function isAdminAccount(email: string, token?: string): boolean {
  if (!email && !token) return false;
  if (isDeveloperAccount(email) || (token && isDeveloperAccount(token))) return true;
  if (token && isAdminToken(token)) return true;

  try {
    const list: string[] = JSON.parse(localStorage.getItem(STORAGE_KEY_ADMINS_LIST) || '[]');
    return list.includes(email.trim().toLowerCase());
  } catch {
    return false;
  }
}

/**
 * Lookup user token record by Access Token (lemai_xxxxxxxxxx)
 */
export function getUserByAccessToken(token: string): UserTokenRecord | null {
  if (!token) return null;
  const cleanToken = token.trim();

  // 1. Direct token storage lookup
  try {
    const direct = localStorage.getItem(STORAGE_KEY_TOKEN_BY_TOKEN_PREFIX + cleanToken);
    if (direct) {
      return JSON.parse(direct);
    }
  } catch (e) {
    console.error('Error reading token direct:', e);
  }

  // 2. Scan users registry
  try {
    const registryStr = localStorage.getItem(STORAGE_KEY_USERS_REGISTRY);
    if (registryStr) {
      const registry = JSON.parse(registryStr);
      for (const email of Object.keys(registry)) {
        const item = registry[email];
        if (item.accessToken === cleanToken) {
          return getUserTokenRecord(email, item.username);
        }
      }
    }
  } catch (e) {
    console.error('Error scanning registry for token:', e);
  }

  return null;
}

/**
 * Find user token record by either Access Token, Email, or Username
 */
export function findUserByTokenOrEmail(identifier: string): UserTokenRecord | null {
  if (!identifier) return null;
  const clean = identifier.trim();

  // If starts with lemai_ or looks like an access token
  if (clean.startsWith('lemai_')) {
    const byToken = getUserByAccessToken(clean);
    if (byToken) return byToken;
  }

  // Check direct email lookup
  if (clean.includes('@')) {
    return getUserTokenRecord(clean);
  }

  // Check registry by username or email
  const allUsers = getAllRegisteredUsers();
  const match = allUsers.find(
    (u) =>
      u.accessToken.toLowerCase() === clean.toLowerCase() ||
      u.email.toLowerCase() === clean.toLowerCase() ||
      u.username.toLowerCase() === clean.toLowerCase()
  );
  if (match) return match;

  // Fallback as new email record
  return getUserTokenRecord(clean);
}

/**
 * Get or initialize token record for a user (Supports Google Auth, Email Auth, and Guests)
 */
export function getUserTokenRecord(
  email: string,
  username?: string,
  provider?: 'password' | 'google' | 'guest'
): UserTokenRecord {
  const cleanEmail = email ? email.trim().toLowerCase() : 'guest@limone.my.id';
  const isDev = isDeveloperAccount(cleanEmail);
  const now = Date.now();

  const key = STORAGE_KEY_TOKEN_PREFIX + cleanEmail;
  let record: UserTokenRecord | null = null;

  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      record = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading token record:', e);
  }

  // Determine role based on token & email
  let currentToken = record?.accessToken || (isDev ? DEVELOPER_TOKEN : generateUserAccessToken());
  const isAdmin = isAdminAccount(cleanEmail, currentToken);
  const role: UserRole = isDev ? 'developer' : isAdmin ? 'admin' : record?.role || 'user';

  // If no existing record, initialize
  if (!record) {
    record = {
      email: cleanEmail,
      username: username || cleanEmail.split('@')[0] || 'user',
      role,
      accessToken: currentToken,
      tokensRemaining: isDev ? Infinity : FREE_USER_TOKEN_LIMIT,
      tokensLimit: FREE_USER_TOKEN_LIMIT,
      lastResetTimestamp: now,
      totalTokensUsed: 0,
      updatedAt: now,
      provider: provider || (cleanEmail.includes('@gmail.com') ? 'google' : 'password'),
    };
  } else {
    // Ensure accessToken exists on older records
    if (!record.accessToken) {
      record.accessToken = isDev ? DEVELOPER_TOKEN : generateUserAccessToken();
    }
    // Check for 7-day weekly reset
    const elapsed = now - (record.lastResetTimestamp || now);
    if (!isDev && elapsed >= RESET_CYCLE_MS) {
      record.tokensRemaining = record.tokensLimit || FREE_USER_TOKEN_LIMIT;
      record.lastResetTimestamp = now;
      record.updatedAt = now;
    }
    // Update role
    record.role = role;
    if (isDev) {
      record.tokensRemaining = Infinity;
    }
    if (provider) {
      record.provider = provider;
    }
  }

  // Persist record & save in registry
  saveUserTokenRecord(record);
  return record;
}

/**
 * Regenerate Access Token for a user
 */
export function regenerateUserAccessToken(email: string): string {
  const cleanEmail = email ? email.trim().toLowerCase() : 'guest@limone.my.id';
  const record = getUserTokenRecord(cleanEmail);
  const newToken = isDeveloperAccount(cleanEmail) ? DEVELOPER_TOKEN : generateUserAccessToken();
  
  // Remove old token pointer if exists
  if (record.accessToken) {
    try {
      localStorage.removeItem(STORAGE_KEY_TOKEN_BY_TOKEN_PREFIX + record.accessToken);
    } catch {}
  }

  record.accessToken = newToken;
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);
  return newToken;
}

/**
 * Save user token record (indexed by email and by accessToken)
 */
export function saveUserTokenRecord(record: UserTokenRecord): void {
  try {
    const cleanEmail = record.email.toLowerCase();
    const key = STORAGE_KEY_TOKEN_PREFIX + cleanEmail;
    localStorage.setItem(key, JSON.stringify(record));

    // Also index by Access Token for instant token-based lookups
    if (record.accessToken) {
      localStorage.setItem(
        STORAGE_KEY_TOKEN_BY_TOKEN_PREFIX + record.accessToken,
        JSON.stringify(record)
      );
    }

    // Register user in users registry for Admin Panel lookup
    const registryStr = localStorage.getItem(STORAGE_KEY_USERS_REGISTRY);
    const registry: Record<
      string,
      {
        email: string;
        username: string;
        role: UserRole;
        accessToken: string;
        tokens: number;
        updatedAt: number;
        provider?: string;
      }
    > = registryStr ? JSON.parse(registryStr) : {};

    registry[cleanEmail] = {
      email: record.email,
      username: record.username,
      role: record.role,
      accessToken: record.accessToken,
      tokens: record.tokensRemaining === Infinity ? 999999999 : record.tokensRemaining,
      updatedAt: record.updatedAt,
      provider: record.provider,
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
 * Get all registered users for Admin Panel (Both Google and Email Auth users)
 */
export function getAllRegisteredUsers(): UserTokenRecord[] {
  try {
    const registryStr = localStorage.getItem(STORAGE_KEY_USERS_REGISTRY);
    if (!registryStr) return [];
    const registry = JSON.parse(registryStr);
    const emails = Object.keys(registry);
    return emails.map((email) => {
      const item = registry[email];
      return getUserTokenRecord(email, item.username, item.provider as any);
    });
  } catch (e) {
    console.error('Error listing registered users:', e);
    return [];
  }
}

// ==========================================
// TOKEN & ROLE MANAGEMENT BY ACCESS TOKEN (lemai_...)
// ==========================================

export interface AdminActionResult {
  success: boolean;
  message: string;
  record?: UserTokenRecord;
}

/**
 * 1. Add Token to User by Access Token or Email
 */
export function adminAddTokenByToken(
  targetTokenOrId: string,
  amount: number,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target wajib diisi.' };
  }
  if (!amount || amount <= 0) {
    return { success: false, message: 'Jumlah token harus lebih dari 0.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  if (record.role === 'developer') {
    return { success: true, message: 'Akun Developer selalu memiliki Token Unlimited (∞).', record };
  }

  record.tokensRemaining = (record.tokensRemaining || 0) + amount;
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Berhasil menambahkan ${amount.toLocaleString()} Token untuk token ${record.accessToken} (${record.email}). Saldo: ${record.tokensRemaining.toLocaleString()} Token.`,
    record,
  };
}

/**
 * 2. Reduce Token from User by Access Token or Email
 */
export function adminReduceTokenByToken(
  targetTokenOrId: string,
  amount: number,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target wajib diisi.' };
  }
  if (!amount || amount <= 0) {
    return { success: false, message: 'Jumlah token harus lebih dari 0.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  if (record.role === 'developer') {
    return { success: false, message: 'Tidak dapat memotong token akun Developer.' };
  }

  record.tokensRemaining = Math.max(0, (record.tokensRemaining || 0) - amount);
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Berhasil memotong ${amount.toLocaleString()} Token dari token ${record.accessToken} (${record.email}). Sisa: ${record.tokensRemaining.toLocaleString()} Token.`,
    record,
  };
}

/**
 * 3. Set Token for User by Access Token or Email
 */
export function adminSetTokenByToken(
  targetTokenOrId: string,
  amount: number,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target wajib diisi.' };
  }
  if (amount < 0) {
    return { success: false, message: 'Jumlah token tidak boleh negatif.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  if (record.role === 'developer') {
    return { success: true, message: 'Akun Developer selalu Unlimited (∞).', record };
  }

  record.tokensRemaining = amount;
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Saldo token untuk ${record.accessToken} (${record.email}) berhasil diset menjadi ${amount.toLocaleString()} Token.`,
    record,
  };
}

/**
 * 4. Remove / Reset Token for User by Access Token or Email
 */
export function adminRemoveTokenByToken(
  targetTokenOrId: string,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer' && callerRole !== 'admin') {
    return { success: false, message: 'Akses ditolak. Anda bukan Admin atau Developer.' };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target wajib diisi.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  if (record.role === 'developer') {
    return { success: false, message: 'Tidak dapat menghapus token akun Developer.' };
  }

  record.tokensRemaining = 0;
  record.updatedAt = Date.now();
  saveUserTokenRecord(record);

  return {
    success: true,
    message: `Token untuk ${record.accessToken} (${record.email}) berhasil di-reset menjadi 0 Token.`,
    record,
  };
}

/**
 * 5. Set Admin Role by Access Token (Developer ONLY)
 */
export function adminSetAdminRoleByToken(
  targetTokenOrId: string,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer') {
    return {
      success: false,
      message: 'Akses Ditolak: Hanya Developer utama yang memiliki hak untuk menetapkan Admin.',
    };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target (lemai_...) wajib diisi.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  if (record.role === 'developer') {
    return { success: false, message: 'Akun ini sudah merupakan Root Developer.' };
  }

  try {
    // 1. Add Access Token to Admin Tokens list
    const adminTokens: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_ADMIN_TOKENS) || '[]'
    );
    if (!adminTokens.includes(record.accessToken)) {
      adminTokens.push(record.accessToken);
      localStorage.setItem(STORAGE_KEY_ADMIN_TOKENS, JSON.stringify(adminTokens));
    }

    // 2. Add Email to Admin Emails list for backward compatibility
    const adminEmails: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_ADMINS_LIST) || '[]'
    );
    if (!adminEmails.includes(record.email.toLowerCase())) {
      adminEmails.push(record.email.toLowerCase());
      localStorage.setItem(STORAGE_KEY_ADMINS_LIST, JSON.stringify(adminEmails));
    }

    // 3. Update Record
    record.role = 'admin';
    record.updatedAt = Date.now();
    saveUserTokenRecord(record);

    return {
      success: true,
      message: `Token "${record.accessToken}" (${record.email}) berhasil diangkat sebagai ADMIN!`,
      record,
    };
  } catch (e: any) {
    return { success: false, message: `Gagal menetapkan admin: ${e.message}` };
  }
}

/**
 * 6. Remove Admin Role by Access Token (Developer ONLY)
 */
export function adminRemoveAdminRoleByToken(
  targetTokenOrId: string,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer') {
    return {
      success: false,
      message: 'Akses Ditolak: Hanya Developer utama yang memiliki hak untuk mencabut status Admin.',
    };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target (lemai_...) wajib diisi.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  if (isDeveloperAccount(record.email) || record.accessToken === DEVELOPER_TOKEN) {
    return { success: false, message: 'Tidak dapat mencabut hak Developer utama.' };
  }

  try {
    // 1. Remove from Admin Tokens list
    const adminTokens: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_ADMIN_TOKENS) || '[]'
    );
    const updatedTokens = adminTokens.filter((t) => t !== record.accessToken);
    localStorage.setItem(STORAGE_KEY_ADMIN_TOKENS, JSON.stringify(updatedTokens));

    // 2. Remove from Admin Emails list
    const adminEmails: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_ADMINS_LIST) || '[]'
    );
    const updatedEmails = adminEmails.filter((e) => e !== record.email.toLowerCase());
    localStorage.setItem(STORAGE_KEY_ADMINS_LIST, JSON.stringify(updatedEmails));

    // 3. Update Record
    record.role = 'user';
    record.updatedAt = Date.now();
    saveUserTokenRecord(record);

    return {
      success: true,
      message: `Status Admin untuk token "${record.accessToken}" (${record.email}) berhasil dicabut. Akun kembali menjadi user biasa.`,
      record,
    };
  } catch (e: any) {
    return { success: false, message: `Gagal mencabut status admin: ${e.message}` };
  }
}

/**
 * 7. Set Developer Role by Access Token (Developer ONLY)
 */
export function adminSetDevRoleByToken(
  targetTokenOrId: string,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer') {
    return {
      success: false,
      message: 'Akses Ditolak: Hanya Developer yang memiliki hak untuk menetapkan role Developer.',
    };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target (lemai_...) wajib diisi.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  try {
    // 1. Add Access Token to Dev Tokens list
    const devTokens: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_DEV_TOKENS) || '[]'
    );
    if (!devTokens.includes(record.accessToken)) {
      devTokens.push(record.accessToken);
      localStorage.setItem(STORAGE_KEY_DEV_TOKENS, JSON.stringify(devTokens));
    }

    // 2. Add Email to Dev Emails list
    const devEmails: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_DEV_EMAILS) || '[]'
    );
    if (!devEmails.includes(record.email.toLowerCase())) {
      devEmails.push(record.email.toLowerCase());
      localStorage.setItem(STORAGE_KEY_DEV_EMAILS, JSON.stringify(devEmails));
    }

    // 3. Update Record to Developer with Unlimited Tokens
    record.role = 'developer';
    record.tokensRemaining = Infinity;
    record.updatedAt = Date.now();
    saveUserTokenRecord(record);

    return {
      success: true,
      message: `Token "${record.accessToken}" (${record.email}) berhasil diangkat sebagai DEVELOPER (Unlimited Quota & Full Access)!`,
      record,
    };
  } catch (e: any) {
    return { success: false, message: `Gagal menetapkan Developer: ${e.message}` };
  }
}

/**
 * 8. Remove Developer Role by Access Token (Developer ONLY)
 */
export function adminRemoveDevRoleByToken(
  targetTokenOrId: string,
  callerRole: UserRole
): AdminActionResult {
  if (callerRole !== 'developer') {
    return {
      success: false,
      message: 'Akses Ditolak: Hanya Developer yang memiliki hak untuk mencabut role Developer.',
    };
  }
  if (!targetTokenOrId || !targetTokenOrId.trim()) {
    return { success: false, message: 'Token Akses target (lemai_...) wajib diisi.' };
  }

  const record = findUserByTokenOrEmail(targetTokenOrId);
  if (!record) {
    return { success: false, message: `User dengan token "${targetTokenOrId}" tidak ditemukan.` };
  }

  // Prevent removing root developer
  if (
    record.email.toLowerCase() === DEVELOPER_EMAIL.toLowerCase() ||
    record.accessToken === DEVELOPER_TOKEN
  ) {
    return { success: false, message: 'Tidak dapat mencabut hak Root Developer master.' };
  }

  try {
    // 1. Remove from Dev Tokens list
    const devTokens: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_DEV_TOKENS) || '[]'
    );
    const updatedDevTokens = devTokens.filter((t) => t !== record.accessToken);
    localStorage.setItem(STORAGE_KEY_DEV_TOKENS, JSON.stringify(updatedDevTokens));

    // 2. Remove from Dev Emails list
    const devEmails: string[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY_DEV_EMAILS) || '[]'
    );
    const updatedDevEmails = devEmails.filter((e) => e !== record.email.toLowerCase());
    localStorage.setItem(STORAGE_KEY_DEV_EMAILS, JSON.stringify(updatedDevEmails));

    // 3. Update Record back to User (or Admin if also listed)
    const isAdmin = isAdminAccount(record.email, record.accessToken);
    record.role = isAdmin ? 'admin' : 'user';
    record.tokensRemaining = FREE_USER_TOKEN_LIMIT;
    record.updatedAt = Date.now();
    saveUserTokenRecord(record);

    return {
      success: true,
      message: `Status Developer untuk token "${record.accessToken}" (${record.email}) berhasil dicabut. Role diubah menjadi ${record.role}.`,
      record,
    };
  } catch (e: any) {
    return { success: false, message: `Gagal mencabut status Developer: ${e.message}` };
  }
}

// Module Model Settings Interface
export interface ModuleModelSettings {
  chatModel: string;
  codingModel: string;
  reasoningModel: string;
  visionModel: string;
  imageModel: string;
  videoModel: string;
}

const STORAGE_KEY_MODULE_SETTINGS = 'lemai_module_model_settings_v1';

export async function getModuleModelSettings(): Promise<ModuleModelSettings> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_MODULE_SETTINGS);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading module model settings:', e);
  }
  return {
    chatModel: 'lemai-1.0-flash',
    codingModel: 'lemai-1.0-flash',
    reasoningModel: 'gemini-2.5-pro',
    visionModel: 'lemai-1.0-flash',
    imageModel: 'imagen-3.0-generate-002',
    videoModel: 'veo-2.0-generate-001',
  };
}

export async function saveModuleModelSettings(settings: ModuleModelSettings): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEY_MODULE_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving module model settings:', e);
  }
}

export async function updateUserProfileData(data: {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  username?: string;
}): Promise<UserProfile> {
  const currentEmail = localStorage.getItem('lemai_current_user_email') || 'developer@limone.my.id';
  const tokenRecord = getUserTokenRecord(currentEmail, data.username);
  
  const updatedUser: UserProfile = {
    uid: 'user-' + Date.now(),
    email: tokenRecord.email || currentEmail,
    username: data.username || tokenRecord.username || 'Developer',
    displayName: data.displayName || data.username || 'Developer',
    bio: data.bio || '',
    photoURL: data.photoURL,
    role: tokenRecord.role,
    accessToken: tokenRecord.accessToken,
    provider: 'password',
  };

  try {
    localStorage.setItem('lemai_user_profile_data', JSON.stringify(updatedUser));
  } catch (e) {
    console.error('Error saving user profile data:', e);
  }

  return updatedUser;
}

// Backward-compatible alias exports
export const adminAddToken = adminAddTokenByToken;
export const adminReduceToken = adminReduceTokenByToken;
export const adminSetToken = adminSetTokenByToken;
export const adminRemoveToken = adminRemoveTokenByToken;
export const adminSetAdminRole = adminSetAdminRoleByToken;
export const adminRemoveAdminRole = adminRemoveAdminRoleByToken;
export const adminSetDevRole = adminSetDevRoleByToken;
export const adminRemoveDevRole = adminRemoveDevRoleByToken;
