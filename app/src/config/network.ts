// ─── Centralized Network Configuration ───────────────────────────────────────
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── Production URL (deployed backend) ────────────────────────────────────────
const PRODUCTION_URL = 'https://carpool-v1.bonto.run';

// ─── Dev server port (must match the PORT in server/.env) ─────────────────────
const DEV_SERVER_PORT = 5000;

function getServerUrl(): string {
  // Web browser → localhost works directly
  if (Platform.OS === 'web') {
    return `http://localhost:${DEV_SERVER_PORT}`;
  }

  // Always use production URL on Android/iOS regardless of __DEV__
  // Local dev server is only useful when testing on web
  return PRODUCTION_URL;
}

export const SERVER_URL: string = getServerUrl();

/** Base URL for REST API calls */
export const API_BASE_URL: string = `${SERVER_URL}/api/v1`;

console.log(`🌐 API → ${API_BASE_URL} | DEV=${__DEV__} | platform=${Platform.OS}`);
