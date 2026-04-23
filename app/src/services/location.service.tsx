import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LOCATION_TASK_NAME, TRACKING_RIDE_ID_KEY } from '../tasks/locationTask';

class LocationService {
  async requestPermissions(): Promise<boolean> {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn('Foreground location permission not granted');
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission not granted');
      // We can still return true to use foreground tracking
    }
    return true;
  }

  async startForegroundTracking(callback: (loc: Location.LocationObject) => void): Promise<Location.LocationSubscription | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        callback(location);
      }
    );

    return subscription;
  }

  async startBackgroundTracking(rideId: string): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Save Ride ID so the background task knows which ride to update
    await AsyncStorage.setItem(TRACKING_RIDE_ID_KEY, rideId);

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 15000, // 15 seconds for background is good
      distanceInterval: 40, // Every 40 meters
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Ride Tracking Active',
        notificationBody: 'Sharing your real-time location with passengers.',
        notificationColor: '#0d1b4b',
      },
    });
  }

  async stopBackgroundTracking(): Promise<void> {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
    await AsyncStorage.removeItem(TRACKING_RIDE_ID_KEY);
  }
}

export const locationService = new LocationService();
