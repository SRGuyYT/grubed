import {
  BookmarkIcon,
  FilmIcon,
  HomeIcon,
  SlidersIcon,
  TvIcon,
} from './icons';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'movies', label: 'Movies', icon: FilmIcon },
  { id: 'series', label: 'Series', icon: TvIcon },
  { id: 'watchlist', label: 'Saved', icon: BookmarkIcon },
  { id: 'settings', label: 'Settings', icon: SlidersIcon },
];

export function BottomNav({ activeSection, watchlistCount, onNavigate }) {
  return (
    <nav className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-3xl">
      <div className="liquid-nav flex items-center justify-between gap-2 rounded-[30px] px-3 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.45)]">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-[22px] px-3 py-2 text-[11px] font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_30px_rgba(0,0,0,0.18)]'
                  : 'text-white/54 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
              {item.id === 'watchlist' && watchlistCount > 0 ? (
                <span className="absolute right-3 top-2 rounded-full bg-[#e50914] px-1.5 py-0.5 text-[9px] font-bold text-white">
                  {watchlistCount}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
