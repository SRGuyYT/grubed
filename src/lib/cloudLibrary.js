import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

function watchlistRef(userId) {
  return doc(db, 'users', userId, 'library', 'watchlist');
}

function continueWatchingRef(userId) {
  return doc(db, 'users', userId, 'library', 'continueWatching');
}

function normalizeMap(value) {
  return value && typeof value === 'object' ? value : {};
}

export async function loadRemoteLibrary(userId) {
  if (!userId) {
    return {
      watchlist: {},
      continueWatching: {},
    };
  }

  const [watchlistSnapshot, continueWatchingSnapshot] = await Promise.all([
    getDoc(watchlistRef(userId)),
    getDoc(continueWatchingRef(userId)),
  ]);

  return {
    watchlist: normalizeMap(watchlistSnapshot.data()?.items),
    continueWatching: normalizeMap(continueWatchingSnapshot.data()?.items),
  };
}

export async function syncRemoteWatchlist(userId, watchlist) {
  if (!userId) {
    return;
  }

  await setDoc(
    watchlistRef(userId),
    {
      items: watchlist,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export async function syncRemoteContinueWatching(userId, continueWatching) {
  if (!userId) {
    return;
  }

  await setDoc(
    continueWatchingRef(userId),
    {
      items: continueWatching,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
