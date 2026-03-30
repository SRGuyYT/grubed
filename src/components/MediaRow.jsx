import { MediaCard } from './MediaCard';

export function MediaRow({
  row,
  continueMap,
  watchlistMap,
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
  onSeeAll,
  isExpanded,
  delay = 0,
  showSeeAll = true,
}) {
  if (!row.items?.length) {
    return null;
  }

  return (
    <section
      className="reveal-up space-y-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-end justify-between gap-4">
        <div className="max-w-xl">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
            Row
          </div>
          <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
            {row.title}
          </h2>
          {row.description ? (
            <p className="mt-2 text-sm leading-7 text-white/58">{row.description}</p>
          ) : null}
        </div>

        {showSeeAll ? (
          <button
            type="button"
            onClick={() => onSeeAll(row.id)}
            className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white/65 transition-colors hover:border-white/20 hover:text-white"
          >
            {isExpanded ? 'Hide' : 'See All'}
          </button>
        ) : null}
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
        {row.items.map((item) => (
          <MediaCard
            key={`${row.id}-${item.mediaType}-${item.id}`}
            item={item}
            progress={continueMap[`${item.mediaType}_${item.id}`]}
            isWatchlisted={Boolean(watchlistMap?.[`${item.mediaType}_${item.id}`])}
            onPlay={onPlay}
            onOpenDetails={onOpenDetails}
            onToggleWatchlist={onToggleWatchlist}
          />
        ))}
      </div>
    </section>
  );
}
