import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { socketService } from '../services/socket.service';
import { useApp } from '../context/AppContext';
import { useIsConnected } from '../hooks/useIsConnected';

/**
 * Thin top bar shown when the realtime connection drops, so users know why
 * live updates (booking requests, ride status) have stopped arriving. Debounced
 * so a brief reconnect doesn't flash it.
 */
export default function OfflineBanner() {
  const { currentUser } = useApp() as any;
  const insets = useSafeAreaInsets();
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The device having no internet is handled by NoInternetScreen's full-screen
  // takeover instead — don't stack this banner on top of it.
  const isConnected = useIsConnected();

  useEffect(() => {
    const unsub = socketService.onConnectionChange((connected) => {
      if (timer.current) clearTimeout(timer.current);
      if (connected) {
        setShow(false);
      } else {
        // Only surface after the disconnect persists a few seconds.
        timer.current = setTimeout(() => setShow(true), 4000);
      }
    });
    return () => { if (timer.current) clearTimeout(timer.current); unsub(); };
  }, []);

  if (!currentUser || !show || isConnected === false) return null;

  return (
    <View style={[styles.bar, { paddingTop: insets.top + 6 }]}>
      <Ionicons name="cloud-offline-outline" size={14} color="#fff" />
      <Text style={styles.text}>No connection. Reconnecting…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#374151', paddingBottom: 8, paddingHorizontal: 12,
  },
  text: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
