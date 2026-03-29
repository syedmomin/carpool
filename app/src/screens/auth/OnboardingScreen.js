import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Dimensions, TouchableOpacity,
  Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../components';
import {
  SearchIllustration,
  ShareRideIllustration,
  SafetyIllustration,
  AffordableIllustration,
} from '../../components/Illustrations';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    Illustration: SearchIllustration,
    title: 'Find Rides\nInstantly',
    subtitle: 'From Karachi to Lahore, Islamabad to Peshawar — search thousands of routes in seconds.',
    bg: ['#0d1b4b', '#1565c0'],
    accent: '#ff9100',
    icon: 'search-outline',
  },
  {
    id: '2',
    Illustration: ShareRideIllustration,
    title: 'Share & Earn\nExtra Income',
    subtitle: 'Have empty seats? Post your ride and earn money on every trip you were already taking.',
    bg: ['#004d40', '#00897b'],
    accent: '#69f0ae',
    icon: 'cash-outline',
  },
  {
    id: '3',
    Illustration: SafetyIllustration,
    title: 'Verified &\nSafe Drivers',
    subtitle: 'Every driver is CNIC verified. Real passenger reviews and ratings keep you safe.',
    bg: ['#311b92', '#6200ea'],
    accent: '#ea80fc',
    icon: 'shield-checkmark-outline',
  },
  {
    id: '4',
    Illustration: AffordableIllustration,
    title: 'Save More,\nTravel Better',
    subtitle: 'Split travel costs and enjoy comfortable rides at prices often cheaper than public transport.',
    bg: ['#bf360c', '#f4511e'],
    accent: '#ffd740',
    icon: 'wallet-outline',
  },
];

export default function OnboardingScreen({ navigation, onDone }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef   = useRef(null);
  const scrollX       = useRef(new Animated.Value(0)).current;
  const buttonScale   = useRef(new Animated.Value(1)).current;

  const goTo = (index) => {
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const handleNext = () => {
    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.93, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1,    duration: 80, useNativeDriver: true }),
    ]).start();

    if (currentIndex < SLIDES.length - 1) {
      goTo(currentIndex + 1);
    } else {
      onDone?.(); navigation.replace('Login');
    }
  };

  const slide = SLIDES[currentIndex];

  const renderSlide = ({ item, index }) => (
    <View style={styles.slide}>
      {/* Illustration circle */}
      <View style={styles.illustrationOuter}>
        <View style={[styles.illustrationRing, { borderColor: item.accent + '30' }]}>
          <View style={[styles.illustrationInner, { backgroundColor: 'rgba(255,255,255,0.08)' }]}>
            <item.Illustration size={width * 0.50} />
          </View>
        </View>
        {/* Floating icon badge */}
        <View style={[styles.iconBadge, { backgroundColor: item.accent }]}>
          <Ionicons name={item.icon} size={18} color="#fff" />
        </View>
      </View>

      {/* Text */}
      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSub}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen gradient — changes with slide */}
      <LinearGradient
        colors={slide.bg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Decorative arcs */}
      <View style={[styles.arc1, { borderColor: slide.accent + '18' }]} />
      <View style={[styles.arc2, { borderColor: slide.accent + '10' }]} />

      {/* Skip */}
      {currentIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={() => navigation.replace('Login')}>
          <Text style={styles.skipText}>Skip</Text>
          <Ionicons name="chevron-forward" size={14} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      )}

      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e =>
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        style={styles.flatList}
      />

      {/* Bottom section */}
      <View style={styles.bottom}>
        {/* Step counter */}
        <Text style={styles.stepCounter}>
          <Text style={{ color: slide.accent, fontWeight: '800' }}>{currentIndex + 1}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.4)' }}> / {SLIDES.length}</Text>
        </Text>

        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((s, i) => {
            const inputRange  = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth    = scrollX.interpolate({ inputRange, outputRange: [6, 22, 6],  extrapolate: 'clamp' });
            const dotOpacity  = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
            return (
              <TouchableOpacity key={i} onPress={() => goTo(i)}>
                <Animated.View
                  style={[
                    styles.dot,
                    { width: dotWidth, opacity: dotOpacity, backgroundColor: SLIDES[i].accent },
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Next / Get Started button */}
        <Animated.View style={{ transform: [{ scale: buttonScale }], width: '100%' }}>
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient
              colors={[slide.accent, slide.accent + 'cc']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGrad}
            >
              <Text style={styles.nextBtnText}>
                {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <View style={styles.nextBtnIcon}>
                <Ionicons
                  name={currentIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward'}
                  size={18}
                  color={slide.accent}
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Login link */}
        <TouchableOpacity style={styles.loginRow} onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginText}>Already have an account? </Text>
          <Text style={[styles.loginLink, { color: slide.accent }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  flatList:    { flex: 1 },

  // Decorative
  arc1: { position: 'absolute', width: 420, height: 420, borderRadius: 210, borderWidth: 1, top: -160, right: -100 },
  arc2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 1, bottom: 100, left: -100 },

  // Skip
  skipBtn: { position: 'absolute', top: 56, right: 24, zIndex: 10, flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)' },
  skipText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },

  // Slide
  slide:             { width, paddingTop: 100, paddingHorizontal: 32, alignItems: 'center' },
  illustrationOuter: { marginBottom: 44, position: 'relative' },
  illustrationRing:  { width: width * 0.68, height: width * 0.68, borderRadius: width * 0.34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  illustrationInner: { width: width * 0.60, height: width * 0.60, borderRadius: width * 0.30, alignItems: 'center', justifyContent: 'center' },
  iconBadge:         { position: 'absolute', bottom: 12, right: 12, width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
  slideTitle:        { fontSize: 34, fontWeight: '900', color: '#fff', textAlign: 'center', lineHeight: 42, letterSpacing: -0.5, marginBottom: 16 },
  slideSub:          { fontSize: 15, color: 'rgba(255,255,255,0.7)', textAlign: 'center', lineHeight: 24, paddingHorizontal: 8 },

  // Bottom
  bottom:       { paddingHorizontal: 28, paddingBottom: 44, alignItems: 'center', gap: 16 },
  stepCounter:  { fontSize: 13, letterSpacing: 0.5 },
  dotsRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot:          { height: 6, borderRadius: 3 },
  nextBtn:      { width: '100%', borderRadius: 18, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8 },
  nextBtnGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 17, paddingHorizontal: 28, gap: 10 },
  nextBtnText:  { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  nextBtnIcon:  { width: 32, height: 32, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  loginRow:     { flexDirection: 'row', alignItems: 'center' },
  loginText:    { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  loginLink:    { fontSize: 13, fontWeight: '700' },
});
