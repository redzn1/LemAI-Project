import { 
  getAuth, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult, 
  GoogleAuthProvider, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  updateProfile, 
  User 
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { UserProfile, UserRole } from '../types';
import { app, firebaseConfig } from '../config/firebase';
import { getUserTokenRecord, isDeveloperAccount, isAdminAccount, DEVELOPER_EMAIL, FREE_USER_TOKEN_LIMIT } from './tokenManager';
import { syncUserToRTDB, getRTDBUser } from './rtdb';

export { app, firebaseConfig };

// Initialize Firebase Auth & Firestore instances
export const auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const EMAIL_DOMAIN = 'limone.my.id';

/**
 * Normalizes username input: strips whitespace, lowercases, removes illegal chars
 */
export function normalizeUsername(input: string): string {
  if (!input) return '';
  let clean = input.trim().toLowerCase();
  // If user typed @something, remove @ and anything after it
  if (clean.includes('@')) {
    clean = clean.split('@')[0];
  }
  // Keep only alphanumeric, underscores, dots, hyphens
  clean = clean.replace(/[^a-z0-9_.-]/g, '');
  return clean;
}

/**
 * Formats a clean username into custom email: username@limone.my.id
 */
export function formatUsernameToEmail(username: string): string {
  const clean = normalizeUsername(username);
  if (!clean) return '';
  return `${clean}@${EMAIL_DOMAIN}`;
}

/**
 * Validates a username according to LemAI rules
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { isValid: false, error: 'Username cannot be empty.' };
  }
  const clean = normalizeUsername(username);
  if (clean.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long.' };
  }
  if (clean.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters.' };
  }
  if (!/^[a-z0-9][a-z0-9_.-]*[a-z0-9]$/.test(clean) && clean.length > 2) {
    return { isValid: false, error: 'Username can only contain letters, numbers, dots, dashes, and underscores.' };
  }
  return { isValid: true };
}

const USER_EXTRA_STORAGE_PREFIX = 'lemai_user_extra_';

/**
 * Convert Firebase User object to LemAI UserProfile
 */
export function userToProfile(user: User): UserProfile {
  let email = user.email || '';
  let username = email.split('@')[0] || user.displayName?.toLowerCase().replace(/\s+/g, '_') || 'user';
  
  // Try to read cached extra profile metadata (bio, custom photo)
  let extraBio = '';
  let extraPhoto = user.photoURL || undefined;
  let customUsername = username;
  try {
    const cached = localStorage.getItem(USER_EXTRA_STORAGE_PREFIX + user.uid);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.bio) extraBio = parsed.bio;
      if (parsed.photoURL) extraPhoto = parsed.photoURL;
      if (parsed.username) customUsername = parsed.username;
    }
  } catch (e) {
    console.error('Error reading extra profile:', e);
  }

  const resolvedEmail = email.includes('@') ? email : formatUsernameToEmail(customUsername);
  const isGoogle = user.providerData?.some(p => p.providerId === 'google.com') || email.includes('@gmail.com');
  const provider: 'google' | 'password' = isGoogle ? 'google' : 'password';
  const tokenRecord = getUserTokenRecord(resolvedEmail, customUsername, provider);

  const profile: UserProfile = {
    uid: user.uid,
    username: customUsername,
    email: resolvedEmail,
    displayName: user.displayName || customUsername,
    bio: extraBio,
    photoURL: extraPhoto,
    accessToken: tokenRecord.accessToken,
    provider,
    role: tokenRecord.role,
    tokensRemaining: tokenRecord.tokensRemaining,
    tokensLimit: tokenRecord.tokensLimit,
    lastResetTimestamp: tokenRecord.lastResetTimestamp,
    createdAt: Date.now(),
  };

  // Asynchronously sync to RTDB
  syncUserToRTDB(user.uid, {
    email: resolvedEmail,
    username: customUsername,
    displayName: user.displayName || customUsername,
    photoURL: extraPhoto,
    provider,
    role: tokenRecord.role,
    accessToken: tokenRecord.accessToken,
    tokensRemaining: tokenRecord.tokensRemaining,
    tokensLimit: tokenRecord.tokensLimit,
  }).catch(() => {});

  return profile;
}

/**
 * Update user profile (Display Name, Bio, Profile Photo URL / base64)
 */
export async function updateUserProfileData(updates: {
  displayName?: string;
  bio?: string;
  photoURL?: string;
  username?: string;
}): Promise<UserProfile> {
  const currentUser = auth.currentUser;
  
  if (currentUser) {
    const authUpdates: { displayName?: string; photoURL?: string } = {};
    if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
    // Firebase auth photoURL max length is around 2048 chars. If it's a huge base64 string, store in local extra
    if (updates.photoURL !== undefined && updates.photoURL.length < 2000) {
      authUpdates.photoURL = updates.photoURL;
    }
    
    if (Object.keys(authUpdates).length > 0) {
      await updateProfile(currentUser, authUpdates);
    }
  }

  const uid = currentUser?.uid || 'guest-user';
  const existingExtra = (() => {
    try {
      const c = localStorage.getItem(USER_EXTRA_STORAGE_PREFIX + uid);
      return c ? JSON.parse(c) : {};
    } catch {
      return {};
    }
  })();

  const mergedExtra = {
    ...existingExtra,
    ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
    ...(updates.photoURL !== undefined ? { photoURL: updates.photoURL } : {}),
    ...(updates.username !== undefined ? { username: updates.username } : {}),
    ...(updates.displayName !== undefined ? { displayName: updates.displayName } : {}),
  };

  try {
    localStorage.setItem(USER_EXTRA_STORAGE_PREFIX + uid, JSON.stringify(mergedExtra));
  } catch (e) {
    console.error('Failed to persist user extra profile:', e);
  }

  if (currentUser) {
    const p = userToProfile(currentUser);
    syncUserToRTDB(currentUser.uid, {
      displayName: updates.displayName,
      bio: updates.bio,
      photoURL: updates.photoURL,
      username: updates.username,
    }).catch(() => {});
    return p;
  }

  return {
    uid: 'guest-user',
    username: updates.username || 'guest_dev',
    email: 'guest@limone.my.id',
    displayName: updates.displayName || 'Guest Developer',
    bio: updates.bio || '',
    photoURL: updates.photoURL,
    provider: 'password',
  };
}

