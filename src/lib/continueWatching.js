const STORAGE_PREFIX = 'grubed_continue_watching';
const LEGACY_STORAGE_KEY = 'continue_watching';

/** Returns the localStorage key for a given scope (guest or user) */
function getStorageKey(scopeKey = 'guest') {
  return `${STORAGE_PREFIX}:${scopeKey}`;
}

/** Safely parse a JSON string into an object map */
function parseMap(raw) {
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/** Persist a continue-watching map into localStorage */
export function persistContinueWatchingMap(map, scopeKey = 'guest') {
  localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(map));
  return map;
}

/** Load the continue-watching map from localStorage */
export function loadContinueWatching(scopeKey = 'guest') {
  const scopedKey = getStorageKey(scopeKey);
  const scopedValue = localStorage.getItem(scopedKey);

  if (scopedValue !== null) {
    return parseMap(scopedValue);
  }

  // Migrate legacy guest storage if present
  if (scopeKey === 'guest') {
    const legacy = parseMap(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (Object.keys(legacy).length > 0) {
      persistContinueWatchingMap(legacy, scopeKey);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
  }

  return {};
}

/** Merge a new entry into an existing continue-watching map */
export function upsertContinueWatchingEntry(map, entry) {
  const key = `${entry.type}_${entry.id}`;
  return {
    ...map,
    [key]: {
      ...map[key],
      ...entry,
      updatedAt: Date.now(),
    },
  };
}

/** Store a single continue-watching entry in localStorage */
export function storeContinueWatchingEntry(entry, scopeKey = 'guest') {
  const current = loadContinueWatching(scopeKey);
  const updated = upsertContinueWatchingEntry(current, entry);
  return persistContinueWatchingMap(updated, scopeKey);
}

/** Remove a continue-watching entry by key */
export function removeContinueWatchingEntry(key, scopeKey = 'guest') {
  const current = loadContinueWatching(scopeKey);
  if (!current[key]) return current;

  const next = { ...current };
  delete next[key];
  return persistContinueWatchingMap(next, scopeKey);
}

/** Merge multiple continue-watching maps, keeping the most recently updated entries */
export function mergeContinueWatchingMaps(...maps) {
  const merged = {};

  maps.forEach((map) => {
    Object.entries(map ?? {}).forEach(([key, value]) => {
      if (!merged[key] || (value?.updatedAt ?? 0) >= (merged[key]?.updatedAt ?? 0)) {
        merged[key] = value;
      }
    });
  });

  return merged;
}

/** Convert map to sorted array for listing, most recent first */
export function listContinueWatching(map) {
  return Object.entries(map)
    .map(([key, value]) => ({ key, ...value }))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
}
