import { useState } from 'react';
import { BRAND_ICON_128, BRAND_NAME } from '../lib/brand';

export function AccountPage({
  session,
  isSessionReady,
  isPending,
  authError,
  syncNotice,
  watchlistCount,
  continueCount,
  onLogin,
  onRegister,
  onLogout,
}) {
  const [mode, setMode] = useState('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (mode === 'register') {
      await onRegister({ displayName, email, password });
      return;
    }

    await onLogin({ email, password });
  }

  if (!isSessionReady && !session) {
    return (
      <section className="glass-panel reveal-up rounded-[36px] p-8 text-white/70">
        Checking your account session...
      </section>
    );
  }

  return (
    <section className="reveal-up grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_420px]">
      <section className="glass-panel overflow-hidden rounded-[36px]">
        <div className="border-b border-white/10 px-6 py-5 md:px-8">
          <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
            Account
          </div>
          <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">
            {session ? 'Your Grubed profile' : 'Sign in to sync Grubed'}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-white/58">
            Watchlist and continue-watching stay tied to your account. If Firestore is
            unavailable, Grubed falls back to this browser until cloud sync is ready.
          </p>
        </div>

        <div className="grid gap-6 p-6 md:p-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <div className="glass-panel flex flex-col items-center justify-center gap-4 rounded-[30px] p-6 text-center">
            <div className="brand-pulse flex h-24 w-24 items-center justify-center rounded-[28px] bg-[#e50914]/18">
              <img
                src={BRAND_ICON_128}
                alt={BRAND_NAME}
                className="h-16 w-16 rounded-2xl"
              />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{BRAND_NAME}</div>
              <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/42">
                Firebase sync
              </div>
            </div>
          </div>

          {session ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                    Watchlist
                  </div>
                  <div className="mt-2 text-3xl font-black text-white">
                    {watchlistCount}
                  </div>
                  <p className="mt-2 text-sm text-white/56">Saved titles in your account.</p>
                </div>
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5">
                  <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                    Continue Watching
                  </div>
                  <div className="mt-2 text-3xl font-black text-white">
                    {continueCount}
                  </div>
                  <p className="mt-2 text-sm text-white/56">
                    Resume points synced from theater playback.
                  </p>
                </div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-black/25 p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                  Signed In
                </div>
                <div className="mt-2 text-2xl font-black text-white">
                  {session.displayName}
                </div>
                <div className="mt-2 text-sm text-white/58">{session.email}</div>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-gradient-to-br from-[#e50914]/16 to-transparent p-5">
                <div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
                  Sync Status
                </div>
                <p className="mt-2 text-sm leading-7 text-white/70">{syncNotice}</p>
              </div>

              <button
                type="button"
                onClick={onLogout}
                disabled={isPending}
                className="rounded-full border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/78 transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === 'login'
                      ? 'bg-[#e50914] text-white'
                      : 'text-white/58 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode('register')}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    mode === 'register'
                      ? 'bg-[#e50914] text-white'
                      : 'text-white/58 hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === 'register' ? (
                  <label className="block space-y-2">
                    <span className="text-sm font-medium text-white">Display Name</span>
                    <input
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Grubed member"
                      className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                    />
                  </label>
                ) : null}

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-white">Password</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full rounded-[24px] border border-white/10 bg-white/[0.03] px-4 py-3 text-white placeholder:text-white/30 focus:border-white/20 focus:outline-none"
                  />
                </label>

                {authError ? (
                  <div className="rounded-[24px] border border-[#e50914]/30 bg-[#e50914]/10 px-4 py-3 text-sm text-white/84">
                    {authError}
                  </div>
                ) : null}

                <div className="rounded-[24px] border border-white/10 bg-black/25 px-4 py-3 text-sm leading-7 text-white/58">
                  {syncNotice}
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-full bg-[#e50914] px-5 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending
                    ? mode === 'register'
                      ? 'Creating account...'
                      : 'Signing in...'
                    : mode === 'register'
                      ? 'Create Account'
                      : 'Sign In'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>

      <aside className="glass-panel rounded-[36px] p-6">
        <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
          What Changed
        </div>
        <div className="mt-4 space-y-3">
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Account-backed watchlist</div>
            <p className="mt-2 text-sm leading-7 text-white/58">
              Titles you save are cached locally and pushed to Firebase when your account is
              active.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Resume sync</div>
            <p className="mt-2 text-sm leading-7 text-white/58">
              Continue-watching remains immediate in local storage, then syncs to Firebase on
              a throttled cadence to avoid excessive writes.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
            <div className="text-sm font-semibold text-white">Fallback behavior</div>
            <p className="mt-2 text-sm leading-7 text-white/58">
              If Firestore rules are missing or blocked, Grubed still saves on this browser so
              playback and watchlist actions keep working.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
