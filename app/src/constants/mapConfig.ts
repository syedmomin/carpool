// CARTO now requires an API key on its basemap tiles (enforced since Aug 2026).
// Free tier: 5M tile requests/month. Get one at carto.com/basemaps/apikey.
export const CARTO_API_KEY = 'cb1_31g0_1_c6c58c39f2242a3b8aba1e9a';

export const CARTO_TILE_URL =
  `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`;
