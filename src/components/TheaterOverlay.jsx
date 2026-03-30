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
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth >= 1200;
}

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
      : 'Listening for PLAYER_EVENT progress updates',
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    function handleKeydown(event) {
      if (event.key === 'Escape') {
        if (isInfoPanelOpen) {
          setIsInfoPanelOpen(false);
          return;
        }

        onClose();
      }
    }

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isInfoPanelOpen, onClose]);

  useEffect(() => {
    let cancelled = false;

    async function loadTvMetadata() {
      if (item.mediaType !== 'tv') {
        setTvDetails(null);
        setSeasonData(null);
        return;
      }

      try {
        const details = await fetchTvDetails(item.id);

        if (cancelled) {
          return;
        }

        setTvDetails(details);

        const initialSeason =
          resumeEntry?.season ?? details.seasons[0]?.seasonNumber ?? 1;

        setSeasonNumber(initialSeason);
      } catch {
        if (!cancelled) {
          setBridgeStatus('Season metadata could not be loaded.');
        }
      }
    }

    void loadTvMetadata();

    return () => {
      cancelled = true;
    };
  }, [item.id, item.mediaType, resumeEntry?.season]);

  useEffect(() => {
    let cancelled = false;

    async function loadSeasonMetadata() {
      if (item.mediaType !== 'tv') {
        return;
      }

      try {
        const season = await fetchTvSeason(item.id, seasonNumber);

        if (cancelled) {
          return;
        }

        setSeasonData(season);

        const savedEpisode =
          resumeEntry?.season === seasonNumber ? resumeEntry?.episode : null;
        const fallbackEpisode = season.episodes[0]?.episodeNumber ?? 1;

        setEpisodeNumber((current) => {
          const preferredEpisode = current || savedEpisode || fallbackEpisode;
          const exists = season.episodes.some(
            (episode) => episode.episodeNumber === preferredEpisode,
          );

          return exists ? preferredEpisode : fallbackEpisode;
        });
      } catch {
        if (!cancelled) {
          setBridgeStatus('Episode metadata could not be loaded.');
        }
      }
    }

    void loadSeasonMetadata();

    return () => {
      cancelled = true;
    };
  }, [item.id, item.mediaType, resumeEntry?.episode, resumeEntry?.season, seasonNumber]);

  useEffect(() => {
    setPlayerMode('default');
    setPlayerFrameKey(0);
  }, [episodeNumber, item.id, item.mediaType, seasonNumber]);

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
  const currentEpisode = seasonData?.episodes?.find(
    (episode) => episode.episodeNumber === episodeNumber,
  );

  const updateProviderFlow = useEffectEvent((enabled, options = {}) => {
    onToggleProviderFlow?.(enabled);
    setPlayerFrameKey((current) => current + 1);
    setBridgeStatus(
      enabled
        ? 'Provider flow enabled. Reloaded with popup and redirect permissions.'
        : 'Provider flow blocked. Reloaded in the safe embedded mode.',
    );

    if (options.notify === false) {
      return;
    }

    onNotify?.({
      tone: enabled ? 'warning' : 'info',
      title: enabled ? 'Provider flow enabled' : 'Safe player mode restored',
      message: enabled
        ? 'This player can now open provider-controlled popups or redirects when a stream depends on them.'
        : 'Popups and redirects are blocked again for this player.',
      help: enabled
        ? 'Use this only when safe mode stalls. External provider pages are controlled by the third-party host.'
        : 'If playback still stalls, retry once or use the external provider button.',
    });
  });

  const openProviderPage = useEffectEvent(() => {
    const externalWindow = window.open(embedUrl, '_blank', 'noopener,noreferrer');

    if (!externalWindow) {
      onNotify?.(
        createAppError('VID-002', {
          message: 'Your browser blocked the provider page from opening in a new tab.',
          help:
            'Allow popups for Grubed or copy the provider URL into a new tab manually.',
        }),
      );
      return;
    }

    externalWindow.focus?.();
  });

  const retryInCompatibilityMode = useEffectEvent(() => {
    setPlayerMode('compatibility');
    setPlayerFrameKey((current) => current + 1);
    setBridgeStatus('Retrying the stream in compatibility mode.');
  });

  const emitPopupWarning = useEffectEvent(() => {
    onNotify?.(
      createAppError('VID-002', {
        message:
          'This stream may rely on a blocked popup or redirect. Grubed keeps those blocked by default.',
        help:
          'Enable Provider Flow for this player if you trust the host, or open the provider page in a new tab.',
        actionLabel: providerFlowEnabled ? 'Open Provider' : 'Allow Provider Flow',
        onAction: providerFlowEnabled
          ? () => openProviderPage()
          : () => updateProviderFlow(true, { notify: false }),
      }),
    );
  });

  const emitPlaybackError = useEffectEvent(() => {
    onNotify?.(
      createAppError('VID-001', {
        help:
          'Retry once in this window. If the stream still stalls, open the provider page in a new tab.',
        actionLabel: 'Open Provider',
        onAction: () => openProviderPage(),
      }),
    );
  });

  const handlePlayerMessage = useEffectEvent((messageEvent) => {
    const payload = parsePlayerEvent(messageEvent);

    if (!payload) {
      return;
    }

    if (String(payload.id) !== String(item.id)) {
      return;
    }

    if (item.mediaType === 'tv') {
      if (payload.season && payload.season !== seasonNumber) {
        return;
      }

      if (payload.episode && payload.episode !== episodeNumber) {
        return;
      }
    }

    const key = `${item.mediaType}_${item.id}`;

    if (payload.type === 'ended') {
      onClearProgress(key);
      setBridgeStatus('Playback ended. Removed from continue watching.');
      return;
    }

    if (!payload.duration || payload.currentTime < 5) {
      return;
    }

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
      `Synced ${formatPlaybackTime(payload.currentTime)} of ${formatPlaybackTime(
        payload.duration,
      )} to ${playerMode === 'compatibility' ? 'Grubed cache' : 'your library'}`,
    );
  });

  useEffect(() => {
    function onMessage(messageEvent) {
      handlePlayerMessage(messageEvent);
    }

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
    };
  }, [handlePlayerMessage]);

  useEffect(() => {
    let lastProgressSignalAt = Date.now();
    let lastWholeSecond = -1;
    let stagnantSignals = 0;
    let warned = false;
    let escalated = false;

    const interval = window.setInterval(() => {
      const silence = Date.now() - lastProgressSignalAt;

      if (silence < 12000) {
        return;
      }

      if (!warned && !providerFlowEnabled) {
        warned = true;
        emitPopupWarning();
      }

      if (playerMode === 'default') {
        retryInCompatibilityMode();
        return;
      }

      if (!escalated) {
        escalated = true;
        emitPlaybackError();
      }
    }, 3000);

    function recordProgress(messageEvent) {
      const payload = parsePlayerEvent(messageEvent);

      if (!payload || String(payload.id) !== String(item.id) || payload.type !== 'timeupdate') {
        return;
      }

      const wholeSecond = Math.floor(payload.currentTime ?? 0);
      lastProgressSignalAt = Date.now();

      if (wholeSecond === lastWholeSecond && wholeSecond >= 5) {
        stagnantSignals += 1;
      } else {
        lastWholeSecond = wholeSecond;
        stagnantSignals = 0;
      }

      if (stagnantSignals >= 3) {
        stagnantSignals = 0;

        if (!warned && !providerFlowEnabled) {
          warned = true;
          emitPopupWarning();
        }

        if (playerMode === 'default') {
          retryInCompatibilityMode();
        } else if (!escalated) {
          escalated = true;
          emitPlaybackError();
        }
      }
    }

    window.addEventListener('message', recordProgress);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('message', recordProgress);
    };
  }, [
    emitPlaybackError,
    emitPopupWarning,
    item.id,
    playerMode,
    providerFlowEnabled,
    retryInCompatibilityMode,
  ]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black text-white">
      <div className="absolute inset-0">
        {item.backdropPath ? (
          <img
            src={buildImageUrl(item.backdropPath, 'original')}
            alt={item.title}
            className="absolute inset-0 h-full w-full scale-105 object-cover opacity-28 blur-[56px]"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_35%),linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.84)_28%,rgba(0,0,0,0.96))]" />
      </div>

      <div className="relative flex min-h-screen flex-col">
        <header className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] md:px-5 md:pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="pointer-events-auto flex flex-wrap items-start justify-between gap-3 rounded-[28px] border border-white/10 bg-black/28 px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-2xl md:px-5">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.28em] text-white/42">
                Full-Window Playback
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <h2 className="truncate text-lg font-semibold text-white md:text-2xl">
                  {item.title}
                </h2>
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
                {resumeEntry ? <span>Resume {formatPlaybackTime(resumeEntry.progress)}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsInfoPanelOpen((current) => !current)}
                className="rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 transition-colors hover:text-white"
              >
                {isInfoPanelOpen ? 'Hide Details' : 'Show Details'}
              </button>
              <button
                type="button"
                onClick={() => updateProviderFlow(!providerFlowEnabled)}
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
                onClick={() => openProviderPage()}
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

        <main className="relative flex min-h-screen flex-1 px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[6.9rem] md:px-4 md:pb-4 md:pt-[7.9rem]">
          <section className="relative min-h-0 flex-1 overflow-hidden rounded-[32px] border border-white/10 bg-black shadow-[0_36px_110px_rgba(0,0,0,0.5)]">
            <iframe
              key={`${playerFrameKey}-${playerMode}-${seasonNumber}-${episodeNumber}-${providerFlowEnabled ? 'provider' : 'safe'}`}
              title={item.title}
              src={embedUrl}
              className="h-full w-full border-0"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="origin"
              sandbox={iframeSandbox}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/28 to-transparent" />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 p-3 md:p-5">
              <div className="pointer-events-auto flex flex-col gap-3 md:max-w-[min(68rem,calc(100%-24rem))]">
                <div className="rounded-[24px] border border-white/10 bg-black/34 px-4 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.24)] backdrop-blur-2xl">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/48">
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
                      {providerFlowEnabled ? 'Provider Flow Enabled' : 'Safe Embedded Mode'}
                    </span>
                    <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
                      {item.mediaType === 'tv' ? 'TV Bridge' : 'Movie Bridge'}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <p className="max-w-3xl text-sm leading-6 text-white/74">{bridgeStatus}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setPlayerFrameKey((current) => current + 1);
                          setBridgeStatus('Reloading the current stream.');
                        }}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 transition-colors hover:text-white"
                      >
                        <RefreshIcon className="h-4 w-4" />
                        Retry Stream
                      </button>
                      <button
                        type="button"
                        onClick={() => openProviderPage()}
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/78 transition-colors hover:text-white"
                      >
                        <ExternalLinkIcon className="h-4 w-4" />
                        Provider Page
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {isInfoPanelOpen ? (
            <div className="absolute inset-x-2 bottom-[max(1rem,env(safe-area-inset-bottom))] top-auto z-30 md:inset-y-4 md:right-4 md:left-auto md:w-[min(24rem,42vw)]">
              <aside className="glass-panel-strong flex max-h-[70vh] flex-col overflow-hidden rounded-[30px] border border-white/10 bg-black/38 shadow-[0_30px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl md:max-h-full">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                      Playback Controls
                    </div>
                    <div className="mt-1 text-lg font-semibold text-white">{item.title}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsInfoPanelOpen(false)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-white/68 transition-colors hover:text-white"
                    aria-label="Close details panel"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
                  <section className="flex items-start gap-4">
                    {item.posterPath ? (
                      <img
                        src={buildImageUrl(item.posterPath, 'w780')}
                        alt={item.title}
                        className="h-28 w-20 rounded-[22px] border border-white/10 object-cover shadow-[0_20px_40px_rgba(0,0,0,0.28)]"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/46">
                        <span>{getReleaseYear(item)}</span>
                        <span>{item.mediaType === 'tv' ? 'Series' : 'Movie'}</span>
                      </div>
                      <p className="mt-3 text-sm leading-7 text-white/68">{item.overview}</p>
                    </div>
                  </section>

                  {item.mediaType === 'tv' ? (
                    <section className="space-y-3 rounded-[26px] border border-white/10 bg-black/24 p-4">
                      <div className="text-[11px] uppercase tracking-[0.24em] text-white/42">
                        Episode Controls
                      </div>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-white">Season</span>
                        <select
                          value={seasonNumber}
                          onChange={(event) => setSeasonNumber(Number(event.target.value))}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                        >
                          {(tvDetails?.seasons ?? []).map((season) => (
                            <option key={season.seasonNumber} value={season.seasonNumber}>
                              {season.name || `Season ${season.seasonNumber}`}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block space-y-2">
                        <span className="text-sm font-medium text-white">Episode</span>
                        <select
                          value={episodeNumber}
                          onChange={(event) => setEpisodeNumber(Number(event.target.value))}
                          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white focus:border-white/20 focus:outline-none"
                        >
                          {(seasonData?.episodes ?? []).map((episode) => (
                            <option key={episode.episodeNumber} value={episode.episodeNumber}>
                              Episode {episode.episodeNumber}: {episode.name}
                            </option>
                          ))}
                        </select>
                      </label>

                      {currentEpisode ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                          <div className="text-sm font-semibold text-white">
                            {currentEpisode.name}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-white/58">
                            {currentEpisode.overview}
                          </p>
                        </div>
                      ) : null}
                    </section>
                  ) : (
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
                  )}

                  <section className="space-y-4 rounded-[26px] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white/82">
                        <ShieldIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                          Provider Flow
                        </div>
                        <div className="mt-1 text-lg font-semibold text-white">
                          {providerFlowEnabled ? 'Temporarily enabled' : 'Blocked by default'}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/64">
                          Some streams depend on provider popups or redirects. Grubed blocks them
                          by default for safety and only enables them when you opt in.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => updateProviderFlow(!providerFlowEnabled)}
                      className={`flex w-full items-center justify-between rounded-[22px] border px-4 py-3 text-left transition-colors ${
                        providerFlowEnabled
                          ? 'border-[#f1c26d]/40 bg-[#3a290e]/70 text-white'
                          : 'border-white/10 bg-white/[0.03] text-white/74 hover:text-white'
                      }`}
                    >
                      <div>
                        <div className="text-sm font-semibold">
                          {providerFlowEnabled ? 'Disable provider flow' : 'Enable provider flow'}
                        </div>
                        <div className="mt-1 text-xs leading-5 text-white/56">
                          This preference is saved for future sessions on this device.
                        </div>
                      </div>
                      <div
                        className={`h-6 w-11 rounded-full p-1 transition-colors ${
                          providerFlowEnabled ? 'bg-[#e50914]' : 'bg-white/14'
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-full bg-white transition-transform ${
                            providerFlowEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </button>
                  </section>

                  <section className="rounded-[26px] border border-[#f1c26d]/28 bg-[#37290f]/72 p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white">
                        <AlertCircleIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.22em] text-white/56">
                          External Provider
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/76">
                          External URLs open the provider&apos;s full page. Grubed is not
                          responsible for third-party content.
                        </p>
                        <button
                          type="button"
                          onClick={() => openProviderPage()}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/82 transition-colors hover:text-white"
                        >
                          <ExternalLinkIcon className="h-4 w-4" />
                          Open Provider in New Tab
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="rounded-[26px] border border-white/10 bg-black/24 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-white/82">
                        <SparklesIcon className="h-4.5 w-4.5" />
                      </div>
                      <div>
                        <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                          Recovery
                        </div>
                        <p className="mt-2 text-sm leading-6 text-white/64">
                          If the frame freezes after a few seconds, retry once here. Grubed will
                          also detect stalls and suggest a safer fallback automatically.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPlayerFrameKey((current) => current + 1);
                            setBridgeStatus('Reloading the current stream.');
                          }}
                          className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/82 transition-colors hover:text-white"
                        >
                          <RefreshIcon className="h-4 w-4" />
                          Retry Stream
                        </button>
                      </div>
                    </div>
                  </section>
                </div>
              </aside>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
