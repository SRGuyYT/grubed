import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';

/** Firestore reference for a user's watchlist */
function watchlistRef(userId) {
  return doc(db, 'users', userId, 'library', 'watchlist');
}

/** Firestore reference for a user's continue watching list */
function continueWatchingRef(userId) {
  return doc(db, 'users', userId, 'library', 'continueWatching');
}

/** Safely normalize a Firestore map object */
function normalizeMap(value) {
  return value && typeof value === 'object' ? value : {};
}

/**
 * Load a user's library from Firestore.
 * Returns both watchlist and continueWatching maps.
 */
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

/** Sync a user's watchlist to Firestore */
export async function syncRemoteWatchlist(userId, watchlist) {
  if (!userId) return;

  await setDoc(
    watchlistRef(userId),
    {
      items: watchlist,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** Sync a user's continue watching list to Firestore */
export async function syncRemoteContinueWatching(userId, continueWatching) {
  if (!userId) return;

  await setDoc(
    continueWatchingRef(userId),
    {
      items: continueWatching,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
