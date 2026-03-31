import {
  BookmarkIcon,
  FilmIcon,
  HomeIcon,
  SparklesIcon,
  TvIcon,
} from './icons';
import { BRAND_ICON_64, BRAND_NAME } from '../lib/brand';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', caption: 'Curated spotlight', icon: HomeIcon },
  { id: 'movies', label: 'Movies', caption: 'Blockbusters & indies', icon: FilmIcon },
  { id: 'series', label: 'Series', caption: 'Binge-ready episodes', icon: TvIcon },
  { id: 'new', label: 'New & Hot', caption: 'Fresh releases', icon: SparklesIcon },
  { id: 'watchlist', label: 'Watchlist', caption: 'Saved titles', icon: BookmarkIcon },
];

function NavItem({ item, isActive, watchlistCount, onSelect }) {
  const Icon = item.icon;
  const caption =
    item.id === 'watchlist' && watchlistCount > 0
      ? `${watchlistCount} saved titles`
      : item.caption;

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`group/item flex min-w-0 flex-1 items-center justify-center rounded-2xl border px-3 py-3 text-left transition-all duration-300 md:w-full md:flex-none md:justify-start ${
        isActive
          ? 'border-white/20 bg-white/[0.08] text-white shadow-[0_0_20px_rgba(255,255,255,0.08)]'
          : 'border-transparent text-white/58 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
      }`}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <div className="hidden min-w-0 overflow-hidden pl-3 md:block md:max-w-0 md:opacity-0 md:transition-all md:duration-300 md:group-hover/sidebar:max-w-40 md:group-hover/sidebar:opacity-100">
        <div className="truncate text-sm font-medium">{item.label}</div>
        <div className="truncate text-[11px] uppercase tracking-[0.18em] text-white/40">{caption}</div>
      </div>
    </button>
  );
}

function BrandSection() {
  return (
    <div className="flex min-w-0 items-center gap-3 md:w-full md:justify-start">
      <div className="brand-pulse flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e50914]/18">
        <img src={BRAND_ICON_64} alt={BRAND_NAME} className="h-8 w-8 rounded-xl" />
      </div>
      <div className="hidden min-w-0 overflow-hidden md:block md:max-w-0 md:opacity-0 md:transition-all md:duration-300 md:group-hover/sidebar:max-w-32 md:group-hover/sidebar:opacity-100">
        <div className="truncate text-sm font-semibold text-white">{BRAND_NAME}</div>
        <div className="truncate text-[11px] uppercase tracking-[0.22em] text-white/45">OLED Mode</div>
      </div>
    </div>
  );
}

function SessionSection({ session }) {
  return (
    <div className="hidden items-center gap-3 overflow-hidden md:flex md:w-full md:max-w-0 md:opacity-0 md:transition-all md:duration-300 md:group-hover/sidebar:max-w-48 md:group-hover/sidebar:opacity-100">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
        <img src={BRAND_ICON_64} alt="" className="h-6 w-6 rounded-lg" />
      </div>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium text-white">{session?.displayName || 'Guest Session'}</div>
        <div className="truncate text-[11px] uppercase tracking-[0.2em] text-white/45">{session ? 'Firebase account' : 'Local cache'}</div>
      </div>
    </div>
  );
}

export function Sidebar({ activeSection, onSelectSection, watchlistCount, session }) {
  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-3 z-40 md:inset-x-auto md:bottom-4 md:left-4 md:top-4">
      <aside className="group/sidebar pointer-events-auto flex h-[78px] w-full items-center gap-2 rounded-[28px] border border-white/10 bg-white/[0.03] px-3 backdrop-blur-xl transition-[width,border-color,background-color] duration-500 md:h-[calc(100vh-2rem)] md:w-16 md:flex-col md:justify-between md:rounded-[34px] md:px-3 md:py-4 md:hover:w-60">
        <BrandSection />
        <nav className="flex min-w-0 flex-1 items-center justify-center gap-2 md:w-full md:flex-col md:items-stretch md:justify-center md:gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={activeSection === item.id}
              watchlistCount={watchlistCount}
              onSelect={onSelectSection}
            />
          ))}
        </nav>
        <SessionSection session={session} />
      </aside>
    </div>
  );
}
