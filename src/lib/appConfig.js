/**
 * Sections where search functionality is enabled
 */
export const SEARCHABLE_SECTIONS = new Set(['home', 'movies', 'series']);

/**
 * Feed configuration for infinite-scroll media browsing
 */
export const FEED_CONFIG = {
  movies: {
    endpoint: '/movie/popular',
    mediaType: 'movie',
    title: 'Movies',
    description:
      'Infinite-scroll movie browsing with genre, year, and rating controls tuned for small screens.',
  },
  series: {
    endpoint: '/tv/popular',
    mediaType: 'tv',
    title: 'Series',
    description:
      'Infinite-scroll series browsing with filters that stay usable on phones and tablets.',
  },
};
