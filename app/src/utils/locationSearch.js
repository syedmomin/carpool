// Nominatim (OpenStreetMap) location search — free, no API key needed
const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org/search';

let _lastQuery = '';
let _debounceTimer = null;

/**
 * Search for Pakistan locations using Nominatim.
 * Returns array of { name, displayName, lat, lng }
 */
export async function searchPakistanLocations(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim();
  const url = `${NOMINATIM_BASE}?q=${encodeURIComponent(q + ', Pakistan')}&format=json&limit=8&countrycodes=pk&addressdetails=1&accept-language=en`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'ChalParo/1.0 (carpool app)' },
    });
    if (!res.ok) return [];
    const json = await res.json();
    // Deduplicate by name
    const seen = new Set();
    const results = [];
    for (const item of json) {
      const addr = item.address || {};
      const name =
        addr.city ||
        addr.town ||
        addr.county ||
        addr.state_district ||
        addr.village ||
        item.display_name.split(',')[0].trim();
      if (!seen.has(name)) {
        seen.add(name);
        results.push({
          name,
          displayName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        });
      }
    }
    return results;
  } catch (_) {
    return [];
  }
}

/**
 * Debounced version — calls callback after 400ms idle.
 * Returns a cancel function.
 */
export function searchDebounced(query, callback, delay = 400) {
  if (_debounceTimer) clearTimeout(_debounceTimer);
  _lastQuery = query;
  _debounceTimer = setTimeout(async () => {
    if (query !== _lastQuery) return;
    const results = await searchPakistanLocations(query);
    callback(results);
  }, delay);
  return () => clearTimeout(_debounceTimer);
}
