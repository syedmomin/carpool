import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from './theme';
import { NotifBadge } from './Badge';
import { haptics } from '../utils/haptics';

// ─── Gradient Header ─────────────────────────────────────────────────────────
// Props:
//   title        - main heading
//   subtitle     - optional subtitle below title
//   colors       - gradient colors array (default: primary blue)
//   onBack       - shows back button if provided
//   rightIcon    - icon name for right button
//   onRightPress - handler for right button
//   notifCount   - shows notification badge if > 0
//   onNotif      - handler for notification icon
//   children     - extra content inside header (e.g. search box)
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
  /** Force-hide the back button even when the screen can go back. */
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
  // Auto-derive a back handler from navigation so no screen can "forget" it.
  // Always called (hook rules); headers always render inside a navigator.
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
    {/* Decorative circles */}
    <View style={styles.circle1} />
    <View style={styles.circle2} />

    {/* Top row: back + title area + right action */}
    <View style={styles.topRow}>
      {showBackBtn ? (
        <TouchableOpacity onPress={onBackPress} style={styles.backBtn} activeOpacity={0.8} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <View style={styles.titleArea}>
        {title && <Text style={[styles.title, compact && styles.titleCompact]}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightArea}>
        {onNotif && (
          <TouchableOpacity onPress={onNotif} style={styles.rightBtnSmall} activeOpacity={0.8}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
            <NotifBadge count={notifCount} />
          </TouchableOpacity>
        )}
        {rightIcon && onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.rightBtn} activeOpacity={0.8}>
            <Ionicons name={(rightIcon) as any} size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
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
    backgroundColor: 'rgba(255,255,255,0.07)',
    top: -60,
    right: -40,
  },
  circle2: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
  },
  backPlaceholder: { width: 38 },
  titleArea: { flex: 1, paddingHorizontal: 16 },
  title: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: 0.3 },
  titleCompact: { fontSize: 17 },
  headerCompact: { paddingBottom: 14 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
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
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  rightBtnSmall: { marginLeft: 8 },
});
