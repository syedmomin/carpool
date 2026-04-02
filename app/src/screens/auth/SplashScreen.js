import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

const { width } = Dimensions.get('window');

export default function SplashScreen({ navigation, onDone }) {
  const { currentUser, userRole, isLoading } = useApp();

  // Animation values
  const logoScale  = useRef(new Animated.Value(0.3)).current;
  const logoOpac   = useRef(new Animated.Value(0)).current;
  const lineWidth  = useRef(new Animated.Value(0)).current;
  const textOpac   = useRef(new Animated.Value(0)).current;
  const tagOpac    = useRef(new Animated.Value(0)).current;
  const badgeOpac  = useRef(new Animated.Value(0)).current;
  const badgeY     = useRef(new Animated.Value(20)).current;
  const dotOpac1   = useRef(new Animated.Value(0)).current;
  const dotOpac2   = useRef(new Animated.Value(0)).current;
  const dotOpac3   = useRef(new Animated.Value(0)).current;
  const navigated  = useRef(false);

  useEffect(() => {
    Animated.sequence([
      // 1. Logo pops in
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpac,  { toValue: 1, duration: 350, useNativeDriver: true }),
      ]),
      // 2. Accent line draws
      Animated.timing(lineWidth, { toValue: 1, duration: 400, useNativeDriver: true }),
      // 3. Brand name fades in
      Animated.timing(textOpac, { toValue: 1, duration: 350, useNativeDriver: true }),
      // 4. Tagline fades in
      Animated.timing(tagOpac, { toValue: 1, duration: 300, useNativeDriver: true }),
      // 5. Feature badges slide up
      Animated.parallel([
        Animated.timing(badgeOpac, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(badgeY,    { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
      ]),
      // 6. City dots appear
      Animated.stagger(120, [
        Animated.timing(dotOpac1, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(dotOpac2, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(dotOpac3, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading || navigated.current) return;
    const delay = currentUser ? 1400 : 2800;
    const timer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      // onDone calls AppNavigator's setSplashVisible(false)
      // which then triggers the main routing logic.
      onDone?.();
    }, delay);
    return () => clearTimeout(timer);
  }, [isLoading, currentUser, userRole]);

  const lineScaleX = lineWidth.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const FEATURES = [
    { icon: 'shield-checkmark-outline', label: 'Verified Drivers' },
    { icon: 'cash-outline',             label: 'Cash on Board' },
    { icon: 'location-outline',         label: 'Live Tracking' },
  ];

  const CITIES = [
    { name: 'Karachi',    dot: dotOpac1 },
    { name: 'Lahore',     dot: dotOpac2 },
    { name: 'Islamabad',  dot: dotOpac3 },
  ];

  return (
    <LinearGradient
      colors={['#0d1b4b', '#1a3a8a', '#1565c0']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Background decorative shapes */}
      <View style={styles.bgArc1} />
      <View style={styles.bgArc2} />
      <View style={styles.bgDot1} />
      <View style={styles.bgDot2} />

      {/* ── Logo block ─────────────────────────────────────────────────── */}
      <Animated.View style={[styles.logoBlock, { transform: [{ scale: logoScale }], opacity: logoOpac }]}>
        {/* Outer glow ring */}
        <View style={styles.glowRing}>
          {/* Inner icon container */}
          <LinearGradient
            colors={['#2979ff', '#0d47a1']}
            style={styles.iconBox}
          >
            <Ionicons name="car-sport" size={40} color="#fff" />
          </LinearGradient>
        </View>
        {/* Small road icon badge */}
        <View style={styles.badge}>
          <Ionicons name="navigate" size={11} color="#fff" />
        </View>
      </Animated.View>

      {/* ── Accent divider line ─────────────────────────────────────────── */}
      <View style={styles.lineWrap}>
        <Animated.View style={[styles.accentLine, { transform: [{ scaleX: lineScaleX }] }]} />
      </View>

      {/* ── Brand name ─────────────────────────────────────────────────── */}
      <Animated.View style={[styles.brandWrap, { opacity: textOpac }]}>
        <Text style={styles.brandName}>
          <Text style={styles.brandChap}>Chal</Text>
          <Text style={styles.brandParo}>Paro</Text>
        </Text>
      </Animated.View>

      {/* ── Tagline ─────────────────────────────────────────────────────── */}
      <Animated.Text style={[styles.tagline, { opacity: tagOpac }]}>
        Pakistan's Smart Ride-Sharing Network
      </Animated.Text>

      {/* ── Feature badges ──────────────────────────────────────────────── */}
      <Animated.View style={[styles.featuresRow, { opacity: badgeOpac, transform: [{ translateY: badgeY }] }]}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureBadge}>
            <View style={styles.featureIconWrap}>
              <Ionicons name={f.icon} size={15} color="#64b5f6" />
            </View>
            <Text style={styles.featureText}>{f.label}</Text>
          </View>
        ))}
      </Animated.View>

      {/* ── Cities ──────────────────────────────────────────────────────── */}
      <View style={styles.citiesRow}>
        {CITIES.map((c, i) => (
          <Animated.View key={i} style={[styles.cityItem, { opacity: c.dot }]}>
            <View style={styles.cityDot} />
            <Text style={styles.cityName}>{c.name}</Text>
          </Animated.View>
        ))}
      </View>

      {/* ── Bottom strip ────────────────────────────────────────────────── */}
      <View style={styles.bottomStrip}>
        <Text style={styles.bottomText}>Made in Pakistan 🇵🇰</Text>
        <View style={styles.versionPill}>
          <Text style={styles.versionText}>v1.0</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Background decorations
  bgArc1: { position: 'absolute', width: 380, height: 380, borderRadius: 190, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', top: -120, left: -100 },
  bgArc2: { position: 'absolute', width: 280, height: 280, borderRadius: 140, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)', bottom: -60, right: -80 },
  bgDot1: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.15)', top: '25%', left: '12%' },
  bgDot2: { position: 'absolute', width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)', top: '60%', right: '10%' },

  // Logo
  logoBlock: { marginBottom: 20, position: 'relative' },
  glowRing: {
    width: 108, height: 108, borderRadius: 30,
    backgroundColor: 'rgba(41, 121, 255, 0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(100, 181, 246, 0.3)',
    shadowColor: '#2979ff', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20,
    elevation: 10,
  },
  iconBox: { width: 80, height: 80, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', bottom: -6, right: -6,
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#ff6f00', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#0d1b4b',
  },

  // Accent line
  lineWrap:   { width: 120, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.1)', marginBottom: 18, overflow: 'hidden' },
  accentLine: { height: '100%', borderRadius: 2, backgroundColor: '#ff6f00' },

  // Brand
  brandWrap:  { marginBottom: 8 },
  brandName:  { fontSize: 46, fontWeight: '900', letterSpacing: -1 },
  brandChap:  { color: '#ffffff' },
  brandParo:  { color: '#ff9100' },

  // Tagline
  tagline: { fontSize: 13, color: 'rgba(255,255,255,0.6)', letterSpacing: 0.5, marginBottom: 36, textAlign: 'center' },

  // Features
  featuresRow:     { flexDirection: 'row', gap: 12, marginBottom: 40 },
  featureBadge:    { alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  featureIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: 'rgba(41,121,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  featureText:     { fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: '600', textAlign: 'center' },

  // Cities
  citiesRow: { flexDirection: 'row', gap: 18, marginBottom: 0 },
  cityItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cityDot:   { width: 5, height: 5, borderRadius: 3, backgroundColor: '#ff9100' },
  cityName:  { fontSize: 11, color: 'rgba(255,255,255,0.45)' },

  // Bottom
  bottomStrip: { position: 'absolute', bottom: 44, flexDirection: 'row', alignItems: 'center', gap: 10 },
  bottomText:  { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  versionPill: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  versionText: { fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: '600' },
});
