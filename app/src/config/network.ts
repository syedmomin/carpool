import { Platform } from 'react-native';
const PRODUCTION_URL = 'https://carpool-v1.bonto.run';
const DEV_SERVER_PORT = 5000;

function getServerUrl(): string {
  if (Platform.OS === 'web') {
    return `http://localhost:${DEV_SERVER_PORT}`;
  }
  return PRODUCTION_URL;
}

export const SERVER_URL: string = getServerUrl();
export const API_BASE_URL: string = `${SERVER_URL}/api/v1`;
console.log(`🌐 API → ${API_BASE_URL} | DEV=${__DEV__} | platform=${Platform.OS}`);

// import Constants from 'expo-constants';
// import { Platform } from 'react-native';

// const PRODUCTION_URL = 'https://carpool-v1.bonto.run';
// const DEV_SERVER_PORT = 5000;
// function getDevServerUrl(): string {
//   if (Platform.OS === 'web') {
//     return `http://localhost:${DEV_SERVER_PORT}`;
//   }
//   const hostUri = Constants.expoConfig?.hostUri; // e.g. "192.168.100.60:8081"

//   if (hostUri) {
//     const ip = hostUri.split(':')[0]; // extract just the IP
//     return `http://${ip}:${DEV_SERVER_PORT}`;
//   }
//   return PRODUCTION_URL;
// }
// const isDev = __DEV__; // true in Expo Go / dev-client, false in production builds
// export const SERVER_URL: string = isDev ? getDevServerUrl() : PRODUCTION_URL;
// export const API_BASE_URL: string = `${SERVER_URL}/api/v1`;
// console.log(`🌐 Network config → ${isDev ? 'DEV' : 'PROD'} | ${Platform.OS} → ${SERVER_URL}`);