import { useState, useEffect, useMemo, useRef, startTransition, useDeferredValue } from "react";
import {
  AccountPage,
  BottomNav,
  BrowseFeedPage,
  DetailPage,
  DocsPage,
  HomePage,
  NotificationCenter,
  SettingsPage,
  SplashScreen,
  TheaterOverlay,
  WatchlistPage,
} from "./components";
import { FEED_CONFIG, SEARCHABLE_SECTIONS } from "./lib/appConfig";
import {
  applyFilters,
  dedupeItems,
  dedupeRows,
  continueEntryToMediaItem,
  mergeMediaLists,
} from "./lib/appHelpers";
import { parseRoute, getSectionPath, getDetailsPath } from "./lib/routes";
import { loadSession, observeSession, loginAccount, logoutAccount, registerAccount } from "./lib/auth";
import {
  loadContinueWatching,
  persistContinueWatchingMap,
  upsertContinueWatchingEntry,
  listContinueWatching,
} from "./lib/continueWatching";
import {
  loadWatchlist,
  persistWatchlistMap,
  toggleWatchlistEntryInMap,
  listWatchlist,
} from "./lib/watchlist";
import {
  loadPreferences,
  persistPreferences,
  applyPreferencesToDocument,
  syncRemotePreferences,
  loadRemotePreferences,
} from "./lib/preferences";
import { loadRemoteLibrary, syncRemoteContinueWatching, syncRemoteWatchlist } from "./lib/cloudLibrary";
import { fetchGenres, fetchMediaList, searchCatalog } from "./lib/tmdb";
import { createAppError, mapAuthError, mapNetworkError } from "./lib/errors";
import { BRAND_NAME, GUEST_SCOPE } from "./lib/brand";
import { VIDKING_EMBED_BASE } from "./lib/playerBridge";

