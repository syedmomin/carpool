import { Platform } from 'react-native';
import { profileApi } from '../services/api';
import { showGlobalBanner } from './bannerBus';
import { targetForKind } from './notificationStyle';

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

// Required by RN Firebase so the OS can deliver notifications while the app is
// backgrounded or quit. Notification-payload messages display automatically;
// this also lets data-only messages be handled without crashing.
if (messaging) {
  try {
    messaging().setBackgroundMessageHandler(async () => {});
  } catch (e) {
    // no-op
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
export function setupNotificationListeners(navRef) {
  if (!messaging) return () => {}; // native build nahi hai

  // App is in the foreground: FCM does NOT show a system notification, so we
  // surface it with the in-app banner instead (Uber/inDrive style).
  const unsubForeground = messaging().onMessage(async remoteMessage => {
    const n = remoteMessage?.notification;
    const data = remoteMessage?.data || {};
    if (!n?.title) return;
    showGlobalBanner({
      title:   n.title,
      message: n.body || '',
      kind:    (data.type as string) || (data.screen as string),
      rideId:  data.rideId as string,
      bookingId: data.bookingId as string,
      onPress: () => navigateTo(navRef, data),
    });
  });

  // FCM rotates tokens (reinstall, restore, periodic). Without this the server
  // keeps a stale token and every push silently fails after rotation.
  const unsubTokenRefresh = messaging().onTokenRefresh(token => {
    profileApi.updateFcmToken(token).catch(() => {});
  });

  // Tapped from background.
  const unsubBackground = messaging().onNotificationOpenedApp(remoteMessage => {
    if (remoteMessage?.data) navigateTo(navRef, remoteMessage.data);
  });

  // Tapped from a fully-quit state — navigation may not be ready yet, so retry
  // until the ref resolves (cold start: NavigationContainer mounts after splash).
  let initialTick: ReturnType<typeof setInterval> | null = null;
  messaging()
    .getInitialNotification()
    .then(remoteMessage => {
      if (!remoteMessage?.data) return;
      let tries = 0;
      initialTick = setInterval(() => {
        tries += 1;
        if (navRef?.current) { navigateTo(navRef, remoteMessage.data); if (initialTick) clearInterval(initialTick); }
        else if (tries > 20 && initialTick) clearInterval(initialTick); // ~10s give-up
      }, 500);
    });

  return () => {
    unsubForeground();
    unsubBackground();
    unsubTokenRefresh();
    if (initialTick) clearInterval(initialTick);
  };
}

// ─── Navigate based on notification data ─────────────────────────────────────
function navigateTo(navRef, data) {
  const navigation = navRef?.current;
  if (!navigation || !data) return;
  // Server pushes send `type` (NotificationType), not `screen`. Derive the
  // destination from type when `screen` isn't explicitly provided.
  const screen = data.screen || targetForKind(data.type, data.role)?.screen;
  switch (screen) {
    case 'BookingHistory': navigation.navigate('PassengerApp', { screen: 'BookingHistoryTab' }); break;
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
    case 'Notifications': {
      const isDriver = data.role === 'DRIVER';
      navigation.navigate(isDriver ? 'DriverApp' : 'PassengerApp', {
        screen: isDriver ? 'DriverHomeTab' : 'PassengerHomeTab',
        params: { screen: 'Notifications' },
      });
      break;
    }
    default: break;
  }
}
