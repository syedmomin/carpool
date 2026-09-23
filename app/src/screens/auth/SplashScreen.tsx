import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Logo, FONTS, COLORS } from '../../components';
import { useApp } from '../../context/AppContext';
import { systemApi } from '../../services/api';

const { width: SCREEN_W } = Dimensions.get('window');
// Logo scales to ~40% of screen width, clamped so it never gets too big/small.
const LOGO_SIZE = Math.max(140, Math.min(SCREEN_W * 0.4, 180));
const GLOW_SIZE = LOGO_SIZE * 2.4;

// Minimum time the splash stays up so the loader animation is actually seen.
// This is polish only — real readiness (below) still gates navigation.
const MIN_SPLASH_MS = 1400;
const HEALTH_RETRY_MS = 2500;

// TEMP: splash design is being reviewed/edited — block auto-navigation so it
// stays on screen instead of jumping to login. Flip back to false when done.
const HOLD_FOR_DESIGN_REVIEW = true;

// Neon scan progress bar
const PROGRESS_TRACK_W = 160;
const PROGRESS_SEGMENT_W = 60;

export default function SplashScreen({ navigation, onDone }) {
  const { isLoading } = useApp();

  // Animation values
  const fadeOpacity = useSharedValue(0);
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fadeOpacity.value }));
  const navigated = useRef(false);

  // Neon scan progress bar
  const barProgress = useSharedValue(0);
  const progressBarStyle = useAnimatedStyle(() => ({
    transform: [{
      translateX: interpolate(
        barProgress.value,
        [0, 1],
        [-PROGRESS_SEGMENT_W, PROGRESS_TRACK_W]
      ),
    }],
  }));

  useEffect(() => {
    barProgress.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

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
    if (HOLD_FOR_DESIGN_REVIEW) return;
    if (navigated.current) return;
    if (!isLoading && backendReady && minElapsed) {
      navigated.current = true;
      onDone?.();
    }
  }, [isLoading, backendReady, minElapsed]);

  return (
    <LinearGradient
      colors={['#060d24', '#0d1b4b', '#1a3585', '#0d1b4b']}
      locations={[0, 0.35, 0.65, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Faint accent glow, top-right — echoes the logo's green half */}
      <LinearGradient
        colors={['rgba(46,204,113,0.16)', 'rgba(46,204,113,0)']}
        style={styles.accentGlow}
        pointerEvents="none"
      />

      {/* Bottom vignette — grounds the caption card, adds depth */}
      <LinearGradient
        colors={['rgba(6,10,28,0)', 'rgba(6,10,28,0.55)']}
        style={styles.vignette}
        pointerEvents="none"
      />

      <Animated.View style={[styles.content, fadeStyle]}>
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['rgba(26,115,232,0.4)', 'rgba(26,115,232,0.14)', 'rgba(26,115,232,0)']}
            locations={[0, 0.5, 1]}
            style={styles.glow}
            pointerEvents="none"
          />
          <Logo variant="splash" size={LOGO_SIZE} />
          <Text style={styles.tagline}>Har Safar Mein Sath</Text>
        </View>

        {/* ── Center spacer ── */}
        <View style={styles.loaderSection}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressGlow, progressBarStyle]} />
            <Animated.View style={[styles.progressSegment, progressBarStyle]} />
          </View>
          <Text style={styles.connectingText}>{connecting ? 'Connecting…' : 'Loading…'}</Text>
        </View>

        <View style={styles.captionCard}>
          <View style={styles.captionIconChip}>
            <Ionicons name="shield-checkmark" size={16} color="#4ade80" />
          </View>
          <Text style={styles.captionText}>CNIC-Verified Drivers. Ride With Confidence.</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  accentGlow: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 260,
    height: 260,
    borderRadius: 130,
  },
  vignette: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '32%',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: '22%',
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
    borderRadius: GLOW_SIZE / 2,
  },
  tagline: {
    color: '#9ec5ff',
    fontSize: 14,
    fontFamily: FONTS.medium,
    letterSpacing: 0.3,
    marginTop: 6,
  },
  // ── Neon scan progress bar, sits low, closer to the caption card ───
  loaderSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 36,
  },
  progressTrack: {
    width: PROGRESS_TRACK_W,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  progressGlow: {
    position: 'absolute',
    width: PROGRESS_SEGMENT_W + 20,
    height: 14,
    top: -4.5,
    left: -10,
    borderRadius: 7,
    backgroundColor: COLORS.primary,
    opacity: 0.45,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
  },
  progressSegment: {
    position: 'absolute',
    width: PROGRESS_SEGMENT_W,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#bfe6ff',
  },
  connectingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontFamily: FONTS.medium,
    letterSpacing: 0.5,
    marginTop: 14,
  },
  captionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  captionIconChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(74,222,128,0.16)',
  },
  captionText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    flexShrink: 1,
  },
});
