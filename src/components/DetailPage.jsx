import { useEffect, useState } from 'react';
import { fetchTitleBundle, buildImageUrl } from '../lib/tmdb';
import { MediaRow } from './MediaRow';
import { ArrowLeftIcon, BookmarkIcon, PlayIcon, StarIcon } from './icons';

function getReleaseYear(item) {
  return item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Now';
}

export function DetailPage({
  mediaType,
  id,
  continueMap,
  watchlistMap,
  onBack,
  onPlay,
  onOpenDetails,
  onToggleWatchlist,
}) {
  const [bundle, setBundle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadBundle() {
      setIsLoading(true);
      setError('');

      try {
        const data = await fetchTitleBundle(mediaType, id);

        if (!cancelled) {
          setBundle(data);
        }
      } catch (detailError) {
        if (!cancelled) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : 'Title details could not be loaded.',
          );
          setBundle(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBundle();

    return () => {
      cancelled = true;
    };
  }, [id, mediaType]);

  if (isLoading) {
    return (
      <section className="glass-panel reveal-up rounded-[36px] p-8 text-white/70">
        Loading title details
      </section>
    );
  }

  if (error || !bundle?.details) {
    return (
      <section className="glass-panel reveal-up rounded-[36px] p-8 text-white/70">
        <button
          type="button"
          onClick={onBack}
          className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/62 transition-colors hover:text-white"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back
        </button>
        {error || 'Title details could not be loaded.'}
      </section>
    );
  }

  const { details, cast, trailerKey, recommendations } = bundle;
  const watchlistKey = `${details.mediaType}_${details.id}`;
  const isWatchlisted = Boolean(watchlistMap[watchlistKey]);

  return (
    <section className="space-y-8">
      <section className="reveal-up relative overflow-hidden rounded-[36px] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.45)]">
        {details.backdropPath ? (
          <img
            src={buildImageUrl(details.backdropPath, 'original')}
            alt={details.title}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#000_10%,rgba(0,0,0,0.76)_45%,rgba(0,0,0,0.22)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(229,9,20,0.26),transparent_36%)]" />

        <div className="relative grid gap-8 p-6 md:p-10 xl:grid-cols-[280px_minmax(0,1fr)] xl:p-14">
          <div className="space-y-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.22em] text-white/64 transition-colors hover:text-white"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            <div className="glass-panel overflow-hidden rounded-[30px]">
              {details.posterPath ? (
                <img
                  src={buildImageUrl(details.posterPath, 'w780')}
                  alt={details.title}
                  className="aspect-[2/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[2/3] bg-white/[0.04]" />
              )}
            </div>
          </div>

          <div className="flex flex-col justify-end">
            <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.24em] text-white/55">
              <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1">
                {details.mediaType === 'tv' ? 'Series' : 'Movie'}
              </span>
              <span>{getReleaseYear(details)}</span>
              {details.runtime ? <span>{details.runtime} min</span> : null}
              {details.numberOfSeasons ? <span>{details.numberOfSeasons} seasons</span> : null}
              <span className="flex items-center gap-1 text-white/80">
                <StarIcon className="h-3.5 w-3.5 text-[#e50914]" />
                {details.voteAverage.toFixed(1)}
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black text-white md:text-6xl">
              {details.title}
            </h1>
            {details.tagline ? (
              <p className="mt-3 text-lg text-white/62">{details.tagline}</p>
            ) : null}
            <p className="mt-5 max-w-3xl text-sm leading-7 text-white/68 md:text-base">
              {details.overview}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {details.genres.map((genre) => (
                <span
                  key={genre.id}
                  className="rounded-full border border-white/10 bg-black/[0.28] px-3 py-1.5 text-[11px] uppercase tracking-[0.22em] text-white/62"
                >
                  {genre.name}
                </span>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => onPlay(details)}
                className="flex items-center gap-2 rounded-full bg-[#e50914] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                <PlayIcon className="h-4 w-4" />
                Play in Theater
              </button>
              <button
                type="button"
                onClick={() => onToggleWatchlist(details)}
                className={`glass-panel flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                  isWatchlisted ? 'text-white' : 'text-white/78 hover:text-white'
                }`}
              >
                <BookmarkIcon className="h-4 w-4" />
                {isWatchlisted ? 'Saved to Watchlist' : 'Add to Watchlist'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
        <div className="glass-panel reveal-up overflow-hidden rounded-[32px]">
          <div className="border-b border-white/10 px-5 py-4">
            <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
              Trailer
            </div>
            <div className="mt-1 text-lg font-semibold text-white">Preview</div>
          </div>
          <div className="aspect-video bg-black">
            {trailerKey ? (
              <iframe
                title={`${details.title} trailer`}
                src={`https://www.youtube.com/embed/${trailerKey}`}
                className="h-full w-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : details.backdropPath ? (
              <img
                src={buildImageUrl(details.backdropPath, 'original')}
                alt={details.title}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
        </div>

        <div className="glass-panel reveal-up rounded-[32px] p-5">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
            Cast
          </div>
          <div className="mt-4 space-y-3">
            {cast.length ? (
              cast.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 rounded-[24px] border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white/[0.04]">
                    {person.profilePath ? (
                      <img
                        src={buildImageUrl(person.profilePath, 'w185')}
                        alt={person.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">
                      {person.name}
                    </div>
                    <div className="mt-1 truncate text-[11px] uppercase tracking-[0.22em] text-white/44">
                      {person.character}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-white/60">Cast data unavailable.</div>
            )}
          </div>
        </div>
      </section>

      {recommendations.length ? (
        <MediaRow
          row={{
            id: `recommendations-${details.id}`,
            title: 'Recommended Next',
            description: 'Nearby titles from the same catalog neighborhood.',
            items: recommendations,
          }}
          continueMap={continueMap}
          watchlistMap={watchlistMap}
          onPlay={onPlay}
          onOpenDetails={onOpenDetails}
          onToggleWatchlist={onToggleWatchlist}
          onSeeAll={() => {}}
          isExpanded={false}
          showSeeAll={false}
        />
      ) : null}
    </section>
  );
}
