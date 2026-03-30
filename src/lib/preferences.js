import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { GUEST_SCOPE } from './brand';
import { db } from './firebase';

const STORAGE_PREFIX = 'grubed_preferences';

export const DEFAULT_PREFERENCES = {
  theme: 'crimson',
  density: 'comfortable',
  motion: 'full',
  providerFlow: 'blocked',
};

function getStorageKey(scopeKey = GUEST_SCOPE) {
  return `${STORAGE_PREFIX}:${scopeKey}`;
}

function normalizePreferences(value) {
  return {
    ...DEFAULT_PREFERENCES,
    ...(value && typeof value === 'object' ? value : {}),
  };
}

function preferencesRef(userId) {
  return doc(db, 'users', userId, 'preferences', 'ui');
}

export function loadPreferences(scopeKey = GUEST_SCOPE) {
  try {
    const raw = localStorage.getItem(getStorageKey(scopeKey));
    return normalizePreferences(raw ? JSON.parse(raw) : null);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function persistPreferences(preferences, scopeKey = GUEST_SCOPE) {
  const normalized = normalizePreferences(preferences);
  localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(normalized));
  return normalized;
}

export async function loadRemotePreferences(userId) {
  if (!userId) {
    return { ...DEFAULT_PREFERENCES };
  }

  const snapshot = await getDoc(preferencesRef(userId));
  return normalizePreferences(snapshot.data()?.values);
}

export async function syncRemotePreferences(userId, preferences) {
  if (!userId) {
    return;
  }

  await setDoc(
    preferencesRef(userId),
    {
      values: normalizePreferences(preferences),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function applyPreferencesToDocument(preferences) {
  const next = normalizePreferences(preferences);
  const root = document.documentElement;

  root.dataset.theme = next.theme;
  root.dataset.density = next.density;
  root.dataset.motion = next.motion;
}
