import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Normalize an email to lowercase and trimmed
 */
function normalizeEmail(email) {
  return email?.trim().toLowerCase() || '';
}

/**
 * Convert Firebase user object to app-friendly user object
 */
function mapUser(user) {
  if (!user) return null;
  return {
    userId: user.uid,
    displayName: user.displayName || user.email?.split('@')[0] || 'Grubed Member',
    email: user.email || '',
  };
}

/**
 * Format Firebase auth errors into user-friendly messages
 */
function formatAuthError(error) {
  const code = error?.code || '';

  const messages = {
    'auth/email-already-in-use': 'That email is already attached to a Grubed account.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/missing-password': 'Enter your password.',
    'auth/weak-password': 'Use a password with at least 6 characters.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/too-many-requests': 'Too many attempts right now. Wait a minute and try again.',
    'auth/operation-not-allowed': 'Email/password auth is not enabled in this Firebase project yet.',
  };

  return messages[code] || (error instanceof Error ? error.message : 'Authentication failed.');
}

/**
 * Wrap error as a proper Error object with code
 */
function createAuthError(error) {
  const err = new Error(formatAuthError(error));
  err.code = error?.code || 'auth/unknown';
  return err;
}

/**
 * Validate email and password
 */
function validateCredentials({ email, password }) {
  if (!normalizeEmail(email)) throw new Error('Enter an email address.');
  if (!password?.trim()) throw new Error('Enter a password.');
}

/**
 * Load current session user
 */
export function loadSession() {
  return mapUser(auth.currentUser);
}

/**
 * Observe auth state changes
 * @param {function} callback - Receives normalized user object or null
 */
export function observeSession(callback) {
  return onAuthStateChanged(auth, (user) => callback(mapUser(user)));
}

/**
 * Register a new user
 */
export async function registerAccount({ displayName = '', email, password }) {
  validateCredentials({ email, password });

  try {
    const credential = await createUserWithEmailAndPassword(auth, normalizeEmail(email), password);

    const finalDisplayName = displayName.trim() || normalizeEmail(email).split('@')[0];

    if (finalDisplayName) {
      await updateProfile(credential.user, { displayName: finalDisplayName });
    }

    return mapUser({ ...credential.user, displayName: finalDisplayName });
  } catch (error) {
    throw createAuthError(error);
  }
}

/**
 * Log in an existing user
 */
export async function loginAccount({ email, password }) {
  validateCredentials({ email, password });

  try {
    const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
    return mapUser(credential.user);
  } catch (error) {
    throw createAuthError(error);
  }
}

/**
 * Log out current user
 */
export async function logoutAccount() {
  await signOut(auth);
  return null;
}
