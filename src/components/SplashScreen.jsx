import { BRAND_ICON_128, BRAND_NAME } from '../lib/brand';

export function SplashScreen() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(229,9,20,0.28),transparent_28%),radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.08),transparent_22%),#000]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />

      <section className="liquid-panel relative z-10 flex w-full max-w-md flex-col items-center rounded-[40px] px-8 py-12 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="brand-pulse flex h-28 w-28 items-center justify-center rounded-[32px] bg-white/[0.08]">
          <img src={BRAND_ICON_128} alt={BRAND_NAME} className="h-20 w-20 rounded-[26px]" />
        </div>
        <div className="mt-6 text-[11px] uppercase tracking-[0.34em] text-white/48">
          Liquid Glass Cinema
        </div>
        <h1 className="mt-3 text-4xl font-black text-white">{BRAND_NAME}</h1>
        <p className="mt-3 max-w-sm text-sm leading-7 text-white/58">
          Preparing your library, preferences, and streaming shell.
        </p>
        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
          <div className="splash-progress h-full rounded-full bg-[linear-gradient(90deg,rgba(255,255,255,0.18),#e50914,rgba(255,255,255,0.55))]" />
        </div>
      </section>
    </main>
  );
}
