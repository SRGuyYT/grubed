import { MediaCard } from './MediaCard';

export function WatchlistPage({
  items,
  continueMap,
  watchlistMap,
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
}) {
  return (
    <section className="reveal-up space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
          Watchlist
        </div>
        <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">
          Saved for later
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
          Every title you bookmarked, rendered as a dedicated grid route and synced to your
          account when Firebase is available.
        </p>
      </div>

      {items.length ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((item) => (
            <MediaCard
              key={`watchlist-${item.mediaType}-${item.id}`}
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
        <div className="glass-panel rounded-[32px] p-6 text-sm text-white/64">
          Your watchlist is empty. Add titles from any card to populate this route.
        </div>
      )}
    </section>
  );
}
