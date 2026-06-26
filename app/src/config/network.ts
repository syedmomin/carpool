import { Platform } from 'react-native';
const PRODUCTION_URL = 'https://app-server-t62hcw.fly.dev';
const DEV_SERVER_PORT = 5000;

function getServerUrl(): string {
  // if (Platform.OS === 'web') {
  //   return `http://localhost:${DEV_SERVER_PORT}`;
  // }
  return PRODUCTION_URL;
}

export const SERVER_URL: string = getServerUrl();
export const API_BASE_URL: string = `${SERVER_URL}/api/v1`;
if (__DEV__) console.log(`🌐 API → ${API_BASE_URL} | platform=${Platform.OS}`);