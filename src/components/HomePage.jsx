import { HeroSlider } from './HeroSlider';
import { MediaCard } from './MediaCard';
import { MediaRow } from './MediaRow';
import { SearchIcon, SparklesIcon } from './icons';

export function HomePage({
  featuredItems,
  rows,
  isLoading,
  inlineError,
  query,
  onQueryChange,
  searchResults,
  isSearching,
  continueMap,
  watchlistMap,
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
  session,
}) {
  const showSearch = query.trim().length >= 2;

  return (
    <section className="space-y-7">
      <section className="reveal-up liquid-panel rounded-[34px] p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
              Home
            </div>
            <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">
              {session ? `Welcome back, ${session.displayName}.` : 'Stream smarter on Grubed.'}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
              Top 10 picks, history-driven recommendations, and featured titles tuned for quick starts.
            </p>
          </div>

          <label className="flex w-full items-center gap-3 rounded-full border border-white/12 bg-black/[0.28] px-4 py-3 text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:max-w-md">
            <SearchIcon className="h-5 w-5 shrink-0 text-white/42" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search movies, series, and people"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/32 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {!showSearch && featuredItems.length ? (
        <HeroSlider
          items={featuredItems}
          continueMap={continueMap}
          onPlay={onPlay}
          onOpenDetails={onOpenDetails}
        />
      ) : null}

      {showSearch ? (
        <section className="reveal-up space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-white/70">
              <SparklesIcon className="h-4 w-4" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Search</div>
              <div className="text-lg font-semibold text-white">
                Results for "{query.trim()}"
              </div>
            </div>
          </div>

          {searchResults.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {searchResults.map((item) => (
                <MediaCard
                  key={`home-search-${item.mediaType}-${item.id}`}
                  item={item}
                  progress={continueMap[`${item.mediaType}_${item.id}`]}
                  isWatchlisted={Boolean(watchlistMap[`${item.mediaType}_${item.id}`])}
                  fullWidth
                  onPlay={onPlay}
                  onOpenDetails={onOpenDetails}
                  onToggleWatchlist={onToggleWatchlist}
                />
              ))}
            </div>
          ) : (
            <div className="liquid-panel rounded-[28px] p-6 text-sm text-white/60">
              {isSearching ? 'Searching the catalog...' : 'No matches yet.'}
            </div>
          )}
        </section>
      ) : (
        <>
          {inlineError ? (
            <div className="liquid-panel rounded-[28px] p-6 text-sm leading-7 text-white/64">
              {inlineError}
            </div>
          ) : null}

          {isLoading ? (
            <div className="liquid-panel rounded-[28px] p-6 text-sm text-white/60">
              Loading your home feed...
            </div>
          ) : (
            <div className="space-y-7">
              {rows.map((row, index) => (
                <MediaRow
                  key={row.id}
                  row={row}
                  continueMap={continueMap}
                  watchlistMap={watchlistMap}
                  onPlay={onPlay}
                  onOpenDetails={onOpenDetails}
                  onToggleWatchlist={onToggleWatchlist}
                  onSeeAll={() => {}}
                  isExpanded={false}
                  showSeeAll={false}
                  delay={index * 80}
                />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}
