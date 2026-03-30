import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { AccountPage } from './components/AccountPage';
import { BottomNav } from './components/BottomNav';
import { BrowseFeedPage } from './components/BrowseFeedPage';
import { DetailPage } from './components/DetailPage';
import { DocsPage } from './components/DocsPage';
import { HomePage } from './components/HomePage';
import { NotificationCenter } from './components/NotificationCenter';
import { SettingsPage } from './components/SettingsPage';
import { SplashScreen } from './components/SplashScreen';
import { TheaterOverlay } from './components/TheaterOverlay';
import { WatchlistPage } from './components/WatchlistPage';
import { FEED_CONFIG, SEARCHABLE_SECTIONS } from './lib/appConfig';
import {
  applyFilters,
  buildGenreOptions,
  continueEntryToMediaItem,
  createFeedState,
  dedupeItems,
  dedupeRows,
  DEFAULT_FILTERS,
  getItemKey,
  getRouteKey,
  getTopGenreIds,
  mergeMediaLists,
  searchScopeFromSection,
  shuffleItems,
} from './lib/appHelpers';
import { loadRemoteLibrary, syncRemoteContinueWatching, syncRemoteWatchlist } from './lib/cloudLibrary';
import { loadSession, loginAccount, logoutAccount, observeSession, registerAccount } from './lib/auth';
import { BRAND_NAME, GUEST_SCOPE } from './lib/brand';
import {
  listContinueWatching,
  loadContinueWatching,
  mergeContinueWatchingMaps,
  persistContinueWatchingMap,
  upsertContinueWatchingEntry,
} from './lib/continueWatching';
import { createAppError, ERROR_DEFINITIONS, mapAuthError, mapNetworkError } from './lib/errors';
import { firebaseConfig, getFirebaseConfigIssues } from './lib/firebase';
import {
  applyPreferencesToDocument,
  loadPreferences,
  loadRemotePreferences,
  persistPreferences,
  syncRemotePreferences,
} from './lib/preferences';
import { VIDKING_EMBED_BASE } from './lib/playerBridge';
import { getDetailsPath, getSectionPath, parseRoute } from './lib/routes';
import {
  fetchGenres,
  fetchMediaList,
  IMAGE_BASE,
  searchCatalog,
  TMDB_API_BASE,
  TMDB_API_KEY,
  TMDB_PROXY_BASE,
} from './lib/tmdb';
import {
  listWatchlist,
  loadWatchlist,
  mergeWatchlistMaps,
  persistWatchlistMap,
  toggleWatchlistEntryInMap,
} from './lib/watchlist';

