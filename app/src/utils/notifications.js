import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// ─── Notification display config ─────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
  }),
});

// ─── Register device + get FCM token ─────────────────────────────────────────
export async function registerForPushNotifications() {
  // Physical device only
  if (!Device.isDevice) {
    console.warn('[Notifications] Push notifications require a physical device');
    return null;
  }

  // Android: create notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('safarishare_default', {
      name:        'SafariShare',
      importance:   Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor:  '#1a73e8',
      sound:       'default',
    });
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('[Notifications] Permission not granted');
    return null;
  }

  // Get Expo push token (works with Firebase via Expo's service)
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: 'your-expo-project-id', // replace with your Expo project ID
  });

  return tokenData.data;
}

// ─── Listen for notifications when app is open ───────────────────────────────
export function setupNotificationListeners(navigation) {
  // App is foregrounded — notification received
  const foregroundSub = Notifications.addNotificationReceivedListener(notification => {
    console.log('[Notifications] Received:', notification);
  });

  // User taps on notification
  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data;

    // Navigate based on screen data sent from backend
    if (data?.screen && navigation) {
      switch (data.screen) {
        case 'BookingHistory':
          navigation.navigate('BookingHistory');
          break;
        case 'RideDetail':
          if (data.rideId) navigation.navigate('RideDetail', { rideId: data.rideId });
          break;
        case 'MyRides':
          navigation.navigate('MyRides');
          break;
        case 'Notifications':
          navigation.navigate('Notifications');
          break;
        default:
          break;
      }
    }
  });

  // Return cleanup function
  return () => {
    foregroundSub.remove();
    responseSub.remove();
  };
}
