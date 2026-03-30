export const TMDB_PROXY_BASE =
  import.meta.env.VITE_TMDB_PROXY_BASE || 'https://mtd.sky0cloud.dpdns.org';
export const TMDB_API_KEY =
  import.meta.env.VITE_TMDB_API_KEY || 'bda755b29c8939787eded30edf76bec5';
export const TMDB_API_BASE = `${TMDB_PROXY_BASE.replace(/\/$/, '')}/3`;
export const IMAGE_BASE = 'https://image.tmdb.org/t/p';

function buildUrl(path, params = {}) {
  const resolvedPath = path.startsWith('http')
    ? path
    : `${TMDB_API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const url = new URL(resolvedPath);

  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

async function request(path, params = {}) {
  const response = await fetch(buildUrl(path, params));

  if (!response.ok) {
    throw new Error(`TMDB proxy request failed with status ${response.status}.`);
  }

  return response.json();
}

function dedupeMediaItems(items) {
  const seen = new Set();

  return items.filter((item) => {
    if (!item) {
      return false;
    }

    const key = `${item.mediaType}_${item.id}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeMediaItem(item, forcedType = 'all') {
  const mediaType =
    forcedType !== 'all'
      ? forcedType
      : item.media_type
        ? item.media_type
        : item.first_air_date && !item.release_date
          ? 'tv'
          : 'movie';

  if ((mediaType !== 'movie' && mediaType !== 'tv') || !item.id) {
    return null;
  }

  return {
    id: item.id,
    mediaType,
    title: item.title || item.name || 'Untitled',
    overview: item.overview || 'No synopsis available yet.',
    posterPath: item.poster_path ?? null,
    backdropPath: item.backdrop_path ?? item.poster_path ?? null,
    releaseDate: item.release_date || item.first_air_date || null,
    voteAverage: item.vote_average ?? 0,
    genreIds: item.genre_ids ?? [],
    popularity: item.popularity ?? 0,
  };
}

function normalizeDetailedItem(item, mediaType) {
  const base = normalizeMediaItem(item, mediaType);

  if (!base) {
    return null;
  }

  return {
    ...base,
    genres: (item.genres ?? []).map((genre) => ({
      id: genre.id,
      name: genre.name,
    })),
    tagline: item.tagline || '',
    runtime: item.runtime ?? item.episode_run_time?.[0] ?? null,
    numberOfSeasons: item.number_of_seasons ?? null,
    status: item.status || '',
  };
}

export async function fetchMediaList(endpoint, mediaType = 'all', params = {}) {
  const data = await request(endpoint, params);

  return dedupeMediaItems(
    (data.results ?? [])
      .map((item) => normalizeMediaItem(item, mediaType))
      .filter(Boolean),
  );
}

export async function searchCatalog(query, scope = 'multi') {
  const endpoint =
    scope === 'movie'
      ? '/search/movie'
      : scope === 'tv'
        ? '/search/tv'
        : '/search/multi';

  const data = await request(endpoint, {
    query,
    include_adult: false,
  });

  return dedupeMediaItems(
    (data.results ?? [])
      .map((item) => normalizeMediaItem(item, scope === 'multi' ? 'all' : scope))
      .filter(Boolean),
  );
}

export async function fetchTvDetails(id) {
  const data = await request(`/tv/${id}`);

  return {
    id: data.id,
    numberOfSeasons: data.number_of_seasons ?? 0,
    seasons: (data.seasons ?? [])
      .filter((season) => season.season_number > 0)
      .map((season) => ({
        seasonNumber: season.season_number,
        name: season.name,
        episodeCount: season.episode_count ?? 0,
      })),
  };
}

export async function fetchTvSeason(id, seasonNumber) {
  const data = await request(`/tv/${id}/season/${seasonNumber}`);

  return {
    id: data.id,
    seasonNumber: data.season_number,
    name: data.name,
    episodes: (data.episodes ?? []).map((episode) => ({
      id: episode.id,
      episodeNumber: episode.episode_number,
      name: episode.name,
      overview: episode.overview || 'No synopsis available yet.',
      stillPath: episode.still_path ?? null,
    })),
  };
}

export async function fetchGenres(mediaType) {
  const data = await request(`/genre/${mediaType}/list`);
  return data.genres ?? [];
}

export async function fetchTitleDetails(mediaType, id) {
  const data = await request(`/${mediaType}/${id}`);
  return normalizeDetailedItem(data, mediaType);
}

export async function fetchTitleCredits(mediaType, id) {
  const data = await request(`/${mediaType}/${id}/credits`);

  return (data.cast ?? []).slice(0, 16).map((person) => ({
    id: person.id,
    name: person.name,
    character: person.character || 'Cast',
    profilePath: person.profile_path ?? null,
  }));
}

export async function fetchTitleVideos(mediaType, id) {
  const data = await request(`/${mediaType}/${id}/videos`);
  return data.results ?? [];
}

export async function fetchTitleRecommendations(mediaType, id) {
  const data = await request(`/${mediaType}/${id}/recommendations`);

  return dedupeMediaItems(
    (data.results ?? [])
      .map((item) => normalizeMediaItem(item, mediaType))
      .filter(Boolean),
  );
}

export async function fetchTitleBundle(mediaType, id) {
  const [details, cast, videos, recommendations] = await Promise.all([
    fetchTitleDetails(mediaType, id),
    fetchTitleCredits(mediaType, id),
    fetchTitleVideos(mediaType, id),
    fetchTitleRecommendations(mediaType, id),
  ]);

  const trailer =
    videos.find((video) => video.site === 'YouTube' && video.type === 'Trailer') ||
    videos.find((video) => video.site === 'YouTube');

  return {
    details,
    cast,
    trailerKey: trailer?.key ?? '',
    recommendations,
  };
}

export function buildImageUrl(path, size = 'original') {
  return path ? `${IMAGE_BASE}/${size}${path}` : '';
}
