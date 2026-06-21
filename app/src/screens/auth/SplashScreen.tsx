import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Logo } from '../../components';
import { useApp } from '../../context/AppContext';

export default function SplashScreen({ navigation, onDone }) {
  const { currentUser, userRole, isLoading } = useApp();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigated = useRef(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (isLoading || navigated.current) return;
    const delay = currentUser ? 1400 : 2800;
    const timer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      onDone?.();
    }, delay);
    return () => clearTimeout(timer);
  }, [isLoading, currentUser, userRole]);

  return (
    <ImageBackground
      source={require('../../../assets/splash-bg.png')}
      style={styles.container}
      resizeMode="cover"
    >
      {/* Dark overlay for better text readability */}
      <View style={styles.overlay} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoContainer}>
          <Logo variant="splash" size={250} />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.blueText}>Pakistan's Trusted</Text>
          <Text style={styles.whiteText}>Carpooling Platform</Text>
        </View>

        <View style={{ flex: 1 }} />

        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={24} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>Verified Drivers</Text>
            <Text style={styles.featureSub}>Safe & Trusted</Text>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={styles.iconCircleGreen}>
              <Ionicons name="people" size={24} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>Save Together</Text>
            <Text style={styles.featureSub}>Lower Travel Cost</Text>
          </View>

          <View style={styles.featureDivider} />

          <View style={styles.featureItem}>
            <View style={styles.iconCircleBlue}>
              <Ionicons name="location" size={24} color="#fff" />
            </View>
            <Text style={styles.featureTitle}>Live Tracking</Text>
            <Text style={styles.featureSub}>Real-time Updates</Text>
          </View>
        </View>

        <View style={styles.bottomFooter}>
          <Text style={styles.footerText}>🇵🇰 Made in Pakistan 💚</Text>
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
    paddingTop: '20%',
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: -20,
  },
  blueText: {
    color: '#2979ff',
    fontSize: 18,
    fontWeight: '600',
  },
  whiteText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 10,
    marginBottom: 40,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1565c0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconCircleGreen: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2e7d32',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  iconCircleBlue: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0277bd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  featureSub: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  bottomFooter: {
    marginBottom: 10,
  },
  footerText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
