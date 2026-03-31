export const VIDKING_EMBED_BASE =
  import.meta.env.VITE_VIDKING_BASE || 'https://www.vidking.net/embed';

/** Extract the actual payload from a parsed postMessage object */
function extractPayload(parsed) {
  if (!parsed || typeof parsed !== 'object') return null;

  // Directly usable event types
  if (parsed.type === 'timeupdate' || parsed.type === 'ended') return parsed;

  // Event may be nested inside `data` or `payload`
  const dataObj = parsed.data ?? parsed.payload;
  if (
    (parsed.event === 'PLAYER_EVENT' ||
      parsed.type === 'PLAYER_EVENT' ||
      parsed.name === 'PLAYER_EVENT') &&
    dataObj &&
    typeof dataObj === 'object'
  ) {
    return dataObj;
  }

  return null;
}

/**
 * Parse a postMessage from the player iframe
 * Returns structured playback info or null if invalid/untrusted
 */
export function parsePlayerEvent(messageEvent) {
  // Only allow messages from Vidking origin
  if (messageEvent.origin) {
    try {
      const hostname = new URL(messageEvent.origin).hostname;
      if (!hostname.endsWith('vidking.net')) return null;
    } catch {
      return null;
    }
  }

  if (typeof messageEvent.data !== 'string') return null;

  try {
    const parsed = JSON.parse(messageEvent.data);
    const payload = extractPayload(parsed);
    const eventType = payload?.event ?? payload?.type;

    if (!payload || (eventType !== 'timeupdate' && eventType !== 'ended')) return null;

    return {
      type: eventType,
      currentTime: Number(payload.currentTime ?? payload.current ?? payload.time ?? 0),
      duration: Number(payload.duration ?? payload.totalTime ?? 0),
      progress: Number(payload.progress ?? 0),
      id: payload.id ?? '',
      mediaType: payload.mediaType ?? '',
      season: Number(payload.season ?? 0),
      episode: Number(payload.episode ?? 0),
    };
  } catch {
    return null;
  }
}

/**
 * Build an embeddable Vidking URL for a movie or TV episode
 */
export function buildVidkingEmbedUrl(item, seasonNumber = 1, episodeNumber = 1, options = 0) {
  const base = VIDKING_EMBED_BASE.replace(/\/$/, '');

  const normalizedOptions =
    typeof options === 'number'
      ? { progress: options, autoPlay: true }
      : { progress: options?.progress ?? 0, autoPlay: options?.autoPlay ?? true };

  const params = new URLSearchParams({ color: 'e50914' });
  if (normalizedOptions.autoPlay) params.set('autoPlay', 'true');
  if (normalizedOptions.progress > 0) params.set('progress', String(Math.floor(normalizedOptions.progress)));

  if (item.mediaType === 'tv') {
    params.set('nextEpisode', 'true');
    params.set('episodeSelector', 'true');
    return `${base}/tv/${item.id}/${seasonNumber}/${episodeNumber}?${params.toString()}`;
  }

  return `${base}/movie/${item.id}?${params.toString()}`;
}

/** Format playback time (seconds) as H:MM:SS or M:SS */
export function formatPlaybackTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00';

  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
    : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

/** Compute percentage progress of a playback entry */
export function getProgressPercent(entry) {
  if (!entry?.duration || !entry?.progress) return 0;
  return Math.min(100, Math.round((entry.progress / entry.duration) * 100));
}
