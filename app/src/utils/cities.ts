// Single source of truth for city data — fetched once from the backend
// (`GET /cities`, backed by the `City` table) and cached in memory for the
// rest of the app session, instead of every screen bundling its own list.
import { citiesApi } from '../services/api';

export interface CityEntry { name: string; lat: number; lng: number }

let cache: CityEntry[] = [];
let loadPromise: Promise<CityEntry[]> | null = null;

// Shown before the user has typed anything / before the fetch resolves.
export const POPULAR_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala',
];

export function loadCities(): Promise<CityEntry[]> {
  if (cache.length) return Promise.resolve(cache);
  if (loadPromise) return loadPromise;
  loadPromise = citiesApi.getAll()
    .then(({ data }) => {
      cache = data?.data?.cities || [];
      return cache;
    })
    .catch(() => [])
    .finally(() => { loadPromise = null; });
  return loadPromise;
}

export function getCachedCities(): CityEntry[] {
  return cache;
}

export function searchCities(query: string): CityEntry[] {
  if (!query.trim()) {
    return POPULAR_CITIES
      .map(name => cache.find(c => c.name === name))
      .filter((c): c is CityEntry => !!c);
  }
  const q = query.trim().toLowerCase();
  return cache.filter(c => c.name.toLowerCase().includes(q));
}

export function getCityCoords(name: string): { lat: number; lng: number } | null {
  const entry = cache.find(c => c.name.toLowerCase() === (name || '').toLowerCase());
  return entry ? { lat: entry.lat, lng: entry.lng } : null;
}
