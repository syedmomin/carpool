import { useEffect, useRef } from 'react';
import { BackHandler, Platform, ToastAndroid } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

/**
 * Android-only: press hardware/system back twice within 2s to exit the app.
 * Use on home/root tab screens so a single back press doesn't kill the app.
 */
export function useDoubleBackExit(enabled = true) {
  const lastPress = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (!enabled || Platform.OS !== 'android') return;

      const onBack = () => {
        const now = Date.now();
        if (now - lastPress.current < 2000) {
          BackHandler.exitApp();
          return true;
        }
        lastPress.current = now;
        ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
        return true; // swallow the first press
      };

      const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => sub.remove();
    }, [enabled])
  );
}