/**
 * Register user with Username, Full Name (DisplayName), and Password.
 * Automatically appends @limone.my.id to the username for Firebase Auth email creation.
 */
export async function registerWithUsername(
  username: string,
  password: string,
  displayName?: string,
  bio?: string,
  photoURL?: string
): Promise<UserProfile> {
  const userValidation = validateUsername(username);
  if (!userValidation.isValid) {
    throw new Error(userValidation.error || 'Username tidak valid');
  }

  if (!password || password.length < 6) {
    throw new Error('Password harus minimal 6 karakter.');
  }

  const cleanUsername = normalizeUsername(username);
  const generatedEmail = `${cleanUsername}@${EMAIL_DOMAIN}`;
  const resolvedDisplayName = displayName?.trim() || cleanUsername;

  const cred = await createUserWithEmailAndPassword(auth, generatedEmail, password);
  
  await updateProfile(cred.user, {
    displayName: resolvedDisplayName,
    photoURL: photoURL && photoURL.length < 2000 ? photoURL : undefined,
  });

  // Save extra profile metadata
  try {
    localStorage.setItem(
      USER_EXTRA_STORAGE_PREFIX + cred.user.uid,
      JSON.stringify({
        username: cleanUsername,
        displayName: resolvedDisplayName,
        bio: bio || '',
        photoURL: photoURL || '',
      })
    );
  } catch (e) {
    console.error('Error storing profile extras:', e);
  }

  return userToProfile(cred.user);
}

/**
 * Backward-compatible registration helper
 */
export async function registerWithUsernameAndEmail(
  username: string,
  emailName: string,
  password: string,
  displayName?: string,
  bio?: string,
  photoURL?: string
): Promise<UserProfile> {
  return registerWithUsername(emailName || username, password, displayName || username, bio, photoURL);
}

/**
 * Login with username or email name and password (resolves to name@limone.my.id)
 */
export async function loginWithUsername(identifier: string, password: string): Promise<UserProfile> {
  if (!identifier || !identifier.trim()) {
    throw new Error('Silakan masukkan nama email atau username.');
  }
  if (!password) {
    throw new Error('Silakan masukkan password.');
  }

  let finalEmail = identifier.trim();
  if (!finalEmail.includes('@')) {
    finalEmail = `${normalizeUsername(finalEmail)}@${EMAIL_DOMAIN}`;
  }

  // Developer special credential verification
  if (finalEmail.toLowerCase() === DEVELOPER_EMAIL.toLowerCase() && password === 'Develop') {
    try {
      const cred = await signInWithEmailAndPassword(auth, finalEmail, password);
      return userToProfile(cred.user);
    } catch (e: any) {
      // If Firebase user does not exist yet, create it automatically or return developer profile
      try {
        const newCred = await createUserWithEmailAndPassword(auth, finalEmail, password);
        await updateProfile(newCred.user, { displayName: 'Lead Developer' });
        return userToProfile(newCred.user);
      } catch {
        // Safe developer offline fallback
        const devRecord = getUserTokenRecord(DEVELOPER_EMAIL, 'developer');
        return {
          uid: 'dev-master-root',
          username: 'developer',
          email: DEVELOPER_EMAIL,
          displayName: 'Lead Developer',
          role: 'developer',
          provider: 'password',
          tokensRemaining: Infinity,
          tokensLimit: FREE_USER_TOKEN_LIMIT,
          lastResetTimestamp: Date.now(),
          createdAt: Date.now(),
        };
      }
    }
  }

  const cred = await signInWithEmailAndPassword(auth, finalEmail, password);
  return userToProfile(cred.user);
}

/**
 * Google Sign In with popup and redirect fallback
 */
export async function signInWithGoogle(): Promise<UserProfile> {
  try {
    const cred = await signInWithPopup(auth, googleProvider);
    return userToProfile(cred.user);
  } catch (err: any) {
    if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
      try {
        await signInWithRedirect(auth, googleProvider);
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          return userToProfile(result.user);
        }
      } catch (redirectErr) {
        throw redirectErr;
      }
    }
    throw err;
  }
}

/**
 * Sign out current user
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Listen for Auth state changes
 */
export function subscribeToAuth(callback: (user: UserProfile | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      callback(userToProfile(firebaseUser));
    } else {
      callback(null);
    }
  });
}
