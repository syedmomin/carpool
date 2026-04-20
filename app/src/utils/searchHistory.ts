import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = '@carpool_search_history';
const MAX_HISTORY = 5;

export interface SearchEntry {
  from: string;
  to: string;
  timestamp: number;
}

export const searchHistory = {
  async get(): Promise<SearchEntry[]> {
    try {
      const data = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load search history', e);
      return [];
    }
  },

  async save(from: string, to: string): Promise<SearchEntry[]> {
    try {
      let history = await this.get();
      
      // Remove duplicate if exists (same from/to)
      history = history.filter(h => !(h.from === from && h.to === to));
      
      // Add to front
      history.unshift({ from, to, timestamp: Date.now() });
      
      // Limit size
      if (history.length > MAX_HISTORY) {
        history = history.slice(0, MAX_HISTORY);
      }
      
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
      return history;
    } catch (e) {
      console.error('Failed to save search history', e);
      return [];
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear search history', e);
    }
  }
};