export default function App() {
  const initialSession = loadSession();
  const initialScope = initialSession?.userId ?? GUEST_SCOPE;
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [session, setSession] = useState(initialSession);
  const [isSessionReady, setIsSessionReady] = useState(Boolean(initialSession));
  const [authError, setAuthError] = useState('');
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [syncNotice, setSyncNotice] = useState('Guest mode: saved on this device.');
  const [playerItem, setPlayerItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filtersBySection, setFiltersBySection] = useState({
    movies: DEFAULT_FILTERS,
    series: DEFAULT_FILTERS,
  });
  const [genresBySection, setGenresBySection] = useState({ movies: [], series: [] });
  const [homeData, setHomeData] = useState({
    rows: [],
    featuredItems: [],
    isLoading: true,
    error: '',
  });
  const [feeds, setFeeds] = useState({ movies: createFeedState(), series: createFeedState() });
  const [preferences, setPreferences] = useState(() => loadPreferences(initialScope));
  const [preferencesStatus, setPreferencesStatus] = useState('Preferences save on this device.');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [lastContentPath, setLastContentPath] = useState(() => {
    const currentRoute = parseRoute(window.location.pathname);
    return currentRoute.type === 'details' ? getSectionPath('home') : window.location.pathname;
  });
  const storageScope = session?.userId ?? GUEST_SCOPE;
  const [continueMap, setContinueMap] = useState(() => loadContinueWatching(storageScope));
  const [watchlistMap, setWatchlistMap] = useState(() => loadWatchlist(storageScope));
  const deferredQuery = useDeferredValue(query.trim());
  const route = parseRoute(pathname);
  const progressSyncRef = useRef({});

  const continueEntries = useMemo(() => listContinueWatching(continueMap), [continueMap]);
  const watchlistEntries = useMemo(() => listWatchlist(watchlistMap), [watchlistMap]);
  const historyItems = useMemo(
    () =>
      dedupeItems([
        ...watchlistEntries.map(({ key, ...item }) => item),
        ...continueEntries.map(continueEntryToMediaItem),
      ]),
    [continueEntries, watchlistEntries],
  );
  const historySignature = useMemo(
    () =>
      historyItems
        .map((item) => `${getItemKey(item)}:${(item.genreIds ?? []).join(',')}`)
        .sort()
        .join('|'),
    [historyItems],
  );

  function pushNotification(notification) {
    setNotifications((current) => {
      const next = notification.id
        ? notification
        : { ...notification, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };

      return [
        next,
        ...current.filter(
          (entry) => !(entry.code === next.code && entry.message === next.message),
        ),
      ].slice(0, 4);
    });
  }

  function dismissNotification(id) {
    setNotifications((current) => current.filter((item) => item.id !== id));
  }

  function commitNavigation(path) {
    if (window.location.pathname === path) {
      return;
    }

    window.history.pushState({}, '', path);
    setPathname(path);
  }

  function navigate(path) {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => {
        commitNavigation(path);
      });
      return;
    }

    commitNavigation(path);
  }

  useEffect(() => {
    const unsubscribe = observeSession((nextSession) => {
      setSession(nextSession);
      setIsSessionReady(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handlePopState() {
      setPathname(window.location.pathname);
    }

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const issues = getFirebaseConfigIssues();

    if (issues.length) {
      pushNotification(
        createAppError('CFG-001', {
          message: 'Firebase client config is incomplete.',
          help: issues.join(' '),
        }),
      );
    }
  }, []);

  useEffect(() => {
    if (route.type !== 'landing') {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      navigate(getSectionPath('home'));
    }, 1600);

    return () => {
      window.clearTimeout(timer);
    };
  }, [route.type]);

  useEffect(() => {
    if (route.type !== 'details' && route.type !== 'landing') {
      setLastContentPath(pathname);
    }
  }, [pathname, route.type]);

  useEffect(() => {
    if (!(route.type === 'section' && SEARCHABLE_SECTIONS.has(route.section)) && query) {
      setQuery('');
    }
  }, [query, route.section, route.type]);

  useEffect(() => {
    async function loadGenres() {
      try {
        const [movieGenres, tvGenres] = await Promise.all([fetchGenres('movie'), fetchGenres('tv')]);
        setGenresBySection({
          movies: buildGenreOptions('movie', movieGenres),
          series: buildGenreOptions('tv', tvGenres),
        });
      } catch {
        pushNotification(mapNetworkError(new Error('Genre metadata could not be loaded.')));
      }
    }

    void loadGenres();
  }, []);

  useEffect(() => {
    progressSyncRef.current = {};
    setContinueMap(loadContinueWatching(storageScope));
    setWatchlistMap(loadWatchlist(storageScope));

    if (!session?.userId) {
      setSyncNotice('Guest mode: saved on this device.');
      return undefined;
    }

    let cancelled = false;

    async function hydrateLibrary() {
      setSyncNotice('Syncing your Grubed library...');

      try {
        const remoteLibrary = await loadRemoteLibrary(session.userId);
        if (cancelled) return;

        const mergedContinue = mergeContinueWatchingMaps(
          remoteLibrary.continueWatching,
          loadContinueWatching(session.userId),
          loadContinueWatching(GUEST_SCOPE),
        );
        const mergedWatchlist = mergeWatchlistMaps(
          remoteLibrary.watchlist,
          loadWatchlist(session.userId),
          loadWatchlist(GUEST_SCOPE),
        );

        persistContinueWatchingMap(mergedContinue, session.userId);
        persistWatchlistMap(mergedWatchlist, session.userId);
        setContinueMap(mergedContinue);
        setWatchlistMap(mergedWatchlist);

        await Promise.all([
          syncRemoteContinueWatching(session.userId, mergedContinue),
          syncRemoteWatchlist(session.userId, mergedWatchlist),
        ]);

        if (!cancelled) {
          setSyncNotice('Firebase sync is live for this account.');
        }
      } catch {
        if (!cancelled) {
          setSyncNotice(
            'Cloud library sync is unavailable. Grubed will save locally until Firestore is ready.',
          );
        }
      }
    }

    void hydrateLibrary();

    return () => {
      cancelled = true;
    };
  }, [session?.userId, storageScope]);

  useEffect(() => {
    const localPreferences = loadPreferences(storageScope);
    setPreferences(localPreferences);
    applyPreferencesToDocument(localPreferences);

    if (!session?.userId) {
      setPreferencesStatus('Preferences save on this device.');
      return undefined;
    }

    let cancelled = false;

    async function hydratePreferences() {
      try {
        const remotePreferences = await loadRemotePreferences(session.userId);
        if (cancelled) return;

        const mergedPreferences = { ...localPreferences, ...remotePreferences };
        persistPreferences(mergedPreferences, storageScope);
        setPreferences(mergedPreferences);
        applyPreferencesToDocument(mergedPreferences);
        setPreferencesStatus('Preferences sync to your account.');
      } catch {
        if (!cancelled) {
          setPreferencesStatus('Preferences save locally until Firestore is ready.');
        }
      }
    }

    void hydratePreferences();
    return () => {
      cancelled = true;
    };
  }, [session?.userId, storageScope]);

  useEffect(() => {
    applyPreferencesToDocument(preferences);
  }, [preferences]);

  useEffect(() => {
    async function loadHome() {
      setHomeData((current) => ({ ...current, isLoading: true, error: '' }));

      try {
        const [topMovies, topSeries, trendingWeekly] = await Promise.all([
          fetchMediaList('/movie/top_rated', 'movie'),
          fetchMediaList('/tv/top_rated', 'tv'),
          fetchMediaList('/trending/all/week', 'all'),
        ]);

        const movieGenres = getTopGenreIds(historyItems, 'movie');
        const tvGenres = getTopGenreIds(historyItems, 'tv');
        const recommendationRequests = [];

        if (movieGenres.length) {
          recommendationRequests.push(
            fetchMediaList('/discover/movie', 'movie', {
              with_genres: movieGenres.join(','),
              sort_by: 'popularity.desc',
            }),
          );
        }

        if (tvGenres.length) {
          recommendationRequests.push(
            fetchMediaList('/discover/tv', 'tv', {
              with_genres: tvGenres.join(','),
              sort_by: 'popularity.desc',
            }),
          );
        }

        const recommendationGroups = recommendationRequests.length
          ? await Promise.all(recommendationRequests)
          : [];
        const personalizedItems = dedupeItems(
          recommendationGroups.flat().length
            ? recommendationGroups.flat()
            : [...topMovies.slice(0, 10), ...topSeries.slice(0, 10), ...trendingWeekly],
        ).slice(0, 14);

        setHomeData({
          rows: [
            {
              id: 'top-ten-movies',
              title: 'Top 10 Movies',
              description: 'The strongest movie picks in the catalog right now.',
              items: topMovies.slice(0, 10),
            },
            {
              id: 'top-ten-series',
              title: 'Top 10 Series',
              description: 'High-retention series and binge-ready standouts.',
              items: topSeries.slice(0, 10),
            },
            {
              id: 'for-you',
              title: session ? 'Because You Watch' : 'Recommended For You',
              description: 'Recommendations shaped by your saved titles and recent history.',
              items: personalizedItems,
            },
            {
              id: 'random-picks',
              title: 'Random Featured Picks',
              description: 'A rotating sample from the current weekly trendline.',
              items: shuffleItems(trendingWeekly).slice(0, 14),
            },
          ],
          featuredItems: shuffleItems(trendingWeekly.filter((item) => item.backdropPath)).slice(0, 5),
          isLoading: false,
          error: '',
        });
      } catch (error) {
        setHomeData({ rows: [], featuredItems: [], isLoading: false, error: 'Home recommendations could not be loaded.' });
        pushNotification(mapNetworkError(error, { message: 'Home recommendations could not be loaded.' }));
      }
    }

    void loadHome();
  }, [historySignature, session?.userId]);

  async function loadFeedPage(section, replace = false) {
    const config = FEED_CONFIG[section];
    if (!config) return;

    const current = feeds[section];
    if (!replace && (current.isLoading || current.isLoadingMore || !current.hasMore)) return;
    const nextPage = replace ? 1 : current.page + 1;

    setFeeds((existing) => ({
      ...existing,
      [section]: {
        ...existing[section],
        isLoading: replace,
        isLoadingMore: !replace,
        error: '',
      },
    }));

    try {
      const incoming = await fetchMediaList(config.endpoint, config.mediaType, { page: nextPage });

      setFeeds((existing) => ({
        ...existing,
        [section]: {
          ...existing[section],
          items: replace ? incoming : mergeMediaLists(existing[section].items, incoming),
          page: nextPage,
          hasMore: incoming.length > 0,
          isLoading: false,
          isLoadingMore: false,
          error: '',
        },
      }));
    } catch (error) {
      setFeeds((existing) => ({
        ...existing,
        [section]: {
          ...existing[section],
          isLoading: false,
          isLoadingMore: false,
          error: `${config.title} feed unavailable.`,
        },
      }));
      pushNotification(mapNetworkError(error, { message: `${config.title} feed unavailable.` }));
    }
  }

  useEffect(() => {
    if (route.type === 'section' && FEED_CONFIG[route.section] && !feeds[route.section].page) {
      void loadFeedPage(route.section, true);
    }
  }, [feeds, route.section, route.type]);

  useEffect(() => {
    if (!(route.type === 'section' && SEARCHABLE_SECTIONS.has(route.section))) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (deferredQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;

    async function loadSearch() {
      setIsSearching(true);

      try {
        const results = await searchCatalog(deferredQuery, searchScopeFromSection(route.section));
        if (!cancelled) {
          setSearchResults(results.slice(0, 36));
        }
      } catch (error) {
        if (!cancelled) {
          setSearchResults([]);
          pushNotification(mapNetworkError(error, { message: 'Search request failed.' }));
        }
      } finally {
        if (!cancelled) {
          setIsSearching(false);
        }
      }
    }

    void loadSearch();
    return () => {
      cancelled = true;
    };
  }, [deferredQuery, route.section, route.type]);

  function handleNavigateSection(section) {
    startTransition(() => {
      setQuery('');
      navigate(getSectionPath(section));
    });
  }

  function handleOpenDetails(item) {
    startTransition(() => {
      navigate(getDetailsPath(item.mediaType, item.id));
    });
  }

  function handleBackFromDetails() {
    startTransition(() => {
      navigate(lastContentPath || getSectionPath('home'));
    });
  }

  function handleChangePreference(field, value) {
    setPreferences((current) => {
      const next = persistPreferences({ ...current, [field]: value }, storageScope);
      setPreferencesStatus(
        session?.userId ? 'Unsynced preference changes.' : 'Preferences saved on this device.',
      );
      return next;
    });
  }

  async function handleSavePreferences() {
    setIsSavingPreferences(true);

    try {
      persistPreferences(preferences, storageScope);

      if (session?.userId) {
        await syncRemotePreferences(session.userId, preferences);
        setPreferencesStatus('Preferences sync to your account.');
      } else {
        setPreferencesStatus('Preferences saved on this device.');
      }
    } catch {
      setPreferencesStatus('Preferences save locally until Firestore is ready.');
      pushNotification(mapNetworkError(new Error('Preferences could not be synced.')));
    } finally {
      setIsSavingPreferences(false);
    }
  }

  function handleFilterChange(field, value) {
    if (!(route.type === 'section' && FEED_CONFIG[route.section])) return;

    setFiltersBySection((current) => ({
      ...current,
      [route.section]: { ...current[route.section], [field]: value },
    }));
  }

  function handleResetFilters() {
    if (!(route.type === 'section' && FEED_CONFIG[route.section])) return;

    setFiltersBySection((current) => ({
      ...current,
      [route.section]: DEFAULT_FILTERS,
    }));
  }

  function handlePlay(item) {
    setPlayerItem(item);
  }

  function handlePersistProgress(entry) {
    const entryKey = `${entry.type}_${entry.id}`;

    setContinueMap((current) => {
      const next = persistContinueWatchingMap(
        upsertContinueWatchingEntry(current, entry),
        storageScope,
      );

      if (session?.userId) {
        const now = Date.now();
        const lastSync = progressSyncRef.current[entryKey] ?? 0;
        const shouldSync = now - lastSync >= 15000 || (entry.duration ?? 0) - (entry.progress ?? 0) <= 90;

        if (shouldSync) {
          progressSyncRef.current[entryKey] = now;
          void syncRemoteContinueWatching(session.userId, next).catch(() => {
            setSyncNotice('Cloud library sync is unavailable. Grubed will save locally until Firestore is ready.');
          });
        }
      }

      return next;
    });
  }

  function handleClearProgress(key) {
    delete progressSyncRef.current[key];

    setContinueMap((current) => {
      if (!current[key]) return current;

      const next = { ...current };
      delete next[key];
      persistContinueWatchingMap(next, storageScope);

      if (session?.userId) {
        void syncRemoteContinueWatching(session.userId, next).catch(() => {
          setSyncNotice('Cloud library sync is unavailable. Grubed will save locally until Firestore is ready.');
        });
      }

      return next;
    });
  }

  function handleToggleWatchlist(item) {
    setWatchlistMap((current) => {
      const next = persistWatchlistMap(toggleWatchlistEntryInMap(current, item), storageScope);

      if (session?.userId) {
        void syncRemoteWatchlist(session.userId, next).catch(() => {
          setSyncNotice('Cloud library sync is unavailable. Grubed will save locally until Firestore is ready.');
        });
      }

      return next;
    });
  }

  async function handleRegister(credentials) {
    setIsAuthPending(true);
    setAuthError('');

    try {
      const nextSession = await registerAccount(credentials);
      setSession(nextSession);
      setSyncNotice('Connecting your account...');
    } catch (error) {
      const appError = mapAuthError(error);
      setAuthError(appError.message);
      pushNotification(appError);
    } finally {
      setIsAuthPending(false);
    }
  }

  async function handleLogin(credentials) {
    setIsAuthPending(true);
    setAuthError('');

    try {
      const nextSession = await loginAccount(credentials);
      setSession(nextSession);
      setSyncNotice('Connecting your account...');
    } catch (error) {
      const appError = mapAuthError(error);
      setAuthError(appError.message);
      pushNotification(appError);
    } finally {
      setIsAuthPending(false);
    }
  }

  async function handleLogout() {
    setIsAuthPending(true);
    setAuthError('');

    try {
      await logoutAccount();
      setSession(null);
    } catch (error) {
      const appError = mapAuthError(error);
      setAuthError(appError.message);
      pushNotification(appError);
    } finally {
      setIsAuthPending(false);
    }
  }

  const continueRow = continueEntries.length
    ? {
        id: 'continue-watching',
        title: 'Continue Watching',
        description: session?.userId
          ? 'Recent playback synced from theater mode and linked to your account.'
          : 'Recent playback saved locally on this device.',
        items: continueEntries.map(continueEntryToMediaItem),
      }
    : null;
  const homeRows = useMemo(
    () => dedupeRows(continueRow ? [continueRow, ...homeData.rows] : homeData.rows),
    [continueRow, homeData.rows],
  );
  const currentFeed = route.type === 'section' && FEED_CONFIG[route.section] ? feeds[route.section] : createFeedState();
  const currentFilters =
    route.type === 'section' && FEED_CONFIG[route.section]
      ? filtersBySection[route.section]
      : DEFAULT_FILTERS;
  const currentGenres =
    route.type === 'section' && FEED_CONFIG[route.section]
      ? genresBySection[route.section]
      : [];
  const visibleFeedItems = applyFilters(currentFeed.items, currentFilters);
  const visibleSearchResults =
    route.type === 'section' && FEED_CONFIG[route.section]
      ? applyFilters(searchResults, currentFilters)
      : searchResults;
  const watchlistItems = watchlistEntries.map(({ key, ...item }) => item);
  const activeBottomSection =
    route.type === 'section'
      ? route.section === 'docs'
        ? 'settings'
        : route.section
      : route.type === 'details'
        ? (() => {
            const previous = parseRoute(lastContentPath);
            return previous.type === 'section'
              ? previous.section === 'docs'
                ? 'settings'
                : previous.section
              : 'home';
          })()
        : 'home';

  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />

      {route.type === 'landing' ? (
        <SplashScreen />
      ) : (
        <>
          <main className="relative z-10 px-4 pb-32 pt-4 md:px-6 lg:px-8">
            <div key={getRouteKey(route)} className="route-stage mx-auto max-w-[1180px]">
              {route.type === 'section' && route.section === 'home' ? (
                <HomePage
                  featuredItems={homeData.featuredItems}
                  rows={homeRows}
                  isLoading={homeData.isLoading}
                  inlineError={homeData.error}
                  query={query}
                  onQueryChange={setQuery}
                  searchResults={visibleSearchResults}
                  isSearching={isSearching}
                  continueMap={continueMap}
                  watchlistMap={watchlistMap}
                  onPlay={handlePlay}
                  onOpenDetails={handleOpenDetails}
                  onToggleWatchlist={handleToggleWatchlist}
                  session={session}
                />
              ) : null}

              {route.type === 'section' && FEED_CONFIG[route.section] ? (
                <BrowseFeedPage
                  title={FEED_CONFIG[route.section].title}
                  description={FEED_CONFIG[route.section].description}
                  query={query}
                  onQueryChange={setQuery}
                  filters={currentFilters}
                  genres={currentGenres}
                  onFilterChange={handleFilterChange}
                  onResetFilters={handleResetFilters}
                  items={visibleFeedItems}
                  searchResults={visibleSearchResults}
                  isSearching={isSearching}
                  continueMap={continueMap}
                  watchlistMap={watchlistMap}
                  onPlay={handlePlay}
                  onOpenDetails={handleOpenDetails}
                  onToggleWatchlist={handleToggleWatchlist}
                  hasMore={currentFeed.hasMore}
                  onLoadMore={() => loadFeedPage(route.section)}
                  isLoadingMore={currentFeed.isLoadingMore}
                  inlineError={currentFeed.error}
                  isInitialLoading={currentFeed.isLoading}
                />
              ) : null}

              {route.type === 'section' && route.section === 'watchlist' ? (
                <WatchlistPage
                  items={watchlistItems}
                  continueMap={continueMap}
                  watchlistMap={watchlistMap}
                  onPlay={handlePlay}
                  onOpenDetails={handleOpenDetails}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              ) : null}

              {route.type === 'section' && route.section === 'settings' ? (
                <SettingsPage
                  preferences={preferences}
                  onChangePreference={handleChangePreference}
                  onSavePreferences={handleSavePreferences}
                  isSaving={isSavingPreferences}
                  syncStatus={preferencesStatus}
                  onOpenDocs={() => navigate(getSectionPath('docs'))}
                  accountNode={
                    <AccountPage
                      session={session}
                      isSessionReady={isSessionReady}
                      isPending={isAuthPending}
                      authError={authError}
                      syncNotice={syncNotice}
                      watchlistCount={watchlistEntries.length}
                      continueCount={continueEntries.length}
                      onLogin={handleLogin}
                      onRegister={handleRegister}
                      onLogout={handleLogout}
                    />
                  }
                />
              ) : null}

              {route.type === 'section' && route.section === 'docs' ? (
                <DocsPage
                  docsMeta={{
                    tmdbProxyBase: TMDB_PROXY_BASE,
                    tmdbApiBase: TMDB_API_BASE,
                    tmdbApiKey: TMDB_API_KEY,
                    imageBase: IMAGE_BASE,
                    playerBase: VIDKING_EMBED_BASE,
                    firebaseConfig,
                    firebaseProjectId: firebaseConfig.projectId,
                    errorDefinitions: ERROR_DEFINITIONS,
                  }}
                />
              ) : null}

              {route.type === 'details' ? (
                <DetailPage
                  mediaType={route.mediaType}
                  id={route.id}
                  continueMap={continueMap}
                  watchlistMap={watchlistMap}
                  onBack={handleBackFromDetails}
                  onPlay={handlePlay}
                  onOpenDetails={handleOpenDetails}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              ) : null}

              <footer className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.03] px-5 py-4 text-[11px] uppercase tracking-[0.24em] text-white/34">
                {BRAND_NAME}. Mobile-first liquid glass shell, account sync, infinite feeds, and in-app docs.
              </footer>
            </div>
          </main>

          <BottomNav
            activeSection={activeBottomSection}
            watchlistCount={watchlistEntries.length}
            onNavigate={handleNavigateSection}
          />
        </>
      )}

      {playerItem ? (
        <TheaterOverlay
          item={playerItem}
          resumeEntry={continueMap[getItemKey(playerItem)]}
          providerFlowEnabled={preferences.providerFlow === 'enabled'}
          onClose={() => setPlayerItem(null)}
          onPersistProgress={handlePersistProgress}
          onClearProgress={handleClearProgress}
          onToggleProviderFlow={(enabled) =>
            handleChangePreference('providerFlow', enabled ? 'enabled' : 'blocked')
          }
          onNotify={pushNotification}
        />
      ) : null}
    </div>
  );
}
