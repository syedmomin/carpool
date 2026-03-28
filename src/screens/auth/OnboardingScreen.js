import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton } from '../../components';
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
    title: 'Find Rides Easily',
    subtitle: 'From Karachi to Lahore, Hyderabad to Larkana — find a ride in seconds.',
    bg: ['#1a73e8', '#0d47a1'],
  },
  {
    id: '2',
    Illustration: ShareRideIllustration,
    title: 'Share & Earn',
    subtitle: 'Share empty seats in your car, bus, or coaster and earn extra income on every trip.',
    bg: ['#00897b', '#00695c'],
  },
  {
    id: '3',
    Illustration: SafetyIllustration,
    title: 'Safe & Verified',
    subtitle: 'Every driver is CNIC verified. Real reviews, ratings and secure bookings guaranteed.',
    bg: ['#7b1fa2', '#4a148c'],
  },
  {
    id: '4',
    Illustration: AffordableIllustration,
    title: 'Affordable Journeys',
    subtitle: 'Even cheaper than the bus! Share expenses and enjoy a comfortable, affordable journey.',
    bg: ['#f57c00', '#e65100'],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.replace('Login');
    }
  };

  const renderSlide = ({ item }) => (
    <LinearGradient colors={item.bg} style={styles.slide}>
      <View style={styles.bgCircle1} />
      <View style={styles.bgCircle2} />

      {/* SVG Illustration */}
      <View style={styles.illustrationWrap}>
        <View style={styles.illustrationBg}>
          <item.Illustration size={width * 0.55} />
        </View>
      </View>

      <Text style={styles.slideTitle}>{item.title}</Text>
      <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onMomentumScrollEnd={e =>
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      />

      <View style={styles.bottomContainer}>
        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 26, 8], extrapolate: 'clamp' });
            const opacity  = scrollX.interpolate({ inputRange, outputRange: [0.35, 1, 0.35], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[currentIndex].bg[0] }]}
              />
            );
          })}
        </View>

        <PrimaryButton
          title={currentIndex === SLIDES.length - 1 ? 'Get Started!' : 'Next'}
          onPress={handleNext}
          icon={currentIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward-outline'}
          colors={SLIDES[currentIndex].bg}
        />

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
            <Ionicons name="chevron-forward" size={14} color={COLORS.gray} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: { width, height: height * 0.70, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bgCircle1: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.06)', top: -70, right: -70 },
  bgCircle2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)', bottom: -40, left: -40 },

  illustrationWrap: { marginBottom: 36 },
  illustrationBg: {
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },

  slideTitle:    { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 14, lineHeight: 36 },
  slideSubtitle: { fontSize: 15, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 23 },

  bottomContainer: { flex: 1, paddingHorizontal: 32, paddingTop: 20, justifyContent: 'space-between', paddingBottom: 36 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  skipBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14, gap: 3 },
  skipText: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
});
