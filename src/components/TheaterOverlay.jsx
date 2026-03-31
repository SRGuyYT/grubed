import { useEffect, useEffectEvent, useState } from 'react';
import { createAppError } from '../lib/errors';
import {
  buildVidkingEmbedUrl,
  formatPlaybackTime,
  parsePlayerEvent,
} from '../lib/playerBridge';
import { buildImageUrl, fetchTvDetails, fetchTvSeason } from '../lib/tmdb';
import {
  AlertCircleIcon,
  ExternalLinkIcon,
  PlayIcon,
  RefreshIcon,
  ShieldIcon,
  SparklesIcon,
  StarIcon,
  XIcon,
} from './icons';

const SAFE_SANDBOX = 'allow-same-origin allow-scripts allow-forms allow-presentation';
const PROVIDER_FLOW_SANDBOX = `${SAFE_SANDBOX} allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation`;

function getReleaseYear(item) {
  return item.releaseDate ? new Date(item.releaseDate).getFullYear() : 'Now';
}

function getInitialInfoPanelState() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth >= 1200;
}

// ---------------------- Subcomponents ----------------------
function HeaderControls({
  item,
  playerMode,
  isInfoPanelOpen,
  setIsInfoPanelOpen,
  providerFlowEnabled,
  toggleProviderFlow,
  openProviderPage,
  onClose,
}) {
  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-5 md:pt-[max(1rem,env(safe-area-inset-top))]">
      <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-3 rounded-[28px] border border-white/10 bg-black/28 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:px-5">
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/42">
            Full-Window Playback
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-white md:text-2xl">{item.title}</h2>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/62">
              {item.mediaType === 'tv' ? 'Series' : 'Movie'}
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/62">
              {playerMode === 'default' ? 'Standard Mode' : 'Compatibility Mode'}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/48">
            <span>{getReleaseYear(item)}</span>
            <span className="flex items-center gap-1 text-white/70">
              <StarIcon className="h-3.5 w-3.5 text-[#e50914]" />
              {item.voteAverage.toFixed(1)}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setIsInfoPanelOpen((c) => !c)}
            className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 transition-colors hover:text-white"
          >
            {isInfoPanelOpen ? 'Hide Details' : 'Show Details'}
          </button>

          <button
            type="button"
            onClick={() => toggleProviderFlow(!providerFlowEnabled)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors ${
              providerFlowEnabled
                ? 'border-[#f1c26d]/40 bg-[#3a290e]/78 text-white'
                : 'border-white/12 bg-white/[0.05] text-white/78 hover:text-white'
            }`}
          >
            <ShieldIcon className="h-4 w-4" />
            {providerFlowEnabled ? 'Provider Flow On' : 'Safe Mode On'}
          </button>

          <button
            type="button"
            onClick={openProviderPage}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 transition-colors hover:text-white"
          >
            <ExternalLinkIcon className="h-4 w-4" />
            Open Provider
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/78 transition-colors hover:text-white"
            aria-label="Close full-window playback"
          >
            <XIcon className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

function EpisodeSelector({ item, tvDetails, seasonData, seasonNumber, setSeasonNumber, episodeNumber, setEpisodeNumber, currentEpisode }) {
  if (item.mediaType !== 'tv') {
    return (
      <section className="rounded-[26px] border border-white/10 bg-black/24 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e50914] text-white">
            <PlayIcon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Movie bridge ready</div>
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
              Full-window embedded playback
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-[26px] border border-white/10 bg-black/24 p-4">
      <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">Episode Controls</div>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-white">Season</span>
        <select
          value={seasonNumber}
          onChange={(e) => setSeasonNumber(Number(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white focus:border-white/20 focus:outline-none"
        >
          {(tvDetails?.seasons ?? []).map((s) => (
            <option key={s.seasonNumber} value={s.seasonNumber}>
              {s.name || `Season ${s.seasonNumber}`}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-2">
        <span className="text-sm font-medium text-white">Episode</span>
        <select
          value={episodeNumber}
          onChange={(e) => setEpisodeNumber(Number(e.target.value))}
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white focus:border-white/20 focus:outline-none"
        >
          {(seasonData?.episodes ?? []).map((ep) => (
            <option key={ep.episodeNumber} value={ep.episodeNumber}>
              Episode {ep.episodeNumber}: {ep.name}
            </option>
          ))}
        </select>
      </label>

      {currentEpisode && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="text-sm font-semibold text-white">{currentEpisode.name}</div>
          <p className="mt-2 text-sm leading-6 text-white/58">{currentEpisode.overview}</p>
        </div>
      )}
    </section>
  );
}

// ---------------------- Main Component ----------------------
export function TheaterOverlay({
  item,
  resumeEntry,
  providerFlowEnabled = false,
  onClose,
  onPersistProgress,
  onClearProgress,
  onToggleProviderFlow,
  onNotify,
}) {
  const [tvDetails, setTvDetails] = useState(null);
  const [seasonData, setSeasonData] = useState(null);
  const [seasonNumber, setSeasonNumber] = useState(resumeEntry?.season ?? 1);
  const [episodeNumber, setEpisodeNumber] = useState(resumeEntry?.episode ?? 1);
  const [playerMode, setPlayerMode] = useState('default');
  const [playerFrameKey, setPlayerFrameKey] = useState(0);
  const [isInfoPanelOpen, setIsInfoPanelOpen] = useState(getInitialInfoPanelState);
  const [bridgeStatus, setBridgeStatus] = useState(
    resumeEntry
      ? `Ready to resume from ${formatPlaybackTime(resumeEntry.progress)}`
      : 'Listening for PLAYER_EVENT progress updates'
  );

  const resumeProgress =
    item.mediaType === 'tv'
      ? resumeEntry?.season === seasonNumber && resumeEntry?.episode === episodeNumber
        ? resumeEntry?.progress ?? 0
        : 0
      : resumeEntry?.progress ?? 0;

  const embedUrl = buildVidkingEmbedUrl(item, seasonNumber, episodeNumber, {
    progress: playerMode === 'default' ? resumeProgress : 0,
    autoPlay: playerMode === 'default',
  });

  const iframeSandbox = providerFlowEnabled ? PROVIDER_FLOW_SANDBOX : SAFE_SANDBOX;

  const currentEpisode = seasonData?.episodes?.find((ep) => ep.episodeNumber === episodeNumber);

  // ---------------------- Effects ----------------------
  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = prev);
  }, []);

  // Escape key
  useEffect(() => {
    const handle = (e) => {
      if (e.key === 'Escape') {
        if (isInfoPanelOpen) return setIsInfoPanelOpen(false);
        onClose();
      }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [isInfoPanelOpen, onClose]);

  // Load TV metadata
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (item.mediaType !== 'tv') return setTvDetails(null);
      try {
        const details = await fetchTvDetails(item.id);
        if (cancelled) return;
        setTvDetails(details);
        setSeasonNumber(resumeEntry?.season ?? details.seasons[0]?.seasonNumber ?? 1);
      } catch {
        if (!cancelled) setBridgeStatus('Season metadata could not be loaded.');
      }
    }
    void load();
    return () => (cancelled = true);
  }, [item.id, item.mediaType, resumeEntry?.season]);

  // Load season data
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (item.mediaType !== 'tv') return;
      try {
        const season = await fetchTvSeason(item.id, seasonNumber);
        if (cancelled) return;
        setSeasonData(season);
        const savedEpisode =
          resumeEntry?.season === seasonNumber ? resumeEntry?.episode : null;
        const fallbackEpisode = season.episodes[0]?.episodeNumber ?? 1;
        setEpisodeNumber((current) => {
          const preferred = current || savedEpisode || fallbackEpisode;
          return season.episodes.some((e) => e.episodeNumber === preferred) ? preferred : fallbackEpisode;
        });
      } catch {
        if (!cancelled) setBridgeStatus('Episode metadata could not be loaded.');
      }
    }
    void load();
    return () => (cancelled = true);
  }, [item.id, item.mediaType, resumeEntry?.episode, resumeEntry?.season, seasonNumber]);

  // Reset player when episode changes
  useEffect(() => {
    setPlayerMode('default');
    setPlayerFrameKey((k) => k + 1);
  }, [episodeNumber, item.id, item.mediaType, seasonNumber]);

  // ---------------------- Player Handlers ----------------------
  const updateProviderFlow = useEffectEvent((enabled, options = {}) => {
    onToggleProviderFlow?.(enabled);
    setPlayerFrameKey((c) => c + 1);
    setBridgeStatus(
      enabled
        ? 'Provider flow enabled. Reloaded with popup and redirect permissions.'
        : 'Provider flow blocked. Reloaded in the safe embedded mode.'
    );
    if (options.notify !== false) {
      onNotify?.({
        tone: enabled ? 'warning' : 'info',
        title: enabled ? 'Provider flow enabled' : 'Safe player mode restored',
        message: enabled
          ? 'This player can now open provider-controlled popups or redirects when a stream depends on them.'
          : 'Popups and redirects are blocked again for this player.',
      });
    }
  });

  const openProviderPage = useEffectEvent(() => {
    const win = window.open(embedUrl, '_blank', 'noopener,noreferrer');
    if (!win) {
      onNotify?.(
        createAppError('VID-002', {
          message: 'Browser blocked provider page.',
          help: 'Allow popups or copy URL manually.',
        })
      );
      return;
    }
    win.focus?.();
  });

  const retryInCompatibilityMode = useEffectEvent(() => {
    setPlayerMode('compatibility');
    setPlayerFrameKey((c) => c + 1);
    setBridgeStatus('Retrying the stream in compatibility mode.');
  });

  const emitPopupWarning = useEffectEvent(() => {
    onNotify?.(
      createAppError('VID-002', {
        message:
          'This stream may rely on a blocked popup or redirect. Enable Provider Flow if you trust the host.',
        actionLabel: providerFlowEnabled ? 'Open Provider' : 'Allow Provider Flow',
        onAction: providerFlowEnabled ? openProviderPage : () => updateProviderFlow(true, { notify: false }),
      })
    );
  });

  const emitPlaybackError = useEffectEvent(() => {
    onNotify?.(
      createAppError('VID-001', {
        help: 'Retry once in this window or open provider page.',
        actionLabel: 'Open Provider',
        onAction: openProviderPage,
      })
    );
  });

  const handlePlayerMessage = useEffectEvent((messageEvent) => {
    const payload = parsePlayerEvent(messageEvent);
    if (!payload || String(payload.id) !== String(item.id)) return;

    if (item.mediaType === 'tv') {
      if (payload.season && payload.season !== seasonNumber) return;
      if (payload.episode && payload.episode !== episodeNumber) return;
    }

    const key = `${item.mediaType}_${item.id}`;
    if (payload.type === 'ended') {
      onClearProgress(key);
      setBridgeStatus('Playback ended. Removed from continue watching.');
      return;
    }
    if (!payload.duration || payload.currentTime < 5) return;

    onPersistProgress({
      id: item.id,
      type: item.mediaType,
      title: item.title,
      overview: item.overview,
      posterPath: item.posterPath,
      backdropPath: item.backdropPath,
      voteAverage: item.voteAverage,
      genreIds: item.genreIds,
      progress: payload.currentTime,
      duration: payload.duration,
      season: item.mediaType === 'tv' ? seasonNumber : undefined,
      episode: item.mediaType === 'tv' ? episodeNumber : undefined,
      year: item.releaseDate,
    });

    setBridgeStatus(
      `Synced ${formatPlaybackTime(payload.currentTime)} of ${formatPlaybackTime(payload.duration)}`
    );
  });

  useEffect(() => {
    window.addEventListener('message', handlePlayerMessage);
    return () => window.removeEventListener('message', handlePlayerMessage);
  }, [handlePlayerMessage]);

  // ---------------------- Return JSX ----------------------
  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        {item.backdropPath && (
          <img
            src={buildImageUrl(item.backdropPath, 'original')}
            alt={item.title}
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-28 blur-[56px]"
          />
        )}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.84)_28%,rgba(0,0,0,0.96))]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <HeaderControls
          item={item}
          playerMode={playerMode}
          isInfoPanelOpen={isInfoPanelOpen}
          setIsInfoPanelOpen={setIsInfoPanelOpen}
          providerFlowEnabled={providerFlowEnabled}
          toggleProviderFlow={updateProviderFlow}
          openProviderPage={openProviderPage}
          onClose={onClose}
        />

        <main className="relative flex min-h-screen flex-1 px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[6.9rem] md:px-4 md:pb-4 md:pt-[7.9rem]">
          <section className="relative min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_36px_110px_rgba(0,0,0,0.5)]">
            <iframe
              key={`${playerFrameKey}-${playerMode}`}
              src={embedUrl}
              title={item.title}
              allow="autoplay; fullscreen; clipboard-write; picture-in-picture"
              allowFullScreen
              sandbox={iframeSandbox}
              className="absolute inset-0 h-full w-full border-none"
            />
          </section>

          {isInfoPanelOpen && (
            <aside className="relative z-20 mt-3 w-full space-y-3 md:mt-0 md:w-80 md:flex-shrink-0">
              <EpisodeSelector
                item={item}
                tvDetails={tvDetails}
                seasonData={seasonData}
                seasonNumber={seasonNumber}
                setSeasonNumber={setSeasonNumber}
                episodeNumber={episodeNumber}
                setEpisodeNumber={setEpisodeNumber}
                currentEpisode={currentEpisode}
              />
              <div className="rounded-[26px] border border-white/10 bg-black/24 p-4 text-[11px] text-white/42">
                {bridgeStatus}
              </div>
            </aside>
          )}
        </main>
      </div>
    </div>
  );
}
