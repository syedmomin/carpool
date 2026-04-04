import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, SPACING } from './theme';
import { NotifBadge } from './Badge';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

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
export const GradientHeader = ({
  title,
  subtitle,
  colors,
  onBack,
  rightIcon,
  onRightPress,
  notifCount,
  onNotif,
  children,
  style,
}) => (
  <LinearGradient
    colors={colors || GRADIENTS.primary}
    style={[styles.header, style]}
  >
    {/* Decorative circles */}
    <View style={styles.circle1} />
    <View style={styles.circle2} />

    {/* Top row: back + title area + right action */}
    <View style={styles.topRow}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
      ) : (
        <View style={styles.backPlaceholder} />
      )}

      <View style={styles.titleArea}>
        {title && <Text style={styles.title}>{title}</Text>}
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
            <Ionicons name={rightIcon} size={22} color={COLORS.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>

    {children}
  </LinearGradient>
);

// ─── Simple Back Header (non-gradient) ───────────────────────────────────────
export const BackHeader = ({ title, onBack, style }) => (
  <View style={[styles.simpleHeader, style]}>
    <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.8}>
      <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
    </TouchableOpacity>
    <Text style={styles.simpleTitle}>{title}</Text>
    <View style={styles.backPlaceholder} />
  </View>
);

const styles = StyleSheet.create({
  header: {
    paddingTop: STATUS_BAR_HEIGHT + 16,
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

  simpleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: STATUS_BAR_HEIGHT + 12,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  simpleTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, textAlign: 'center' },
});
