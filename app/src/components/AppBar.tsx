import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE } from './theme';
import { NotifBadge } from './Badge';
import { haptics } from '../utils/haptics';

// ─── AppBar ──────────────────────────────────────────────────────────────────
// Light, flat app bar per the ChalParo v2 design system (§7 App Bar):
// [Back]  [Title]  [Action] on a white/transparent bar, no gradients.
// Use this for all screens except the auth/navy hero and Help & Support.
interface AppBarProps {
  title?: string;
  onBack?: () => void;
  showBack?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  notifCount?: number;
  onNotif?: () => void;
  rightAction?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  transparent?: boolean;
}

export const AppBar: React.FC<AppBarProps> = ({
  title,
  onBack,
  showBack,
  rightIcon,
  onRightPress,
  notifCount,
  onNotif,
  rightAction,
  style,
  transparent,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const canBack = typeof navigation?.canGoBack === 'function' ? navigation.canGoBack() : false;
  const handleBack = onBack || (canBack ? () => navigation.goBack() : undefined);
  const showBackBtn = showBack !== false && !!handleBack;
  const onBackPress = () => { haptics.impact(); handleBack?.(); };

  return (
    <View
      style={[
        styles.bar,
        { paddingTop: insets.top + 10 },
        transparent && styles.transparent,
        style,
      ]}
    >
      {showBackBtn ? (
        <Pressable
          onPress={onBackPress}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </Pressable>
      ) : (
        <View style={styles.iconBtnPlaceholder} />
      )}

      <Text style={styles.title} numberOfLines={1}>{title}</Text>

      <View style={styles.rightArea}>
        {onNotif && (
          <Pressable
            onPress={onNotif}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}
          >
            <Ionicons name="notifications-outline" size={20} color={COLORS.textPrimary} />
            <NotifBadge count={notifCount} />
          </Pressable>
        )}
        {rightIcon && onRightPress && (
          <Pressable
            onPress={onRightPress}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed, onNotif && { marginLeft: 8 }]}
          >
            <Ionicons name={rightIcon} size={20} color={COLORS.textPrimary} />
          </Pressable>
        )}
        {rightAction}
        {!onNotif && !(rightIcon && onRightPress) && !rightAction && (
          <View style={styles.iconBtnPlaceholder} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bg,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  // Every header action — back, notification bell, custom right icon — uses
  // this same visible chip so it reads as a button (not bare text/icon) and
  // stays visually consistent across every screen, driver or passenger.
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.lightGray,
    ...CURVE,
  },
  iconBtnPressed: {
    backgroundColor: COLORS.border,
  },
  iconBtnPlaceholder: {
    width: 38,
    height: 38,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  rightArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 38,
  },
});
