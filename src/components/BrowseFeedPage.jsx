import { useEffect, useRef } from 'react';
import { FilterBar } from './FilterBar';
import { MediaCard } from './MediaCard';
import { RefreshIcon, SearchIcon } from './icons';

export function BrowseFeedPage({
  title,
  description,
  query,
  onQueryChange,
  filters,
  genres,
  onFilterChange,
  onResetFilters,
  items,
  searchResults,
  isSearching,
  continueMap,
  watchlistMap,
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
  hasMore,
  onLoadMore,
  isLoadingMore,
  inlineError,
  isInitialLoading,
}) {
  const loaderRef = useRef(null);
  const showSearch = query.trim().length >= 2;
  const visibleItems = showSearch ? searchResults : items;

  useEffect(() => {
    if (showSearch || !hasMore || isLoadingMore || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: '320px 0px' }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, onLoadMore, showSearch]);

  return (
    <section className="space-y-6">
      {/* Header */}
      <section className="reveal-up liquid-panel rounded-[34px] p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
              {title}
            </div>
            <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">{description}</p>
          </div>

          <label className="flex w-full items-center gap-3 rounded-full border border-white/12 bg-black/[0.28] px-4 py-3 text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:max-w-md">
            <SearchIcon className="h-5 w-5 shrink-0 text-white/42" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}`}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/32 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {/* Filters */}
      <FilterBar
        filters={filters}
        genres={genres}
        onChange={onFilterChange}
        onReset={onResetFilters}
      />

      {/* Inline Error */}
      {inlineError && (
        <div className="liquid-panel rounded-[28px] p-6 text-sm leading-7 text-white/64">
          {inlineError}
        </div>
      )}

      {/* Content */}
      <section className="reveal-up space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-white/56">
            {showSearch
              ? `Search results (${visibleItems.length})`
              : `${visibleItems.length} loaded${hasMore ? ' so far' : ''}`}
          </div>
          {isLoadingMore && (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-white/52">
              <RefreshIcon className="h-3.5 w-3.5 animate-spin" />
              Loading
            </div>
          )}
        </div>

        {isInitialLoading && !visibleItems.length ? (
          <div className="liquid-panel rounded-[28px] p-6 text-sm text-white/60">
            Loading {title.toLowerCase()}...
          </div>
        ) : visibleItems.length ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleItems.map((item) => (
              <MediaCard
                key={`browse-${item.mediaType}-${item.id}`}
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
            {isSearching ? 'Searching the catalog...' : 'No titles match the current view.'}
          </div>
        )}

        {/* Infinite Scroll Loader */}
        {!showSearch && (
          <div ref={loaderRef} className="flex min-h-16 items-center justify-center">
            {hasMore ? (
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/34">
                Scroll for more
              </span>
            ) : (
              <span className="text-[11px] uppercase tracking-[0.24em] text-white/28">
                End of feed
              </span>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
