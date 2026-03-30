export const SECTION_PATHS = {
  home: '/home',
  movies: '/movies',
  series: '/series',
  watchlist: '/watchlist',
  settings: '/settings',
  docs: '/docs',
};

const SECTION_BY_PATH = Object.fromEntries(
  Object.entries(SECTION_PATHS).map(([section, path]) => [path, section]),
);

const SECTION_ALIASES = {
  '/account': 'settings',
  '/new': 'home',
};

function normalizePathname(pathname) {
  if (!pathname || pathname === '/') {
    return '/';
  }

  return pathname.replace(/\/+$/, '') || '/';
}

export function parseRoute(pathname) {
  const normalized = normalizePathname(pathname);

  if (normalized === '/') {
    return { type: 'landing' };
  }

  if (SECTION_ALIASES[normalized]) {
    return {
      type: 'section',
      section: SECTION_ALIASES[normalized],
    };
  }

  if (SECTION_BY_PATH[normalized]) {
    return {
      type: 'section',
      section: SECTION_BY_PATH[normalized],
    };
  }

  const detailsMatch = normalized.match(/^\/title\/(movie|tv)\/(\d+)$/);
  if (detailsMatch) {
    return {
      type: 'details',
      mediaType: detailsMatch[1],
      id: Number(detailsMatch[2]),
    };
  }

  return { type: 'section', section: 'home' };
}

export function getSectionPath(section) {
  return SECTION_PATHS[section] || SECTION_PATHS.home;
}

export function getDetailsPath(mediaType, id) {
  return `/title/${mediaType}/${id}`;
}
