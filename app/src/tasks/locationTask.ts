import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { encryptValue, decryptValue } from '../utils/secureStorage';
import { API_BASE_URL } from '../config/network';

const LOCATION_TASK_NAME = 'background-location-task';
const TRACKING_RIDE_ID_KEY = '@tracking_ride_id';
const TOKEN_KEY = '@chalparo_token';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('[BackgroundLocationTask] Error:', error);
    return;
  }
  if (data) {
    const { locations }: any = data;
    const location = locations[0];
    if (location) {
      try {
        // 1. Get Ride ID from Storage
        const rideId = await AsyncStorage.getItem(TRACKING_RIDE_ID_KEY);
        if (!rideId) return;

        // 2. Get Token (Encrypted in ChalParo)
        const rawToken = await AsyncStorage.getItem(TOKEN_KEY);
        if (!rawToken) return;
        const token = decryptValue(rawToken);

        // 3. Post to API
        const { latitude, longitude, speed, heading } = location.coords;

        await fetch(`${API_BASE_URL}/tracking/update-location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            rideId,
            latitude,
            longitude,
            speed,
            heading
          })
        });

      } catch (err) {
        console.warn('[BackgroundLocationTask] Failed to update location:', err);
      }
    }
  }
});

export { LOCATION_TASK_NAME, TRACKING_RIDE_ID_KEY };
