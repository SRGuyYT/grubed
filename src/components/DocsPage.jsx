import { useMemo, useState } from 'react';
import { BRAND_NAME } from '../lib/brand';
import { CopyIcon, SearchIcon } from './icons';

function CodeBlock({ id, language, code, onCopy, copiedId }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#070707]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[11px] uppercase tracking-[0.24em] text-white/44">
        <span>{language}</span>
        <button
          type="button"
          onClick={() => onCopy(id, code)}
          className="inline-flex items-center gap-2 text-white/62 transition-colors hover:text-white"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          {copiedId === id ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-4 text-sm leading-7 text-white/82">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function DocsPage({ docsMeta }) {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Memoized sections to avoid recalculating on every render
  const sections = useMemo(() => [
    {
      id: 'api',
      title: 'API Documentation',
      summary: 'Endpoints, request formats, response expectations, and playback embedding.',
      content: [
        `TMDB proxy base: ${docsMeta.tmdbProxyBase}`,
        `Player embed base: ${docsMeta.playerBase}`,
        'Movie details and catalog rows are fetched through TMDB-compatible v3 endpoints.',
      ],
      blocks: [
        { id: 'api-trending', language: 'http', code: `GET ${docsMeta.tmdbApiBase}/trending/all/day?api_key=YOUR_KEY&language=en-US` },
        { id: 'api-movie-embed', language: 'html', code: `<iframe src="${docsMeta.playerBase}/movie/1078605?color=e50914&autoPlay=true" allowfullscreen></iframe>` },
      ],
    },
    {
      id: 'auth',
      title: 'Authentication Guide',
      summary: 'Firebase login and signup flow, expected providers, and local fallback behavior.',
      content: [
        `Firebase project: ${docsMeta.firebaseProjectId}`,
        'Enable Email/Password sign-in in Firebase Authentication.',
        'Ensure the current domain is listed under Authorized Domains when not using localhost.',
        'Watchlist, continue-watching, and preferences save locally first and sync to Firestore for signed-in users.',
      ],
      blocks: [
        { id: 'auth-config', language: 'js', code: `const firebaseConfig = ${JSON.stringify(docsMeta.firebaseConfig, null, 2)};` },
      ],
    },
    {
      id: 'errors',
      title: 'Error Codes Reference',
      summary: 'Custom application error codes, meanings, and recommended fixes.',
      content: Object.entries(docsMeta.errorDefinitions).map(
        ([code, def]) => `${code}: ${def.title}. ${def.message} Fix: ${def.help}`
      ),
      blocks: [],
    },
    {
      id: 'domains',
      title: 'Domains & Services',
      summary: 'Runtime domains, media dependencies, and environment config.',
      content: [
        `Application brand: ${BRAND_NAME}`,
        `TMDB proxy: ${docsMeta.tmdbProxyBase}`,
        `TMDB API namespace: ${docsMeta.tmdbApiBase}`,
        `Image CDN: ${docsMeta.imageBase}`,
        `Video provider: ${docsMeta.playerBase}`,
      ],
      blocks: [
        { id: 'env-snippet', language: 'bash', code: `
VITE_TMDB_PROXY_BASE=${docsMeta.tmdbProxyBase}
VITE_TMDB_API_KEY=${docsMeta.tmdbApiKey}
VITE_VIDKING_BASE=${docsMeta.playerBase}
VITE_FIREBASE_API_KEY=${docsMeta.firebaseConfig.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${docsMeta.firebaseConfig.authDomain}
VITE_FIREBASE_PROJECT_ID=${docsMeta.firebaseConfig.projectId}
VITE_FIREBASE_APP_ID=${docsMeta.firebaseConfig.appId}
        `.trim() },
      ],
    },
    {
      id: 'examples',
      title: 'Examples',
      summary: 'Integration examples for playback, auth, and progress tracking.',
      content: [
        'The player bridge expects PLAYER_EVENT postMessages from the iframe.',
        'Progress is stored under a user-scoped continue-watching map and can be synced to Firestore.',
      ],
      blocks: [
        {
          id: 'player-listener',
          language: 'js',
          code: `window.addEventListener('message', (event) => {
  const payload = JSON.parse(event.data);
  if (payload.type === 'PLAYER_EVENT') console.log(payload.data);
});`,
        },
        {
          id: 'firestore-save',
          language: 'js',
          code: `await setDoc(doc(db, 'users', userId, 'library', 'watchlist'), {
  items: watchlist,
  updatedAt: serverTimestamp(),
}, { merge: true });`,
        },
      ],
    },
  ], [docsMeta]);

  const filteredSections = sections.filter(section => {
    const haystack = [section.title, section.summary, ...section.content, ...section.blocks.map(b => b.code)].join(' ').toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const handleCopy = (id, code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 1200);
    });
  };

  return (
    <section className="space-y-7">
      {/* Header with search */}
      <section className="reveal-up liquid-panel rounded-[34px] p-5 md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
              Developer Docs
            </div>
            <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">
              Build against the {BRAND_NAME} surface.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58">
              Searchable runtime docs covering APIs, auth, domains, errors, and embed examples.
            </p>
          </div>

          <label className="flex w-full items-center gap-3 rounded-full border border-white/12 bg-black/[0.28] px-4 py-3 text-white/68 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] md:max-w-md">
            <SearchIcon className="h-5 w-5 shrink-0 text-white/42" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search docs, errors, domains, examples"
              className="w-full bg-transparent text-sm text-white placeholder:text-white/32 focus:outline-none"
            />
          </label>
        </div>
      </section>

      {/* Two-column layout: sidebar + content */}
      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar with section links */}
        <aside className="liquid-panel rounded-[30px] p-5 lg:sticky lg:top-6 lg:h-fit">
          <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">Sections</div>
          <div className="mt-4 space-y-2">
            {filteredSections.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-[20px] border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/68 transition-colors hover:text-white"
              >
                {section.title}
              </a>
            ))}
          </div>
        </aside>

        {/* Main content */}
        <div className="space-y-6">
          {filteredSections.map(section => (
            <section
              key={section.id}
              id={section.id}
              className="reveal-up liquid-panel rounded-[32px] p-5 md:p-7"
            >
              <div className="text-[11px] uppercase tracking-[0.24em] text-white/40">
                {section.id}
              </div>
              <h2 className="mt-2 text-2xl font-black text-white md:text-3xl">
                {section.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/58">{section.summary}</p>

              {section.content.length > 0 && (
                <div className="mt-5 space-y-3">
                  {section.content.map(line => (
                    <div key={line} className="rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-7 text-white/68">
                      {line}
                    </div>
                  ))}
                </div>
              )}

              {section.blocks.length > 0 && (
                <div className="mt-6 space-y-4">
                  {section.blocks.map(block => (
                    <CodeBlock
                      key={block.id}
                      id={block.id}
                      language={block.language}
                      code={block.code}
                      onCopy={handleCopy}
                      copiedId={copiedId}
                    />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
