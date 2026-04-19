// ─── Centralized Network Configuration ───────────────────────────────────────
// Automatically resolves the correct server URL:
//   • DEV (mobile) → uses your laptop's LAN IP (detected from Expo dev server)
//   • DEV (web)    → uses localhost (browser is on the same machine)
//   • PROD         → uses the deployed domain
// ──────────────────────────────────────────────────────────────────────────────
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PRODUCTION_URL = 'https://carpool-v1.bonto.run';
// ─── Dev server port (must match the PORT in server/.env) ─────────────────────
const DEV_SERVER_PORT = 5000;

/**
 * In Expo Go / dev-client, `Constants.expoConfig.hostUri` gives us
 * something like "192.168.100.60:8081".  We strip the Expo port and
 * replace it with the backend port → "http://192.168.100.60:5000".
 *
 * On Web, hostUri is not available, but localhost works directly
 * because the browser runs on the same machine as the server.
 */
function getDevServerUrl(): string {
  // Web browser → same machine as server → localhost works directly
if (Platform.OS === 'web') {
return `http://localhost:${DEV_SERVER_PORT}`;
}

  // Mobile (Expo Go / dev-client) → extract LAN IP from Expo
  const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.100.60:8081"

  if (hostUri) {
    const ip = hostUri.split(':')[0]; // extract just the IP
    return `http://${ip}:${DEV_SERVER_PORT}`;
  }

  // Fallback: if hostUri is unavailable (e.g. standalone build)
return PRODUCTION_URL;
}

// ─── Determine environment ───────────────────────────────────────────────────
const isDev = __DEV__; // true in Expo Go / dev-client, false in production builds

// ─── Exported URLs ───────────────────────────────────────────────────────────
/** Base URL for the server (no /api/v1 suffix) — used by Socket.IO */
export const SERVER_URL: string = isDev ? getDevServerUrl() : PRODUCTION_URL;

/** Base URL for REST API calls (with /api/v1 suffix) */
export const API_BASE_URL: string = `${SERVER_URL}/api/v1`;

// Log once at startup so you always know which backend you're hitting
console.log(`🌐 Network config → ${isDev ? 'DEV' : 'PROD'} | ${Platform.OS} → ${SERVER_URL}`);