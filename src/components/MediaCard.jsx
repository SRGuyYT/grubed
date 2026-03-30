import { buildImageUrl } from '../lib/tmdb';
import { formatPlaybackTime, getProgressPercent } from '../lib/playerBridge';
import { BookmarkIcon, PlayIcon, StarIcon } from './icons';

function getReleaseYear(item) {
  return item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Soon';
}

export function MediaCard({
  item,
  progress,
  isWatchlisted,
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
  fullWidth = false,
}) {
  const progressPercent = getProgressPercent(progress);

  return (
    <article
      className={`card-hover glass-panel group flex flex-col overflow-hidden rounded-[28px] text-left text-white ${
        fullWidth ? 'w-full' : 'w-[184px] shrink-0 md:w-[212px]'
      }`}
    >
      <button
        type="button"
        onClick={() => onOpenDetails(item)}
        className="relative aspect-[2/3] overflow-hidden text-left"
      >
        {item.posterPath ? (
          <img
            src={buildImageUrl(item.posterPath, 'w500')}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="flex h-full items-end bg-[radial-gradient(circle_at_top,rgba(229,9,20,0.32),transparent_46%),rgba(255,255,255,0.04)] p-4">
            <div className="text-sm font-semibold text-white/70">{item.title}</div>
          </div>
        )}

        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(0,0,0,0.95),rgba(0,0,0,0.18)_50%,transparent)]" />

        <div className="absolute left-3 top-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-white/65">
          <span className="rounded-full border border-white/10 bg-black/[0.35] px-2.5 py-1">
            {item.mediaType === 'tv' ? 'Series' : 'Movie'}
          </span>
        </div>

        <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/[0.45] text-white/80 transition-colors group-hover:text-white">
          <PlayIcon className="h-4 w-4" />
        </div>

        {progress ? (
          <div className="absolute inset-x-3 bottom-3 rounded-2xl border border-white/10 bg-black/[0.55] px-3 py-2 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3 text-[10px] uppercase tracking-[0.22em] text-white/52">
              <span>Resume</span>
              <span>{formatPlaybackTime(progress.progress)}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
              <div
                className="h-full rounded-full bg-[#e50914]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
      </button>

      <div className="space-y-4 p-4">
        <div className="space-y-2">
          <div className="line-clamp-2 text-sm font-semibold text-white">
            {item.title}
          </div>
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.22em] text-white/42">
            <span>{getReleaseYear(item)}</span>
            <span className="flex items-center gap-1 text-white/68">
              <StarIcon className="h-3.5 w-3.5 text-[#e50914]" />
              {item.voteAverage.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <button
            type="button"
            onClick={() => onPlay(item)}
            className="rounded-2xl bg-[#e50914] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white transition-transform hover:scale-[1.01]"
          >
            Play
          </button>
          <button
            type="button"
            onClick={() => onOpenDetails(item)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/72 transition-colors hover:text-white"
          >
            Details
          </button>
          <button
            type="button"
            onClick={() => onToggleWatchlist(item)}
            className={`flex items-center justify-center rounded-2xl border px-3 py-2 transition-colors ${
              isWatchlisted
                ? 'border-white/20 bg-white/[0.08] text-white'
                : 'border-white/10 bg-white/[0.03] text-white/62 hover:text-white'
            }`}
            aria-label={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
          >
            <BookmarkIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
