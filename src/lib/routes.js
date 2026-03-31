export const SECTION_PATHS = {
  home: '/home',
  movies: '/movies',
  series: '/series',
  watchlist: '/watchlist',
  settings: '/settings',
  docs: '/docs',
};

// Map from path → section
const SECTION_BY_PATH = Object.fromEntries(
  Object.entries(SECTION_PATHS).map(([section, path]) => [path, section])
);

// Additional aliases for legacy or alternate paths
const SECTION_ALIASES = {
  '/account': 'settings',
  '/new': 'home',
};

/**
 * Normalize a pathname by trimming trailing slashes.
 * Returns '/' if empty after trimming.
 */
function normalizePathname(pathname) {
  if (!pathname) return '/';
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/**
 * Parse a pathname into a route object:
 * - landing page
 * - section
 * - detail page
 */
export function parseRoute(pathname) {
  const normalized = normalizePathname(pathname);

  if (normalized === '/') {
    return { type: 'landing' };
  }

  // Check for aliases first
  if (SECTION_ALIASES[normalized]) {
    return { type: 'section', section: SECTION_ALIASES[normalized] };
  }

  // Match known section paths
  if (SECTION_BY_PATH[normalized]) {
    return { type: 'section', section: SECTION_BY_PATH[normalized] };
  }

  // Match detail pages: /title/{movie|tv}/{id}
  const match = normalized.match(/^\/title\/(movie|tv)\/(\d+)$/);
  if (match) {
    const [, mediaType, id] = match;
    return { type: 'details', mediaType, id: Number(id) };
  }

  // Fallback to home section for unknown paths
  return { type: 'section', section: 'home' };
}

/** Get the full path for a given section key */
export function getSectionPath(section) {
  return SECTION_PATHS[section] ?? SECTION_PATHS.home;
}

/** Get the full path for a details page */
export function getDetailsPath(mediaType, id) {
  return `/title/${mediaType}/${id}`;
}
