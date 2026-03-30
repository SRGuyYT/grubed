export const VIDKING_EMBED_BASE =
  import.meta.env.VITE_VIDKING_BASE || 'https://www.vidking.net/embed';

function extractPayload(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return null;
  }

  if (parsed.type === 'timeupdate' || parsed.type === 'ended') {
    return parsed;
  }

  if (
    (parsed.event === 'PLAYER_EVENT' ||
      parsed.type === 'PLAYER_EVENT' ||
      parsed.name === 'PLAYER_EVENT') &&
    parsed.data &&
    typeof parsed.data === 'object'
  ) {
    return parsed.data;
  }

  if (
    (parsed.event === 'PLAYER_EVENT' || parsed.type === 'PLAYER_EVENT') &&
    parsed.payload &&
    typeof parsed.payload === 'object'
  ) {
    return parsed.payload;
  }

  return null;
}

export function parsePlayerEvent(messageEvent) {
  if (messageEvent.origin) {
    try {
      const hostname = new URL(messageEvent.origin).hostname;
      if (!hostname.endsWith('vidking.net')) {
        return null;
      }
    } catch {
      return null;
    }
  }

  if (typeof messageEvent.data !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(messageEvent.data);
    const payload = extractPayload(parsed);
    const eventType = payload?.event ?? payload?.type;

    if (!payload || (eventType !== 'timeupdate' && eventType !== 'ended')) {
      return null;
    }

    return {
      type: eventType,
      currentTime: Number(
        payload.currentTime ?? payload.current ?? payload.time ?? 0,
      ),
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

export function buildVidkingEmbedUrl(
  item,
  seasonNumber = 1,
  episodeNumber = 1,
  options = 0,
) {
  const base = VIDKING_EMBED_BASE.replace(/\/$/, '');
  const normalizedOptions =
    typeof options === 'number'
      ? { progress: options, autoPlay: true }
      : {
          progress: options?.progress ?? 0,
          autoPlay: options?.autoPlay ?? true,
        };
  const params = new URLSearchParams({
    color: 'e50914',
  });

  if (normalizedOptions.autoPlay) {
    params.set('autoPlay', 'true');
  }

  if (normalizedOptions.progress > 0) {
    params.set('progress', String(Math.floor(normalizedOptions.progress)));
  }

  if (item.mediaType === 'tv') {
    params.set('nextEpisode', 'true');
    params.set('episodeSelector', 'true');
    return `${base}/tv/${item.id}/${seasonNumber}/${episodeNumber}?${params.toString()}`;
  }

  return `${base}/movie/${item.id}?${params.toString()}`;
}

export function formatPlaybackTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const wholeSeconds = Math.floor(seconds);
  const hours = Math.floor(wholeSeconds / 3600);
  const minutes = Math.floor((wholeSeconds % 3600) / 60);
  const remainingSeconds = wholeSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds,
    ).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

export function getProgressPercent(entry) {
  if (!entry?.duration || !entry?.progress) {
    return 0;
  }

  return Math.min(100, Math.round((entry.progress / entry.duration) * 100));
}
