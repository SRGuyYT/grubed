import { useEffect, useEffectEvent, useState, useRef } from 'react';
import { buildImageUrl } from '../lib/tmdb';
import { getProgressPercent } from '../lib/playerBridge';
import { ChevronRightIcon, PlayIcon, StarIcon } from './icons';

function getReleaseYear(item) {
  return item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Coming Soon';
}

export function HeroSlider({ items, continueMap, onPlay, onOpenDetails }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const sliderRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  // Reset index if items change
  useEffect(() => {
    setActiveIndex(0);
  }, [items.length, items[0]?.id]);

  const advanceSlide = useEffectEvent(() => {
    setActiveIndex((current) => (current + 1) % items.length);
  });

  // Autoplay interval
  useEffect(() => {
    if (items.length < 2) return;
    const interval = window.setInterval(advanceSlide, 6500);
    return () => window.clearInterval(interval);
  }, [advanceSlide, items.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') setActiveIndex((prev) => (prev + 1) % items.length);
      if (e.key === 'ArrowLeft') setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [items.length]);

  // Touch handlers for swipe
  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchMove = (e) => (touchEndX.current = e.touches[0].clientX);
  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) setActiveIndex((prev) => (prev + 1) % items.length); // swipe left → next
    if (diff < -50) setActiveIndex((prev) => (prev - 1 + items.length) % items.length); // swipe right → prev
    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  const activeItem = items[activeIndex];
  if (!activeItem) return null;

  const activeProgress = continueMap[`${activeItem.mediaType}_${activeItem.id}`];
  const progressPercent = getProgressPercent(activeProgress);

  return (
    <section
      ref={sliderRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="reveal-up relative min-h-[68svh] overflow-hidden rounded-[36px] border border-white/10 shadow-[0_32px_120px_rgba(0,0,0,0.45)]"
    >
      {activeItem.backdropPath && (
        <img
          src={buildImageUrl(activeItem.backdropPath, 'original')}
          alt={activeItem.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,#000_14%,rgba(0,0,0,0.66)_45%,rgba(0,0,0,0.18)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(229,9,20,0.26),transparent_34%)]" />

      <div className="relative flex min-h-[68svh] flex-col justify-end p-6 md:p-10 lg:p-14">
        <div className="max-w-3xl space-y-5">
          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.26em] text-white/58">
            <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1">
              Grubed Spotlight
            </span>
            <span>{activeItem.mediaType === 'tv' ? 'Series' : 'Movie'}</span>
            <span>{getReleaseYear(activeItem)}</span>
            <span className="flex items-center gap-1 text-white/80">
              <StarIcon className="h-3.5 w-3.5 text-[#e50914]" />
              {activeItem.voteAverage.toFixed(1)}
            </span>
          </div>

          {/* Title & overview */}
          <div>
            <h1 className="max-w-4xl text-4xl font-black text-white md:text-6xl lg:text-7xl">
              {activeItem.title}
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
              {activeItem.overview}
            </p>
          </div>

          {/* Resume progress */}
          {activeProgress && (
            <div className="glass-panel inline-flex max-w-md flex-col gap-2 rounded-3xl px-4 py-3 text-sm text-white/75">
              <div className="flex items-center justify-between gap-3">
                <span>Resume synced from player bridge</span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full rounded-full bg-[#e50914]" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onPlay(activeItem)}
              className="flex items-center gap-2 rounded-full bg-[#e50914] px-6 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              <PlayIcon className="h-4 w-4" />
              Play in Theater
            </button>
            <button
              type="button"
              onClick={() => onOpenDetails(activeItem)}
              className="glass-panel flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              More Details
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Thumbnails navigation */}
        <div className="mt-10 flex flex-wrap gap-3">
          {items.slice(0, 5).map((item, index) => {
            const isActive = index === activeIndex;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`glass-panel flex min-w-[180px] flex-1 items-center gap-3 rounded-[24px] px-3 py-3 text-left transition-all duration-300 md:min-w-[220px] ${
                  isActive
                    ? 'border-white/20 bg-white/[0.08] text-white'
                    : 'text-white/58 hover:text-white'
                }`}
                aria-label={`Select featured item: ${item.title}`}
              >
                <div className="h-16 w-12 shrink-0 overflow-hidden rounded-2xl bg-white/5">
                  {item.posterPath && (
                    <img
                      src={buildImageUrl(item.posterPath, 'w342')}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{item.title}</div>
                  <div className="mt-1 truncate text-[11px] uppercase tracking-[0.22em] text-white/40">
                    {item.mediaType === 'tv' ? 'Series' : 'Movie'}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
