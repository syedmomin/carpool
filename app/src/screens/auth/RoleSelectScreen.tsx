import React from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthBackground, Logo, COLORS, GRADIENTS, FONTS } from '../../components';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(120, Math.min(W * 0.34, 150));
// Illustration is full-bleed (edge-to-edge, fixed to the screen bottom) —
// reserve exactly its rendered height in the content padding so it never
// covers the footer sign-in link.
const ILLUSTRATION_H = W / (1737 / 906);

type Role = 'passenger' | 'driver';

const ROLES: { value: Role; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string; gradient: string[] }[] = [
  { value: 'passenger', icon: 'people', title: 'Passenger', sub: 'Find affordable rides near you', gradient: GRADIENTS.primary as any },
  { value: 'driver', icon: 'car-sport', title: 'Driver', sub: 'Offer rides & earn on your route', gradient: GRADIENTS.primary as any },
];

function RoleCard({
  role, onPress,
}: { role: typeof ROLES[number]; onPress: () => void }) {
  const scale = useSharedValue(1);
  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 14 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      style={styles.cardPress}
    >
      <Animated.View style={[styles.card, cardStyle]}>
        <View style={[styles.cardAccent, { backgroundColor: role.gradient[0] }]} />
        <LinearGradient colors={role.gradient as any} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardIcon}>
          <Ionicons name={role.icon} size={26} color="#fff" />
        </LinearGradient>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{role.title}</Text>
          <Text style={styles.cardSub}>{role.sub}</Text>
        </View>
        <View style={styles.chevronBox}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
        </View>
      </Animated.View>
    </Pressable>
  );
}

export default function RoleSelectScreen({ navigation }: any) {
  return (
    <AuthBackground variant="light">
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <Logo variant="auth" size={LOGO_SIZE} />
            <Text style={styles.tagline}>Har Safar Mein Sath</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(150).duration(600)}>
            <Text style={styles.heading}>How do you want to ride?</Text>
            <Text style={styles.subheading}>Choose your role to get started</Text>
          </Animated.View>

          <View style={styles.cards}>
            {ROLES.map((r, i) => (
              <Animated.View key={r.value} entering={FadeInDown.delay(280 + i * 120).duration(600)}>
                <RoleCard
                  role={r}
                  onPress={() => navigation.navigate('Register', { intendedRole: r.value })}
                />
              </Animated.View>
            ))}
          </View>

          <View style={styles.footer}>
            <Pressable style={styles.signinRow} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.signinMuted}>Already have an account? </Text>
              <Text style={styles.signinLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>

      <Animated.View entering={FadeInDown.delay(480).duration(600)} style={styles.illustrationFixed} pointerEvents="none">
        <Image
          source={require('../../assets/illustrations/carpool-hero.png')}
          style={styles.illustrationImg}
          resizeMode="cover"
        />
      </Animated.View>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingBottom: ILLUSTRATION_H + 16, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 20 },
  tagline: {
    color: COLORS.primary, fontSize: 13, fontFamily: FONTS.bold, letterSpacing: 0.3, marginTop: 6,
  },
  heading: {
    color: COLORS.textPrimary, fontSize: 24, fontFamily: FONTS.extraBold, letterSpacing: -0.2, textAlign: 'center', marginTop: 10,
  },
  subheading: {
    color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium, textAlign: 'center', marginTop: 2,
  },
  cards: { marginTop: 28, gap: 14 },
  cardPress: { width: '100%' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    paddingLeft: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
  },
  cardIcon: {
    width: 52, height: 52, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1, marginLeft: 14 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 17, fontFamily: FONTS.bold, letterSpacing: -0.2 },
  cardSub: { color: COLORS.gray, fontSize: 12.5, fontFamily: FONTS.medium, marginTop: 2 },
  chevronBox: { marginLeft: 4 },
  footer: { marginTop: 24, alignItems: 'center' },
  signinRow: { flexDirection: 'row', paddingVertical: 4 },
  signinMuted: { color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium },
  signinLink: { color: COLORS.primary, fontSize: 14, fontFamily: FONTS.extraBold },
  illustrationFixed: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    width: '100%', aspectRatio: 1737 / 906,
  },
  illustrationImg: { width: '100%', height: '100%' },
});
