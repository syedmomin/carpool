import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppProvider } from './src/context/AppContext';
import { ToastProvider } from './src/context/ToastContext';
import { GlobalModalProvider } from './src/context/GlobalModalContext';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/utils/notifications';
import { profileApi } from './src/services/api';

export default function App() {
  useEffect(() => {
    // Register for push notifications on app start
    registerForPushNotifications().then(token => {
      if (token) {
        // Send FCM token to backend silently
        profileApi.updateFcmToken(token).catch(() => {});
      }
    });
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <GlobalModalProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </ToastProvider>
        </GlobalModalProvider>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
