# Grubed

React + Tailwind CSS 4 streaming app for the Grubed browsing and theater experience.

## Run

```bash
npm install
npm run dev
```

## Optional env overrides

```bash
VITE_TMDB_PROXY_BASE=https://mtd.sky0cloud.dpdns.org
VITE_TMDB_API_KEY=bda755b29c8939787eded30edf76bec5
VITE_VIDKING_BASE=https://www.vidking.net/embed
VITE_FIREBASE_API_KEY=AIzaSyBtbU7NxYqX3W95NxFtzLAwV_IecVsXAk0
VITE_FIREBASE_AUTH_DOMAIN=grubed-95935.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=grubed-95935
VITE_FIREBASE_STORAGE_BUCKET=grubed-95935.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=735633430795
VITE_FIREBASE_APP_ID=1:735633430795:web:d08b031e2ce3639d3fea0e
VITE_FIREBASE_MEASUREMENT_ID=G-S8PL45JRLH
```

## Notes

- Metadata requests assume the supplied proxy mirrors TMDB v3 endpoints.
- Progress sync listens for `PLAYER_EVENT` messages from the Vidking iframe.
- Account auth uses Firebase Email/Password sign-in.
- Watchlist and continue-watching cache locally per user and sync to Firestore when available.
- The theater iframe uses stall detection, compatibility retries, and sandboxing to surface provider-side playback failures more cleanly.
- Routes: `/` (splash), `/home`, `/movies`, `/series`, `/watchlist`, `/settings`, `/docs`, and `/title/:mediaType/:id`.
