export const DEFAULT_FILTERS = {
  genre: 'all',
  year: 'curated',
  rating: 'curated',
};

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

export function getItemKey(item) {
  return `${item.mediaType}_${item.id}`;
}

export function getReleaseYear(item) {
  return item.releaseDate ? new Date(item.releaseDate).getFullYear() : 0;
}

export function dedupeItems(items, seenKeys = new Set()) {
  return items.filter((item) => {
    if (!item) {
      return false;
    }

    const key = getItemKey(item);

    if (seenKeys.has(key)) {
      return false;
    }

    seenKeys.add(key);
    return true;
  });
}

export function dedupeRows(rows) {
  const seenKeys = new Set();

  return rows
    .map((row) => ({
      ...row,
      items: dedupeItems(row.items, seenKeys),
    }))
    .filter((row) => row.items.length > 0);
}

export function shuffleItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

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

export function buildGenreOptions(mediaType, genres) {
  return (genres ?? []).map((genre) => ({
    value: `${mediaType}:${genre.id}`,
    label: genre.name,
  }));
}

export function matchesGenre(item, genreValue) {
  if (!genreValue || genreValue === 'all') {
    return true;
  }

  const [mediaType, genreId] = genreValue.split(':');
  return item.mediaType === mediaType && item.genreIds.includes(Number(genreId));
}

export function applyFilters(items, filters) {
  const next = items.filter((item) => matchesGenre(item, filters.genre));

  next.sort((left, right) => {
    if (filters.year !== 'curated') {
      const yearDelta = getReleaseYear(right) - getReleaseYear(left);

      if (yearDelta !== 0) {
        return filters.year === 'newest' ? yearDelta : -yearDelta;
      }
    }

    if (filters.rating !== 'curated') {
      const ratingDelta = right.voteAverage - left.voteAverage;

      if (ratingDelta !== 0) {
        return filters.rating === 'highest' ? ratingDelta : -ratingDelta;
      }
    }

    return 0;
  });

  return next;
}

export function searchScopeFromSection(section) {
  if (section === 'movies') {
    return 'movie';
  }

  if (section === 'series') {
    return 'tv';
  }

  return 'multi';
}

export function mergeMediaLists(existing, incoming) {
  return dedupeItems([...(existing ?? []), ...(incoming ?? [])]);
}

export function getTopGenreIds(items, mediaType) {
  const scores = new Map();

  items.forEach((item) => {
    if (item.mediaType !== mediaType) {
      return;
    }

    (item.genreIds ?? []).forEach((genreId) => {
      scores.set(genreId, (scores.get(genreId) ?? 0) + 1);
    });
  });

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([genreId]) => genreId);
}

export function getRouteKey(route) {
  if (route.type === 'details') {
    return `details-${route.mediaType}-${route.id}`;
  }

  if (route.type === 'section') {
    return `section-${route.section}`;
  }

  return route.type;
}
