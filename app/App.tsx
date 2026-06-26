import React, { useEffect, useRef } from "react";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppProvider } from "./src/context/AppContext";
import { ToastProvider } from "./src/context/ToastContext";
import { GlobalModalProvider } from "./src/context/GlobalModalContext";
import { BannerProvider } from "./src/context/BannerContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import AppNavigator from "./src/navigation/AppNavigator";
import SocketListener from "./src/components/SocketListener";
import { SocketDataProvider } from "./src/context/SocketDataContext";
import { setupNotificationListeners } from "./src/utils/notifications";

export default function App() {
  const navigationRef = useRef(null);

  useEffect(() => {
    // Wire notification tap navigation once navigation is ready
    const cleanup = setupNotificationListeners(navigationRef.current);
    return cleanup;
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <SocketDataProvider>
            <GlobalModalProvider>
              <ToastProvider>
                <BannerProvider>
                  <StatusBar style="light" />
                  <SocketListener navigationRef={navigationRef} />
                  <ErrorBoundary>
                    <AppNavigator navigationRef={navigationRef} />
                  </ErrorBoundary>
                </BannerProvider>
              </ToastProvider>
            </GlobalModalProvider>
          </SocketDataProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
