import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../components';
import { SplashIllustration } from '../../components/Illustrations';

export default function SplashScreen({ navigation }) {
  const logoScale  = useRef(new Animated.Value(0)).current;
  const logoOpac   = useRef(new Animated.Value(0)).current;
  const textOpac   = useRef(new Animated.Value(0)).current;
  const illOpac    = useRef(new Animated.Value(0)).current;
  const illTransY  = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,  { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(logoOpac,   { toValue: 1, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpac,   { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(illOpac,    { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(illTransY,  { toValue: 0, tension: 50, friction: 10, useNativeDriver: true }),
      ]),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Onboarding'), 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={[COLORS.primary, '#0a52c4', '#1a1a6e']} style={styles.container}>
      {/* Background circles */}
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />
      <View style={styles.bgCircle3} />

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoScale }], opacity: logoOpac }]}>
        <View style={styles.iconOuter}>
          <View style={styles.iconInner}>
            <Ionicons name="car-sport" size={46} color="#fff" />
          </View>
        </View>
      </Animated.View>

      {/* App name */}
      <Animated.View style={[styles.textWrap, { opacity: textOpac }]}>
        <Text style={styles.appName}>SafariShare</Text>
        <Text style={styles.tagline}>Your Smart Ride Sharing App</Text>
      </Animated.View>

      {/* SVG illustration */}
      <Animated.View style={[styles.illustrationWrap, { opacity: illOpac, transform: [{ translateY: illTransY }] }]}>
        <SplashIllustration size={240} />
      </Animated.View>

      {/* Bottom */}
      <View style={styles.bottomRow}>
        <Ionicons name="location-outline" size={13} color="rgba(255,255,255,0.45)" />
        <Text style={styles.bottomText}>Karachi • Lahore • Islamabad • Hyderabad</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bgCircle1: { position: 'absolute', width: 320, height: 320, borderRadius: 160, backgroundColor: 'rgba(255,255,255,0.04)', top: -100, left: -80 },
  bgCircle2: { position: 'absolute', width: 240, height: 240, borderRadius: 120, backgroundColor: 'rgba(255,255,255,0.04)', bottom: -60, right: -60 },
  bgCircle3: { position: 'absolute', width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,255,255,0.03)', top: '40%', right: -40 },
  logoWrap: { marginBottom: 16 },
  iconOuter: { width: 96, height: 96, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)' },
  iconInner: { width: 76, height: 76, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  textWrap: { alignItems: 'center', marginBottom: 32 },
  appName: { fontSize: 40, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 8, letterSpacing: 0.5 },
  illustrationWrap: { marginTop: 8 },
  bottomRow: { position: 'absolute', bottom: 48, flexDirection: 'row', alignItems: 'center', gap: 5 },
  bottomText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
});
