import React, { createContext, useContext, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, Text, Pressable, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../components/theme';
import { getNotificationStyle } from '../utils/notificationStyle';
import { registerBanner, BannerPayload } from '../utils/bannerBus';

/**
 * BannerContext — global, Uber/inDrive-style in-app notification banner.
 * Slides down from the top, auto-dismisses, swipe-up or tap to dismiss, and
 * tap triggers an optional action. Driven by socket events (SocketListener) and
 * FCM foreground messages (via bannerBus). Background/quit pushes are handled by
 * the OS notification tray instead.
 */
interface BannerContextState {
  showBanner: (payload: BannerPayload) => void;
}

const BannerContext = createContext<BannerContextState | null>(null);
const AUTO_DISMISS_MS = 4500;

export function BannerProvider({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const [banner, setBanner] = useState<BannerPayload | null>(null);
  const translateY = useRef(new Animated.Value(-200)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(translateY, { toValue: -200, duration: 220, useNativeDriver: true })
      .start(() => setBanner(null));
  }, [translateY]);

  const showBanner = useCallback((payload: BannerPayload) => {
    if (!payload?.title) return;
    // Dedupe: socket + FCM can both fire for the same event in foreground.
    const key = `${payload.title}|${payload.message}`;
    const now = Date.now();
    if (lastRef.current.key === key && now - lastRef.current.at < AUTO_DISMISS_MS) return;
    lastRef.current = { key, at: now };

    if (timerRef.current) clearTimeout(timerRef.current);
    setBanner(payload);
    translateY.setValue(-200);
    Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6, speed: 13 }).start();
    timerRef.current = setTimeout(hide, AUTO_DISMISS_MS);
  }, [translateY, hide]);

  // Register/unregister the module-level bridge for non-React callers.
  useEffect(() => {
    registerBanner(showBanner);
    return () => registerBanner(null);
  }, [showBanner]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy < -6,
      onPanResponderMove: (_, g) => { if (g.dy < 0) translateY.setValue(g.dy); },
      onPanResponderRelease: (_, g) => {
        if (g.dy < -30) hide();
        else Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  const handlePress = () => {
    banner?.onPress?.();
    hide();
  };

  const style = getNotificationStyle(banner?.kind);

  return (
    <BannerContext.Provider value={{ showBanner }}>
      {children}
      {banner && (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.wrap, { paddingTop: insets.top + 6, transform: [{ translateY }] }]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={handlePress} style={styles.card}>
            <View style={styles.accent}>
              <LinearGradient colors={style.gradient as any} style={StyleSheet.absoluteFill} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title} numberOfLines={1}>{banner.title}</Text>
              {!!banner.message && <Text style={styles.message}>{banner.message}</Text>}
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} style={{ alignSelf: 'center' }} />
          </Pressable>
          <View style={styles.grabber} />
        </Animated.View>
      )}
    </BannerContext.Provider>
  );
}

export const useBanner = () => {
  const ctx = useContext(BannerContext);
  if (!ctx) throw new Error('useBanner must be used within BannerProvider');
  return ctx;
};

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999, paddingHorizontal: 12 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#fff',
    borderRadius: 18, padding: 14, paddingLeft: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 14,
    elevation: 10,
  },
  accent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 5 },
  content: { flex: 1, paddingRight: 6 },
  title: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 3 },
  message: { fontSize: 11.5, fontWeight: '500', color: COLORS.textSecondary, lineHeight: 18 },
  grabber: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: COLORS.border, marginTop: 6 },
});

