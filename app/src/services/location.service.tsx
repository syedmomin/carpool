import * as Location from 'expo-location';

const LOCATION_TASK_NAME = 'background-location-task';

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

  // NOTE: Background tracking requires TaskManager to be registered in the global scope (usually App.js/ts)
  async startBackgroundTracking(): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000,
      distanceInterval: 30, // Every 30 meters
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Tracking Active Ride',
        notificationBody: 'Your location is being shared with riders.',
        notificationColor: '#333333',
      },
    });
  }

  async stopBackgroundTracking(): Promise<void> {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (isStarted) {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    }
  }
}

export const locationService = new LocationService();
export { LOCATION_TASK_NAME };
