import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_PREFIX = '@chalparo_cache_';
const CACHE_EXPIRY = 1000 * 60 * 60 * 24; // 24 hours

export const cacheService = {
  /**
   * Save data to cache with timestamp
   */
  async set(key: string, data: any) {
    const payload = {
      data,
      timestamp: Date.now(),
    };
    try {
      await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(payload));
    } catch (e) {
      console.warn(`[CacheService] Failed to set ${key}:`, e);
    }
  },

  /**
   * Get data from cache, even if expired (offline survival)
   */
  async get(key: string) {
    try {
      const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
      if (!raw) return null;
      const { data, timestamp } = JSON.parse(raw);
      
      // If data is older than expiry, we still return it but it's considered stale
      // In a more complex system, we might return a 'isStale' flag
      return data;
    } catch (e) {
      console.warn(`[CacheService] Failed to get ${key}:`, e);
      return null;
    }
  },

  /**
   * Clear a specific key
   */
  async remove(key: string) {
    await AsyncStorage.removeItem(`${CACHE_PREFIX}${key}`);
  },

  /**
   * Clear all cached data (not tokens/user login)
   */
  async clearAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(k => k.startsWith(CACHE_PREFIX));
      await AsyncStorage.multiRemove(cacheKeys);
    } catch (e) {}
  }
};
