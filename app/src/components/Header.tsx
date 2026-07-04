import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE } from './theme';
import { NotifBadge } from './Badge';
import { haptics } from '../utils/haptics';

interface GradientHeaderProps {
  title?: string;
  subtitle?: string;
  colors?: readonly [string, string, ...string[]];
  onBack?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  notifCount?: number;
  onNotif?: () => void;
  children?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  showBack?: boolean;
}

export const GradientHeader: React.FC<GradientHeaderProps> = ({
  title,
  subtitle,
  colors,
  onBack,
  rightIcon,
  onRightPress,
  notifCount,
  onNotif,
  children,
  rightAction,
  style,
  compact,
  showBack,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const canBack = typeof navigation?.canGoBack === 'function' ? navigation.canGoBack() : false;
  const handleBack = onBack || (canBack ? () => navigation.goBack() : undefined);
  const showBackBtn = showBack !== false && !!handleBack;
  const onBackPress = () => { haptics.impact(); handleBack?.(); };

  return (
    <LinearGradient
      colors={(colors || GRADIENTS.primary) as any}
      style={[styles.header, { paddingTop: insets.top + 16 }, compact && styles.headerCompact, style]}
    >
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.topRow}>
        {showBackBtn ? (
          <Pressable
            onPress={onBackPress}
            style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.75 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </Pressable>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        <View style={styles.titleArea}>
          {title ? <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text> : null}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        <View style={styles.rightArea}>
          {onNotif ? (
            <Pressable
              onPress={onNotif}
              style={({ pressed }) => [styles.rightBtnSmall, pressed && { opacity: 0.75 }]}
            >
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <NotifBadge count={notifCount} />
            </Pressable>
          ) : null}
          {rightIcon && onRightPress ? (
            <Pressable
              onPress={onRightPress}
              style={({ pressed }) => [styles.rightBtn, pressed && { opacity: 0.85 }]}
            >
              <Ionicons name={rightIcon as any} size={22} color={COLORS.primary} />
            </Pressable>
          ) : null}
          {rightAction}
        </View>
      </View>

      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingBottom: 24,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.04)',
    bottom: -30,
    left: -20,
  },
  topRow: { flexDirection: 'row', alignItems: 'center' },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    ...CURVE,
  },
  backPlaceholder: { width: 38 },
  titleArea: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  titleCompact: { fontSize: 17 },
  headerCompact: { paddingBottom: 14 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.82)', marginTop: 2 },
  rightArea: { flexDirection: 'row', alignItems: 'center' },
  rightBtn: {
    marginLeft: 12,
    backgroundColor: '#fff',
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    ...CURVE,
  },
  rightBtnSmall: { marginLeft: 8, position: 'relative' },
});
