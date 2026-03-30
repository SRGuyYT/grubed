const STORAGE_PREFIX = 'grubed_watchlist';
const LEGACY_STORAGE_KEY = 'watchlist';

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

function createWatchlistEntry(item) {
  return {
    id: item.id,
    mediaType: item.mediaType,
    title: item.title,
    overview: item.overview,
    posterPath: item.posterPath ?? null,
    backdropPath: item.backdropPath ?? item.posterPath ?? null,
    releaseDate: item.releaseDate ?? null,
    voteAverage: item.voteAverage ?? 0,
    genreIds: item.genreIds ?? [],
    addedAt: Date.now(),
  };
}

export function persistWatchlistMap(map, scopeKey = 'guest') {
  localStorage.setItem(getStorageKey(scopeKey), JSON.stringify(map));
  return map;
}

export function loadWatchlist(scopeKey = 'guest') {
  const scopedKey = getStorageKey(scopeKey);
  const scopedValue = localStorage.getItem(scopedKey);

  if (scopedValue !== null) {
    return parseMap(scopedValue);
  }

  if (scopeKey === 'guest') {
    const legacy = parseMap(localStorage.getItem(LEGACY_STORAGE_KEY));

    if (Object.keys(legacy).length > 0) {
      persistWatchlistMap(legacy, scopeKey);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      return legacy;
    }
  }

  return {};
}

export function saveWatchlistEntry(item, scopeKey = 'guest') {
  const current = loadWatchlist(scopeKey);
  const key = `${item.mediaType}_${item.id}`;

  return persistWatchlistMap(
    {
      ...current,
      [key]: {
        ...current[key],
        ...createWatchlistEntry(item),
      },
    },
    scopeKey,
  );
}

export function removeWatchlistEntry(key, scopeKey = 'guest') {
  const current = loadWatchlist(scopeKey);

  if (!current[key]) {
    return current;
  }

  const next = { ...current };
  delete next[key];
  return persistWatchlistMap(next, scopeKey);
}

export function toggleWatchlistEntryInMap(map, item) {
  const key = `${item.mediaType}_${item.id}`;

  if (map[key]) {
    const next = { ...map };
    delete next[key];
    return next;
  }

  return {
    ...map,
    [key]: createWatchlistEntry(item),
  };
}

export function toggleWatchlistEntry(item, scopeKey = 'guest') {
  return persistWatchlistMap(
    toggleWatchlistEntryInMap(loadWatchlist(scopeKey), item),
    scopeKey,
  );
}

export function mergeWatchlistMaps(...maps) {
  const merged = {};

  maps.forEach((map) => {
    Object.entries(map ?? {}).forEach(([key, value]) => {
      if (
        !merged[key] ||
        (value?.addedAt ?? 0) >= (merged[key]?.addedAt ?? 0)
      ) {
        merged[key] = value;
      }
    });
  });

  return merged;
}

export function listWatchlist(map) {
  return Object.entries(map)
    .map(([key, value]) => ({
      key,
      ...value,
    }))
    .sort((left, right) => (right.addedAt ?? 0) - (left.addedAt ?? 0));
}
