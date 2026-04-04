/**
 * Secure storage utility — XOR cipher + Base64 encoding
 * Prevents plain-text snooping of AsyncStorage values on rooted devices.
 * Not military-grade — designed to obscure, not to protect against determined attackers.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const APP_SECRET = 'CP!2024@ChalParo#PK$RideSafe%7x';

// ─── XOR cipher ───────────────────────────────────────────────────────────────
function xor(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(str.charCodeAt(i) ^ APP_SECRET.charCodeAt(i % APP_SECRET.length));
  }
  return result;
}

// ─── Encrypt: JSON-serialize → XOR → Base64 ──────────────────────────────────
export function encryptValue(value) {
  if (value === null || value === undefined) return null;
  const str = typeof value === 'string' ? value : JSON.stringify(value);
  return btoa(unescape(encodeURIComponent(xor(str))));
}

// ─── Decrypt: Base64 → XOR → parse ────────────────────────────────────────────
export function decryptValue(encrypted) {
  if (!encrypted) return null;
  try {
    return xor(decodeURIComponent(escape(atob(encrypted))));
  } catch {
    // Fallback: value might be stored unencrypted (migration)
    return encrypted;
  }
}

// ─── Secure AsyncStorage wrappers ─────────────────────────────────────────────
export const secureStorage = {
  setItem: async (key, value) => {
    const encrypted = encryptValue(value);
    return AsyncStorage.setItem(key, encrypted);
  },

  getItem: async (key) => {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return decryptValue(raw);
  },

  getObject: async (key) => {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    const str = decryptValue(raw);
    try { return JSON.parse(str); }
    catch { return str; }
  },

  setObject: async (key, obj) => {
    const encrypted = encryptValue(JSON.stringify(obj));
    return AsyncStorage.setItem(key, encrypted);
  },

  removeItem: async (key) => AsyncStorage.removeItem(key),

  multiRemove: async (keys) => AsyncStorage.multiRemove(keys),
};
