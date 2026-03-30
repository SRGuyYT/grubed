const STORAGE_PREFIX = 'grubed_continue_watching';
const LEGACY_STORAGE_KEY = 'continue_watching';

function getStorageKey(scopeKey = 'guest') {
  return `${STORAGE_PREFIX}:${scopeKey}`;
}

function parseMap(raw) {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function persistContinueWatchingMap(map, scopeKey = 'guest') {
  localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(map));
  return map;
}

export function loadContinueWatching(scopeKey = 'guest') {
  const scopedKey = getStorageKey(scopeKey);
  const scopedValue = localStorage.getItem(scopedKey);

  if (scopedValue !== null) {
    return parseMap(scopedValue);
  }

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

export function storeContinueWatchingEntry(entry, scopeKey = 'guest') {
  return persistContinueWatchingMap(
    upsertContinueWatchingEntry(loadContinueWatching(scopeKey), entry),
    scopeKey,
  );
}

export function removeContinueWatchingEntry(key, scopeKey = 'guest') {
  const current = loadContinueWatching(scopeKey);

  if (!current[key]) {
    return current;
  }

  const next = { ...current };
  delete next[key];
  return persistContinueWatchingMap(next, scopeKey);
}

export function mergeContinueWatchingMaps(...maps) {
  const merged = {};

  maps.forEach((map) => {
    Object.entries(map ?? {}).forEach(([key, value]) => {
      if (
        !merged[key] ||
        (value?.updatedAt ?? 0) >= (merged[key]?.updatedAt ?? 0)
      ) {
        merged[key] = value;
      }
    });
  });

  return merged;
}

export function listContinueWatching(map) {
  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      ...value,
    }))
    .sort((left, right) => (right.updatedAt ?? 0) - (left.updatedAt ?? 0));
}
