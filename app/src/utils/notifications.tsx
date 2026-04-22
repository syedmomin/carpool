import { Platform } from 'react-native';

let messaging;
if (Platform.OS === 'web') {
  // Firebase native module not supported on web
  messaging = null;
} else {
  try {
    messaging = require('@react-native-firebase/messaging').default;
  } catch (e) {
    messaging = null;
  }
}

// ─── Register device + get FCM token ─────────────────────────────────────────
export async function registerForPushNotifications() {
  if (!messaging) return null; // native build nahi hai
  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('[Notifications] Permission not granted');
      return null;
    }

    const token = await messaging().getToken();
    return token;
  } catch (err) {
    console.warn('[Notifications] Failed to get FCM token:', err);
    return null;
  }
}

// ─── Listen for notifications when app is open ───────────────────────────────
export function setupNotificationListeners(navigation) {
  if (!messaging) return () => {}; // native build nahi hai

  const unsubForeground = messaging().onMessage(async remoteMessage => {
    console.log('[Notifications] Foreground message:', remoteMessage);
  });

  const unsubBackground = messaging().onNotificationOpenedApp(remoteMessage => {
    const data = remoteMessage?.data;
    if (data?.screen && navigation) navigateTo(navigation, data);
  });

  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (remoteMessage?.data?.screen && navigation) {
        setTimeout(() => navigateTo(navigation, remoteMessage.data), 500);
      }
    });

  return () => {
    unsubForeground();
    unsubBackground();
  };
}

// ─── Navigate based on notification data ─────────────────────────────────────
function navigateTo(navigation, data) {
  switch (data.screen) {
    case 'BookingHistory': navigation.navigate('BookingHistory');                        break;
    case 'RideDetail':     navigation.navigate('RideDetail', { rideId: data.rideId });  break;
    case 'MyRides':
        navigation.navigate('DriverApp', { screen: 'MyRidesTab' });
        break;
    case 'Chat':
        navigation.navigate('Chat', { bookingId: data.bookingId });
        break;
    case 'RideBookings':
        navigation.navigate('RideBookings', { rideId: data.rideId });
        break;
    case 'Notifications':  navigation.navigate('Notifications');                         break;
    default: break;
  }
}
