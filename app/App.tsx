import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/context/ToastContext';
import { GlobalModalProvider } from './src/context/GlobalModalContext';
import AppNavigator from './src/navigation/AppNavigator';
import SocketListener from './src/components/SocketListener';
import { registerForPushNotifications, setupNotificationListeners } from './src/utils/notifications';
import { profileApi } from './src/services/api';

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotifications().then(token => {
      if (token) {
        profileApi.updateFcmToken(token).catch(() => {});
      }
    });
  }, []);

  useEffect(() => {
    // Wire notification tap navigation once navigation is ready
    const cleanup = setupNotificationListeners(navigationRef.current);
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <GlobalModalProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <SocketListener navigationRef={navigationRef} />
            <AppNavigator navigationRef={navigationRef} />
          </ToastProvider>
        </GlobalModalProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}

