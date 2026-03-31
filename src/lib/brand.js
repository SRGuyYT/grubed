import { BRAND_NAME, BRAND_ICON_128, GUEST_SCOPE } from './brand';

// Display brand name in the header
document.querySelector('#app-name').textContent = BRAND_NAME;

// Set favicon dynamically
const link = document.querySelector("link[rel*='icon']");
link.href = BRAND_FAVICON;

// Load guest preferences or watchlist
const prefs = loadPreferences(GUEST_SCOPE);
const watchlist = loadWatchlist(GUEST_SCOPE);