export default function App() {
  /** -----------------------------
   *  State Initialization
   ----------------------------- */
  const initialSession = loadSession();
  const storageScope = initialSession?.userId ?? GUEST_SCOPE;
  const [session, setSession] = useState(initialSession);
  const [isSessionReady, setIsSessionReady] = useState(Boolean(initialSession));
  const [pathname, setPathname] = useState(window.location.pathname);
  const [authError, setAuthError] = useState("");
  const [isAuthPending, setIsAuthPending] = useState(false);
  const [syncNotice, setSyncNotice] = useState("Guest mode: saved on this device.");
  const [playerItem, setPlayerItem] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query.trim());

  const [preferences, setPreferences] = useState(() => loadPreferences(storageScope));
  const [preferencesStatus, setPreferencesStatus] = useState("Preferences saved locally.");
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);

  const [continueMap, setContinueMap] = useState(() => loadContinueWatching(storageScope));
  const [watchlistMap, setWatchlistMap] = useState(() => loadWatchlist(storageScope));

  const [genresBySection, setGenresBySection] = useState({ movies: [], series: [] });
  const [filtersBySection, setFiltersBySection] = useState({ movies: {}, series: {} });

  const [homeData, setHomeData] = useState({ rows: [], featuredItems: [], isLoading: true, error: "" });
  const [feeds, setFeeds] = useState({ movies: { items: [], page: 0, hasMore: true }, series: { items: [], page: 0, hasMore: true } });
  const progressSyncRef = useRef({});

  const route = parseRoute(pathname);

  /** -----------------------------
   *  Memoized Data
   ----------------------------- */
  const continueEntries = useMemo(() => listContinueWatching(continueMap), [continueMap]);
  const watchlistEntries = useMemo(() => listWatchlist(watchlistMap), [watchlistMap]);

  const historyItems = useMemo(
    () =>
      dedupeItems([
        ...watchlistEntries.map(({ key, ...item }) => item),
        ...continueEntries.map(continueEntryToMediaItem),
      ]),
    [watchlistEntries, continueEntries]
  );

  const historySignature = useMemo(
    () =>
      historyItems
        .map((item) => `${item.id}:${(item.genreIds ?? []).join(",")}`)
        .sort()
        .join("|"),
    [historyItems]
  );

  /** -----------------------------
   *  Notifications
   ----------------------------- */
  function pushNotification(notification) {
    setNotifications((current) => {
      const next = notification.id
        ? notification
        : { ...notification, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}` };
      return [next, ...current.filter((n) => n.id !== next.id)].slice(0, 4);
    });
  }

  function dismissNotification(id) {
    setNotifications((current) => current.filter((n) => n.id !== id));
  }

  /** -----------------------------
   *  Navigation
   ----------------------------- */
  function commitNavigation(path) {
    if (window.location.pathname === path) return;
    window.history.pushState({}, "", path);
    setPathname(path);
  }

  function navigate(path) {
    if ("startViewTransition" in document) {
      document.startViewTransition(() => commitNavigation(path));
    } else commitNavigation(path);
  }

  /** -----------------------------
   *  Effects
   ----------------------------- */
  useEffect(() => observeSession(setSession), []);

  useEffect(() => {
    const handlePop = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);

  useEffect(() => {
    async function fetchGenresData() {
      try {
        const [movieGenres, tvGenres] = await Promise.all([fetchGenres("movie"), fetchGenres("tv")]);
        setGenresBySection({ movies: movieGenres, series: tvGenres });
      } catch {
        pushNotification(mapNetworkError(new Error("Genres could not load")));
      }
    }
    fetchGenresData();
  }, []);

  /** -----------------------------
   *  Home & Feeds
   ----------------------------- */
  useEffect(() => {
    async function loadHomeData() {
      setHomeData((prev) => ({ ...prev, isLoading: true }));
      try {
        const [topMovies, topSeries, trending] = await Promise.all([
          fetchMediaList("/movie/top_rated", "movie"),
          fetchMediaList("/tv/top_rated", "tv"),
          fetchMediaList("/trending/all/week", "all"),
        ]);

        const personalized = dedupeItems([...topMovies, ...topSeries, ...trending]).slice(0, 14);

        setHomeData({
          rows: [
            { id: "top-movies", title: "Top Movies", items: topMovies.slice(0, 10) },
            { id: "top-series", title: "Top Series", items: topSeries.slice(0, 10) },
            { id: "for-you", title: "Recommended For You", items: personalized },
          ],
          featuredItems: trending.slice(0, 5),
          isLoading: false,
          error: "",
        });
      } catch (error) {
        setHomeData({ rows: [], featuredItems: [], isLoading: false, error: "Home feed failed" });
        pushNotification(mapNetworkError(error));
      }
    }

    if (route.type === "section" && route.section === "home") loadHomeData();
  }, [historySignature, route.type, route.section]);

  /** -----------------------------
   *  Player & Watchlist
   ----------------------------- */
  function handlePlay(item) {
    setPlayerItem(item);
  }

  function handleToggleWatchlist(item) {
    setWatchlistMap((current) => {
      const next = persistWatchlistMap(toggleWatchlistEntryInMap(current, item), storageScope);
      if (session?.userId) syncRemoteWatchlist(session.userId, next).catch(() => setSyncNotice("Cloud sync unavailable"));
      return next;
    });
  }

  /** -----------------------------
   *  Preferences
   ----------------------------- */
  function handleChangePreference(field, value) {
    const next = { ...preferences, [field]: value };
    setPreferences(next);
    persistPreferences(next, storageScope);
    applyPreferencesToDocument(next);
    setPreferencesStatus(session?.userId ? "Unsynced changes" : "Saved locally");
  }

  async function handleSavePreferences() {
    setIsSavingPreferences(true);
    try {
      persistPreferences(preferences, storageScope);
      if (session?.userId) {
        await syncRemotePreferences(session.userId, preferences);
        setPreferencesStatus("Preferences synced");
      }
    } catch {
      setPreferencesStatus("Saved locally, sync failed");
    } finally {
      setIsSavingPreferences(false);
    }
  }

  /** -----------------------------
   *  Auth
   ----------------------------- */
  async function handleLogin(credentials) {
    setIsAuthPending(true);
    setAuthError("");
    try {
      const nextSession = await loginAccount(credentials);
      setSession(nextSession);
      setSyncNotice("Connecting...");
    } catch (error) {
      const e = mapAuthError(error);
      setAuthError(e.message);
      pushNotification(e);
    } finally {
      setIsAuthPending(false);
    }
  }

  async function handleLogout() {
    setIsAuthPending(true);
    try {
      await logoutAccount();
      setSession(null);
    } finally {
      setIsAuthPending(false);
    }
  }

  /** -----------------------------
   *  Render
   ----------------------------- */
  return (
    <div className="min-h-screen bg-black text-white">
      <NotificationCenter notifications={notifications} onDismiss={dismissNotification} />

      {route.type === "landing" ? (
        <SplashScreen />
      ) : (
        <>
          <main className="relative z-10 px-4 pb-32 pt-4 md:px-6 lg:px-8">
            <div className="route-stage mx-auto max-w-[1180px]">
              {route.type === "section" && route.section === "home" && (
                <HomePage
                  featuredItems={homeData.featuredItems}
                  rows={homeData.rows}
                  isLoading={homeData.isLoading}
                  query={query}
                  onQueryChange={setQuery}
                  continueMap={continueMap}
                  watchlistMap={watchlistMap}
                  onPlay={handlePlay}
                  onToggleWatchlist={handleToggleWatchlist}
                />
              )}

              {playerItem && (
                <TheaterOverlay
                  item={playerItem}
                  resumeEntry={continueMap[playerItem.id]}
                  providerFlowEnabled={preferences.providerFlow === "enabled"}
                  onClose={() => setPlayerItem(null)}
                  onPersistProgress={() => {}}
                  onClearProgress={() => {}}
                  onNotify={pushNotification}
                />
              )}
            </div>
          </main>
          <BottomNav activeSection="home" watchlistCount={watchlistEntries.length} onNavigate={() => {}} />
        </>
      )}
    </div>
  );
}
