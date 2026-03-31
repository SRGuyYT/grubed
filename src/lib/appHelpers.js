export const DEFAULT_FILTERS = {
  genre: 'all',
  year: 'curated',
  rating: 'curated',
};

/**
 * Initialize feed state for paginated lists
 */
export function createFeedState() {
  return {
    items: [],
    page: 0,
    hasMore: true,
    isLoading: false,
    isLoadingMore: false,
    error: '',
  };
}

/**
 * Unique key for media items
 */
export function getItemKey(item) {
  return `${item.mediaType}_${item.id}`;
}

/**
 * Extract release year from media item
 */
export function getReleaseYear(item) {
  return item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0;
}

/**
 * Remove duplicates from items array
 */
export function dedupeItems(items, seenKeys = new Set()) {
  return items.filter((item) => {
    if (!item) return false;
    const key = getItemKey(item);
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });
}

/**
 * Deduplicate items in rows
 */
export function dedupeRows(rows) {
  const seenKeys = new Set();
  return rows
    .map((row) => ({
      ...row,
      items: dedupeItems(row.items, seenKeys),
    }))
    .filter((row) => row.items.length > 0);
}

/**
 * Shuffle array randomly
 */
export function shuffleItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

/**
 * Convert a continue-watching entry to a normalized media item
 */
export function continueEntryToMediaItem(entry) {
  return {
    id: entry.id,
    mediaType: entry.type,
    title: entry.title,
    overview:
      entry.overview ||
      (entry.type === 'tv'
        ? `Resume season ${entry.season ?? 1}, episode ${entry.episode ?? 1}.`
        : 'Resume where you left off from the player bridge sync.'),
    posterPath: entry.posterPath ?? null,
    backdropPath: entry.backdropPath ?? entry.posterPath ?? null,
    releaseDate: entry.year ?? null,
    voteAverage: entry.voteAverage ?? 0,
    genreIds: entry.genreIds ?? [],
    popularity: 0,
  };
}

/**
 * Build genre select options for UI
 */
export function buildGenreOptions(mediaType, genres) {
  return (genres ?? []).map((genre) => ({
    value: `${mediaType}:${genre.id}`,
    label: genre.name,
  }));
}

/**
 * Check if an item matches a genre filter
 */
export function matchesGenre(item, genreValue) {
  if (!genreValue || genreValue === 'all') return true;
  const [mediaType, genreId] = genreValue.split(':');
  return item.mediaType === mediaType && item.genreIds.includes(Number(genreId));
}

/**
 * Apply filters (genre, year, rating) to media items
 */
export function applyFilters(items, filters) {
  const filtered = items.filter((item) => matchesGenre(item, filters.genre));

  filtered.sort((a, b) => {
    // Year sorting
    if (filters.year !== 'curated') {
      const delta = getReleaseYear(b) - getReleaseYear(a);
      if (delta !== 0) return filters.year === 'newest' ? delta : -delta;
    }

    // Rating sorting
    if (filters.rating !== 'curated') {
      const delta = b.voteAverage - a.voteAverage;
      if (delta !== 0) return filters.rating === 'highest' ? delta : -delta;
    }

    return 0;
  });

  return filtered;
}

/**
 * Determine search scope from section
 */
export function searchScopeFromSection(section) {
  if (section === 'movies') return 'movie';
  if (section === 'series') return 'tv';
  return 'multi';
}

/**
 * Merge two media item arrays and remove duplicates
 */
export function mergeMediaLists(existing, incoming) {
  return dedupeItems([...(existing ?? []), ...(incoming ?? [])]);
}

/**
 * Get the top 3 genre IDs by frequency for a media type
 */
export function getTopGenreIds(items, mediaType) {
  const counts = new Map();

  items.forEach((item) => {
    if (item.mediaType !== mediaType) return;
    (item.genreIds ?? []).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  });

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([id]) => id);
}

/**
 * Build a unique key for a route
 */
export function getRouteKey(route) {
  if (route.type === 'details') return `details-${route.mediaType}-${route.id}`;
  if (route.type === 'section') return `section-${route.section}`;
  return route.type;
}
