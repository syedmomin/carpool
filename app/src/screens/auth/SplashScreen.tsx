import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Logo, FONTS } from '../../components';
import { useApp } from '../../context/AppContext';
import { systemApi } from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
// Logo scales to ~44% of screen width, clamped so it never gets too big/small.
const LOGO_SIZE = Math.max(160, Math.min(SCREEN_W * 0.44, 200));

// Minimum time the splash stays up so the loader animation is actually seen.
// This is polish only — real readiness (below) still gates navigation.
const MIN_SPLASH_MS = 1400;
const HEALTH_RETRY_MS = 2500;

export default function SplashScreen({ navigation, onDone }) {
  const { isLoading } = useApp();

  // Animation values
  const fadeOpacity = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeOpacity.value }));
  const navigated = useRef(false);

  // Dynamic readiness signals (no hardcoded navigation delay)
  const [backendReady, setBackendReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [connecting, setConnecting] = useState(false); // shown only if it takes a while

  useEffect(() => {
    fadeOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  // Minimum on-screen time floor
  useEffect(() => {
    const id = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(id);
  }, []);

  // Poll the backend until it's reachable (confirms both internet + server up).
  // Retries on failure, so it proceeds the moment connectivity is restored.
  useEffect(() => {
    let cancelled = false;
    let timer: any;
    let attempts = 0;

    const ping = async () => {
      const { error } = await systemApi.health();
      if (cancelled) return;
      if (!error) {
        setConnecting(false);
        setBackendReady(true);
        return;
      }
      attempts += 1;
      if (attempts >= 2) setConnecting(true); // surface a hint if it's slow/offline
      timer = setTimeout(ping, HEALTH_RETRY_MS);
    };

    ping();
    return () => { cancelled = true; clearTimeout(timer); };
  }, []);

  // Advance only when EVERYTHING is ready: auth bootstrap done + backend reachable
  // + minimum splash time elapsed. AppNavigator then routes to dashboard (if logged
  // in) or the auth screen automatically based on currentUser.
  useEffect(() => {
    if (navigated.current) return;
    if (!isLoading && backendReady && minElapsed) {
      navigated.current = true;
      onDone?.();
    }
  }, [isLoading, backendReady, minElapsed]);

  return (
    <ImageBackground
      source={require('../../../assets/splash-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better text readability */}
      <View style={styles.overlay} />

      <Animated.View style={[styles.content, fadeStyle]}>
        <View style={styles.logoContainer}>
          <Logo variant="splash" size={LOGO_SIZE} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.tagline}>Saath Chalein, Saath Bachaein</Text>
        </View>

        {/* ── Center: pagination-style progress indicator ── */}
        <View style={styles.loaderSection}>
          <View style={styles.dots}>
            <View style={[styles.dot, styles.dotActive]} />
            <View style={styles.dot} />
          </View>
          {connecting && <Text style={styles.connectingText}>Connecting…</Text>}
        </View>

        <View style={styles.captionRow}>
          <Ionicons name="shield-checkmark" size={16} color="#fff" />
          <Text style={styles.captionText}>Verified Rides. Safe Journeys. For Everyone.</Text>
        </View>
      </Animated.View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 14, 41, 0.4)', // dark blue tint overlay
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '18%',
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: -8,
  },
  tagline: {
    color: '#9ec5ff',
    fontSize: 15,
    fontFamily: FONTS.bold,
    letterSpacing: 0.3,
    marginTop: 6,
  },
  // ── Center: pagination indicator ──────────────────────────────
  loaderSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {
    width: 22,
    backgroundColor: '#ffffff',
  },
  connectingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginTop: 12,
  },
  captionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  captionText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONTS.semiBold,
  },
});
