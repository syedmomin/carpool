import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

/**
 * Real device-level internet reachability (Wi-Fi/cellular), independent of
 * the app's own socket connection. `null` until NetInfo reports its first
 * reading — treat that as "unknown", not "offline", so we never flash the
 * no-internet screen on cold start.
 */
export function useIsConnected(): boolean | null {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? null);
    });
    return unsub;
  }, []);

  return isConnected;
}
