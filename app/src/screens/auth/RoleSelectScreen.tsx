import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withTiming, withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { AuthBackground, Logo, COLORS, FONTS, HEADING_FONTS } from '../../components';

const { width: W } = Dimensions.get('window');
// Match the splash screen logo sizing exactly.
const LOGO_SIZE = Math.max(160, Math.min(W * 0.44, 200));

type Role = 'passenger' | 'driver';

const ROLES: { value: Role; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }[] = [
  { value: 'passenger', icon: 'people', title: 'Passenger', sub: 'Find affordable rides near you' },
  { value: 'driver', icon: 'car-sport', title: 'Driver', sub: 'Offer rides & earn on your route' },
];

function RoleCard({
  role, selected, onPress,
}: { role: typeof ROLES[number]; selected: boolean; onPress: () => void }) {
  const s = useSharedValue(0);
  React.useEffect(() => { s.value = withTiming(selected ? 1 : 0, { duration: 220 }); }, [selected]);

  const cardStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(s.value, [0, 1], [COLORS.border, COLORS.primary]),
    backgroundColor: interpolateColor(s.value, [0, 1], [COLORS.cardBg, COLORS.primaryLight]),
    transform: [{ scale: withSpring(selected ? 1.03 : 1, { damping: 14 }) }],
    shadowOpacity: 0.04 + s.value * 0.1,
  }));
  const iconStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(s.value, [0, 1], [COLORS.lightGray, COLORS.primary]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: s.value,
    transform: [{ scale: withSpring(selected ? 1 : 0.4, { damping: 12 }) }],
  }));

  return (
    <Pressable onPress={onPress} style={styles.cardPress}>
      <Animated.View style={[styles.card, cardStyle]}>
        <Animated.View style={[styles.cardIcon, iconStyle]}>
          <Ionicons name={role.icon} size={28} color={selected ? '#fff' : COLORS.gray} />
        </Animated.View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{role.title}</Text>
          <Text style={styles.cardSub}>{role.sub}</Text>
        </View>
        <Animated.View style={[styles.check, checkStyle]}>
          <Ionicons name="checkmark-circle" size={26} color={COLORS.primary} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

export default function RoleSelectScreen({ navigation }: any) {
  const [role, setRole] = useState<Role | null>(null);

  return (
    <AuthBackground variant="light">
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
            <Logo variant="auth" size={LOGO_SIZE} />
            <Text style={styles.tagline}>Saath Chalein, Saath Bachaein</Text>
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
                  selected={role === r.value}
                  onPress={() => {
                    setRole(r.value);
                    navigation.navigate('Register', { intendedRole: r.value });
                  }}
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
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 36 },
  tagline: {
    color: COLORS.primary, fontSize: 13, fontFamily: HEADING_FONTS.bold, letterSpacing: 0.3, marginTop: 10,
  },
  heading: {
    color: COLORS.textPrimary, fontSize: 24, fontFamily: HEADING_FONTS.extraBold, letterSpacing: -0.2, textAlign: 'center', marginTop: 18,
  },
  subheading: {
    color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium, textAlign: 'center', marginTop: 6,
  },
  cards: { marginTop: 32, gap: 16 },
  cardPress: { width: '100%' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
  },
  cardIcon: {
    width: 56, height: 56, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardText: { flex: 1, marginLeft: 16 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 19, fontFamily: HEADING_FONTS.bold, letterSpacing: -0.2 },
  cardSub: { color: COLORS.gray, fontSize: 13, fontFamily: FONTS.medium, marginTop: 3 },
  check: { marginLeft: 8 },
  footer: { marginTop: 36, alignItems: 'center' },
  signinRow: { flexDirection: 'row', paddingVertical: 4 },
  signinMuted: { color: COLORS.gray, fontSize: 14, fontFamily: FONTS.medium },
  signinLink: { color: COLORS.primary, fontSize: 14, fontFamily: FONTS.extraBold },
});
