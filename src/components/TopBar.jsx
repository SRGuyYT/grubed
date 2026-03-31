import { BellIcon, SearchIcon, UserIcon } from './icons';

export function TopBar({
  activeSectionLabel = 'Home',
  query = '',
  onQueryChange = () => {},
  resultCount = 0,
  isSearching = false,
  session = null,
  onAccountClick = () => {},
}) {
  return (
    <header className="sticky top-0 z-30 px-4 pt-4 md:px-6 lg:px-10">
      <div className="glass-panel mx-auto flex max-w-[1720px] items-center gap-3 rounded-[28px] px-4 py-3 text-white/70 md:pl-24 lg:pl-28">
        {/* Section Label */}
        <div className="hidden min-w-0 md:block">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/40">
            Browse
          </div>
          <div className="truncate text-sm font-semibold text-white">
            {activeSectionLabel}
          </div>
        </div>

        {/* Search Input */}
        <label className="flex flex-1 items-center gap-3 rounded-full border border-white/10 bg-black/[0.35] px-4 py-3 transition-colors focus-within:border-white/20 focus-within:bg-black/[0.55]">
          <SearchIcon className="h-5 w-5 shrink-0 text-white/45" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search titles, stars, or fresh releases"
            className="w-full bg-transparent text-sm text-white placeholder:text-white/32 focus:outline-none"
          />
        </label>

        {/* Result count */}
        <div className="hidden items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40 md:flex">
          {isSearching ? 'Searching...' : `${resultCount} hits`}
        </div>

        {/* Notifications button */}
        <button
          type="button"
          className="glass-panel flex h-12 w-12 items-center justify-center rounded-full text-white/65 transition-colors hover:text-white"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
        </button>

        {/* Account / User button */}
        <button
          type="button"
          onClick={onAccountClick}
          className="glass-panel flex h-12 items-center gap-3 rounded-full px-3 text-white/70 transition-colors hover:text-white"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#e50914] to-[#7a0d16] text-white">
            <UserIcon className="h-4 w-4" />
          </div>
          <div className="hidden text-left md:block">
            <div className="text-sm font-semibold text-white">
              {session?.displayName || 'Sign In'}
            </div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/40">
              {session ? 'Account' : 'Firebase'}
            </div>
          </div>
        </button>
      </div>
    </header>
  );
}
