// src/components/icons.jsx
import React from 'react';

/**
 * Core UI icons
 */
export const HomeIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5.5 9.5V21h13V9.5" />
  </svg>
);

export const FilmIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M7 5v14M17 5v14M3 9h4M17 9h4M3 15h4M17 15h4" />
  </svg>
);

export const TvIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="3" y="6" width="18" height="12" rx="2.5" />
    <path d="M8 21h8M12 18v3M9 3l3 3 3-3" />
  </svg>
);

export const SparklesIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="m12 3 1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8L12 3Z" />
    <path d="m5 16 1 2.5L8.5 20 6 21l-1 2.5L4 21l-2.5-1L4 18.5 5 16Z" />
    <path d="m19 15 .8 2 2.2.8-2.2.8-.8 2-.8-2-2.2-.8 2.2-.8.8-2Z" />
  </svg>
);

export const ClockIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5v5l3.5 2" />
  </svg>
);

export const BookmarkIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M7 4.5h10a1.5 1.5 0 0 1 1.5 1.5V20l-6.5-3.8L5.5 20V6A1.5 1.5 0 0 1 7 4.5Z" />
  </svg>
);

export const SearchIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const BellIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M6.5 9a5.5 5.5 0 1 1 11 0v3.1c0 .9.3 1.7.9 2.4L20 16.2H4l1.6-1.7c.6-.7.9-1.5.9-2.4V9Z" />
    <path d="M9.5 18a2.5 2.5 0 0 0 5 0" />
  </svg>
);

export const UserIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M5 20a7 7 0 0 1 14 0" />
  </svg>
);

export const PlayIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M8 6.5v11l9-5.5-9-5.5Z" />
  </svg>
);

export const ChevronRightIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="m9 5 7 7-7 7" />
  </svg>
);

export const ArrowLeftIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="m15 5-7 7 7 7" />
  </svg>
);

export const XIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="m6 6 12 12M18 6 6 18" />
  </svg>
);

export const StarIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="m12 3.8 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16l-4.8 2.5.9-5.4L4.2 9.5l5.4-.8L12 3.8Z" />
  </svg>
);

export const SlidersIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M5 6h14M5 18h14M8 6v6M16 12v6" />
    <circle cx="8" cy="15" r="2.5" />
    <circle cx="16" cy="9" r="2.5" />
  </svg>
);

export const BookOpenIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M4.5 5.5A2.5 2.5 0 0 1 7 3h11v16.5H7A2.5 2.5 0 0 0 4.5 22V5.5Z" />
    <path d="M18 3a2.5 2.5 0 0 1 2.5 2.5V22A2.5 2.5 0 0 0 18 19.5H7" />
  </svg>
);

export const AlertCircleIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5" />
    <path d="M12 16.5h.01" />
  </svg>
);

export const RefreshIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M20 11a8 8 0 1 0 2 5.3" />
    <path d="M20 5v6h-6" />
  </svg>
);

export const CopyIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <rect x="9" y="9" width="10" height="10" rx="2" />
    <path d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
  </svg>
);

export const ExternalLinkIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M14 5h5v5" />
    <path d="m10 14 9-9" />
    <path d="M19 13v4.5A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5H11" />
  </svg>
);

export const ShieldIcon = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
    <path d="M12 3 5.5 5.8v5.7c0 4.1 2.6 7.8 6.5 9.5 3.9-1.7 6.5-5.4 6.5-9.5V5.8L12 3Z" />
    <path d="m9.5 12 1.7 1.7 3.8-4.2" />
  </svg>
);
