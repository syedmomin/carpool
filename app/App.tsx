import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { AppProvider } from "./src/context/AppContext";
import { ToastProvider } from "./src/context/ToastContext";
import { GlobalModalProvider } from "./src/context/GlobalModalContext";
import { BannerProvider } from "./src/context/BannerContext";
import { ErrorBoundary } from "./src/components/ErrorBoundary";
import OfflineBanner from "./src/components/OfflineBanner";
import AppNavigator from "./src/navigation/AppNavigator";
import SocketListener from "./src/components/SocketListener";
import { SocketDataProvider } from "./src/context/SocketDataContext";
import { setupNotificationListeners } from "./src/utils/notifications";
// Side-effect import: registers the background location task with TaskManager
// at startup. Without this, TaskManager.defineTask never runs and
// startLocationUpdatesAsync(LOCATION_TASK_NAME) throws "task not found".
import "./src/tasks/locationTask";

// Note: the global Inter font is applied by patching StyleSheet.create in
// src/utils/globalFontPatch.ts, called from index.tsx BEFORE this module (and
// therefore every screen it imports) loads. See that file for why it can't
// live here — static imports are hoisted, so by the time this file's own
// code runs, every screen has already called the *unpatched* StyleSheet.create.

export default function App() {
  const navigationRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    // Wire notification tap navigation once navigation is ready
    const cleanup = setupNotificationListeners(navigationRef);
    return cleanup;
  }, []);

  // Block on fonts before anything renders — avoids a system-font flash on
  // first paint. Plain navy fill (matches the splash background color) since
  // the branded SplashScreen itself renders text that needs these fonts.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: "#0d1b4b" }} />;
  }

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
                  <OfflineBanner />
                </BannerProvider>
              </ToastProvider>
            </GlobalModalProvider>
          </SocketDataProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
