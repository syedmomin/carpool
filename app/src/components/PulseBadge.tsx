import React, { useEffect } from 'react';
import { Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation,
} from 'react-native-reanimated';
import { COLORS } from './theme';

/**
 * Unread count badge that gently pulses while there are unread items, so it
 * catches the eye on the header bell. Renders nothing when count is 0.
 */
export const PulseBadge: React.FC<{ count: number; style?: StyleProp<ViewStyle> }> = ({ count, style }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (count > 0) {
      scale.value = withRepeat(
        withSequence(withTiming(1.22, { duration: 650 }), withTiming(1, { duration: 650 })),
        -1,
        false,
      );
    } else {
      cancelAnimation(scale);
      scale.value = 1;
    }
    return () => cancelAnimation(scale);
  }, [count]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (!count || count <= 0) return null;

  return (
    <Animated.View style={[styles.badge, animStyle, style]}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  badge: {
    position: 'absolute', top: -5, right: -5,
    backgroundColor: COLORS.danger, borderRadius: 11, minWidth: 22, height: 22,
    paddingHorizontal: 5, justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 3,
  },
  text: { color: '#fff', fontSize: 11, fontWeight: '800' },
});
