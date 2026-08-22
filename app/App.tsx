import React, { useEffect, useRef } from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from "@expo-google-fonts/poppins";
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

export default function App() {
  const navigationRef = useRef(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
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
