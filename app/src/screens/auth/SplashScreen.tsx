import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, ImageBackground } from 'react-native';
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
import { Logo, FONTS, COLORS, GRADIENTS } from '../../components';
import { useApp } from '../../context/AppContext';
import { systemApi } from '../../services/api';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FOOTER_LOGO_SIZE = Math.max(120, Math.min(SCREEN_W * 0.34, 160));

// splash-bg.png is 864×1821 (a phone-shaped ~0.474 aspect), close enough to
// most phone screens that resizeMode="cover" barely crops it — but every
// vertical offset below was tuned by eye against ONE device height. Scaling
// them by actual screen height (against an 800dp reference) keeps the logo/
// loader/footer sitting at the same proportional spot on any screen, instead
// of drifting up or down as device height changes.
const VSCALE = SCREEN_H / 800;
const vs = (n: number) => Math.round(n * VSCALE);

// Minimum time the splash stays up so the loader animation is actually seen.
// This is polish only — real readiness (below) still gates navigation.
const MIN_SPLASH_MS = 1400;
const HEALTH_RETRY_MS = 2500;

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

    const ping = async () => {
      const { error } = await systemApi.health();
      if (cancelled) return;
      if (!error) {
        setBackendReady(true);
        return;
      }
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
      resizeMode="cover"
      style={styles.container}
    >
      <Animated.View style={[styles.content, fadeStyle]}>
        {/* Logo pinned near the top by a fixed offset — not flex-centered,
            so its position is exact and doesn't shift as other elements
            below it change size. */}
        <View style={styles.logoSection}>
          <Logo variant="splash" size={FOOTER_LOGO_SIZE} />
        </View>

        {/* Loader — its own fixed offset from the logo, independent of the
            flex layout below (which was absorbing marginTop changes here
            and masking them). Segment is now a gradient, not a flat fill. */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressSegment, progressBarStyle]}>
            <LinearGradient
              colors={GRADIENTS.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>

        {/* Footer pinned to an absolute distance from the bottom — decoupled
            from the flex column above so it can never be pushed around by
            logo/loader spacing changes. */}
        <View style={styles.footer}>
          <View style={styles.captionCard}>
            <View style={styles.captionIconChip}>
              <Ionicons name="shield-checkmark" size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.captionText}>CNIC-Verified Drivers. Ride With Confidence.</Text>
          </View>
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingTop: vs(80),
  },
  logoSection: { alignItems: 'center' },
  // ── Minimal flat progress indicator, no glow/blur ───────────────────
  progressTrack: {
    width: PROGRESS_TRACK_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
    marginTop: vs(450),
  },
  progressSegment: {
    position: 'absolute',
    width: PROGRESS_SEGMENT_W,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  // ── Footer: trust badge, pinned near the screen bottom ──────────────
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: vs(36),
    alignItems: 'center',
  },
  captionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  captionIconChip: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(26,115,232,0.18)',
  },
  captionText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONTS.semiBold,
    flexShrink: 1,
  },
});
