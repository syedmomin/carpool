import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../components';

export default function SplashScreen({ navigation }) {
  const logoAnim = new Animated.Value(0);
  const textAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.sequence([
      Animated.spring(logoAnim, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(textAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(() => navigation.replace('Onboarding'), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.primaryDark, '#1a1a6e']} style={styles.container}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      <Animated.View style={[styles.logoContainer, { transform: [{ scale: logoAnim }], opacity: logoAnim }]}>
        <View style={styles.iconWrapper}>
          <Ionicons name="car-sport" size={52} color="#fff" />
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textAnim }]}>
        <Text style={styles.appName}>SafariShare</Text>
        <Text style={styles.tagline}>Your Smart Ride Sharing App</Text>
      </Animated.View>

      <View style={styles.bottomRow}>
        <Ionicons name="location-outline" size={14} color="rgba(255,255,255,0.5)" />
        <Text style={styles.bottomText}>Karachi • Lahore • Islamabad • Hyderabad</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bgCircle1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(255,255,255,0.05)', top: -80, left: -80 },
  bgCircle2: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -60, right: -60 },
  logoContainer: { marginBottom: 24 },
  iconWrapper: { width: 100, height: 100, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  textContainer: { alignItems: 'center' },
  appName: { fontSize: 38, fontWeight: '900', color: '#fff', letterSpacing: 1 },
  tagline: { fontSize: 14, color: 'rgba(255,255,255,0.75)', marginTop: 8, letterSpacing: 0.5 },
  bottomRow: { position: 'absolute', bottom: 50, flexDirection: 'row', alignItems: 'center' },
  bottomText: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 6 },
});
