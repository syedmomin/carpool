import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton } from '../../components';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  { id: '1', icon: 'search-outline',          title: 'Ride Dhundho Asaani Se',       subtitle: 'Karachi se Lahore, Hyderabad se Larkana — jahan bhi jao, ride mile aasaan.',      bg: ['#1a73e8', '#0d47a1'] },
  { id: '2', icon: 'car-sport-outline',        title: 'Driver? Apni Seat Share Karo', subtitle: 'Apni gaari, bus ya coaster mein khali seats share karo aur extra income kamao.',   bg: ['#00897b', '#00695c'] },
  { id: '3', icon: 'shield-checkmark-outline', title: 'Safe & Verified',              subtitle: 'Har driver CNIC verified hai. Real reviews, ratings aur secure booking.',          bg: ['#7b1fa2', '#4a148c'] },
  { id: '4', icon: 'wallet-outline',           title: 'Sasta Safar',                 subtitle: 'Bus se bhi sasta! Share karo expenses aur enjoy karo comfortable journey.',        bg: ['#f57c00', '#e65100'] },
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
      <View style={styles.iconCircle}>
        <View style={styles.iconInner}>
          <Ionicons name={item.icon} size={60} color="#fff" />
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
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={e => setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
      />

      <View style={styles.bottomContainer}>
        {/* Animated dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({ inputRange, outputRange: [8, 24, 8], extrapolate: 'clamp' });
            const opacity = scrollX.interpolate({ inputRange, outputRange: [0.4, 1, 0.4], extrapolate: 'clamp' });
            return (
              <Animated.View
                key={i}
                style={[styles.dot, { width: dotWidth, opacity, backgroundColor: SLIDES[currentIndex].bg[0] }]}
              />
            );
          })}
        </View>

        <PrimaryButton
          title={currentIndex === SLIDES.length - 1 ? 'Shuru Karen!' : 'Agla'}
          onPress={handleNext}
          icon={currentIndex === SLIDES.length - 1 ? 'rocket-outline' : 'arrow-forward-outline'}
          colors={SLIDES[currentIndex].bg}
        />

        {currentIndex < SLIDES.length - 1 && (
          <TouchableOpacity onPress={() => navigation.replace('Login')} style={styles.skipBtn}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  slide: { width, height: height * 0.72, alignItems: 'center', justifyContent: 'center', padding: 32 },
  bgCircle1: { position: 'absolute', width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(255,255,255,0.06)', top: -60, right: -60 },
  bgCircle2: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.06)', bottom: -30, left: -30 },
  iconCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  iconInner: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  slideTitle: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', marginBottom: 16, lineHeight: 36 },
  slideSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.82)', textAlign: 'center', lineHeight: 24 },
  bottomContainer: { flex: 1, paddingHorizontal: 32, paddingTop: 24, justifyContent: 'space-between', paddingBottom: 32 },
  dotsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  skipBtn: { alignItems: 'center', marginTop: 16 },
  skipText: { fontSize: 14, color: COLORS.gray, fontWeight: '500' },
});
