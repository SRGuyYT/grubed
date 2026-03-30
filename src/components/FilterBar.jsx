export function FilterBar({ filters, genres, onChange, onReset }) {
  return (
    <section className="glass-panel reveal-up rounded-[28px] p-4 md:p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
            Filter Bar
          </div>
          <h2 className="mt-2 text-xl font-black text-white md:text-2xl">
            Refine the catalog
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:min-w-[760px]">
          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/42">
              Genre
            </span>
            <select
              value={filters.genre}
              onChange={(event) => onChange('genre', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none"
            >
              <option value="all">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.value} value={genre.value}>
                  {genre.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/42">
              Release Year
            </span>
            <select
              value={filters.year}
              onChange={(event) => onChange('year', event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none"
            >
              <option value="curated">Curated</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/42">
              Rating
            </span>
            <div className="flex gap-3">
              <select
                value={filters.rating}
                onChange={(event) => onChange('rating', event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-white/20 focus:outline-none"
              >
                <option value="curated">Curated</option>
                <option value="highest">Highest Rated</option>
                <option value="lowest">Lowest Rated</option>
              </select>

              <button
                type="button"
                onClick={onReset}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[11px] uppercase tracking-[0.22em] text-white/62 transition-colors hover:border-white/20 hover:text-white"
              >
                Reset
              </button>
            </div>
          </label>
        </div>
      </div>
    </section>
  );
}
