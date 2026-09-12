import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, FONTS } from './theme';
import { GhostButton } from './Button';

/**
 * Full-screen takeover shown only when the device itself has no internet
 * (Wi-Fi/cellular down) — distinct from OfflineBanner, which covers a
 * live socket drop while the internet is otherwise fine. Blocks the rest
 * of the app so users aren't left staring at stale/broken screens.
 */
export default function NoInternetScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="cloud-offline-outline" size={48} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>No Internet Connection</Text>
      <Text style={styles.subtitle}>
        Check your Wi-Fi or mobile data. We'll reconnect automatically once you're back online.
      </Text>
      <GhostButton title="Try Again" icon="refresh" onPress={() => NetInfo.fetch()} style={styles.retryBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
    zIndex: 999999,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrap: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 18, fontFamily: FONTS.extraBold, color: COLORS.textPrimary,
    textAlign: 'center', letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13.5, fontFamily: FONTS.medium, color: COLORS.gray,
    textAlign: 'center', lineHeight: 20, marginTop: 8, maxWidth: 280,
  },
  retryBtn: { marginTop: 24, minWidth: 160 },
});
