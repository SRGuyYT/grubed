import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { GUEST_SCOPE } from './brand';
import { db } from './firebase';

const STORAGE_PREFIX = 'grubed_preferences';

/** Default UI preferences for all users */
export const DEFAULT_PREFERENCES = {
  theme: 'crimson',
  density: 'comfortable',
  motion: 'full',
  providerFlow: 'blocked',
};

/** Generate a localStorage key for a given scope (guest or user) */
function getStorageKey(scopeKey = GUEST_SCOPE) {
  return `${STORAGE_PREFIX}:${scopeKey}`;
}

/** Ensure a preference object always has all default keys */
function normalizePreferences(value) {
  return {
    ...DEFAULT_PREFERENCES,
    ...(value && typeof value === 'object' ? value : {}),
  };
}

/** Firebase reference to a user's UI preferences */
function preferencesRef(userId) {
  return doc(db, 'users', userId, 'preferences', 'ui');
}

/** Load preferences from localStorage, fallback to defaults */
export function loadPreferences(scopeKey = GUEST_SCOPE) {
  try {
    const raw = localStorage.getItem(getStorageKey(scopeKey));
    return normalizePreferences(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

/** Save preferences to localStorage and return normalized object */
export function persistPreferences(preferences, scopeKey = GUEST_SCOPE) {
  const normalized = normalizePreferences(preferences);
  localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(normalized));
  return normalized;
}

/** Load preferences from Firestore for a specific user */
export async function loadRemotePreferences(userId) {
  if (!userId) return { ...DEFAULT_PREFERENCES };

  const snapshot = await getDoc(preferencesRef(userId));
  return normalizePreferences(snapshot.data()?.values);
}

/** Sync preferences to Firestore for a specific user */
export async function syncRemotePreferences(userId, preferences) {
  if (!userId) return;

  await setDoc(
    preferencesRef(userId),
    {
      values: normalizePreferences(preferences),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

/** Apply preferences to document root as data attributes for CSS styling */
export function applyPreferencesToDocument(preferences) {
  const next = normalizePreferences(preferences);
  const root = document.documentElement;

  root.dataset.theme = next.theme;
  root.dataset.density = next.density;
  root.dataset.motion = next.motion;
}
