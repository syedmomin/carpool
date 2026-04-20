import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Global Haptics utility to ensure consistent vibration feedback across the app.
 * Automatically checks for Platform support (haptics are generally for mobile).
 */
export const haptics = {
  /**
   * Success feedback (Double quick tap)
   * Use for: Booking confirmed, Ride posted, Bid accepted.
   */
  success: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('Haptics not supported on this device');
    }
  },

  /**
   * Warning/Error feedback (Longer vibration)
   * Use for: Validation errors, Failed payments.
   */
  warning: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {
      console.warn('Haptics not supported on this device');
    }
  },

  /**
   * Impact feedback (Medium sharp tap)
   * Use for: Switching tabs, selecting a main item, pressing a CTA.
   */
  impact: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {
      console.warn('Haptics not supported on this device');
    }
  },

  /**
   * Selection feedback (Lightest tap)
   * Use for: Toggling switches, selecting simple list items.
   */
  selection: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch (e) {
      console.warn('Haptics not supported on this device');
    }
  }
};
