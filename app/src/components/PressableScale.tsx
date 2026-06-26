import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, FadeInDown,
} from 'react-native-reanimated';
import { haptics } from '../utils/haptics';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface Props {
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far to scale down on press (default 0.97). */
  scaleTo?: number;
  /** Light haptic tap on press (default true). */
  haptic?: boolean;
  disabled?: boolean;
  /** Mount entrance animation — pass the list index for a staggered fade-in. */
  index?: number;
}

/**
 * Pressable with a subtle scale-down + haptic on press, and an optional
 * staggered fade-in entrance. Drop-in replacement for TouchableOpacity on cards.
 */
export const PressableScale: React.FC<Props> = ({
  onPress, onLongPress, children, style, scaleTo = 0.97, haptic = true, disabled, index,
}) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withTiming(scaleTo, { duration: 90 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 130 }); }}
      onPress={() => { if (haptic) haptics.impact(); onPress?.(); }}
      onLongPress={onLongPress}
      disabled={disabled}
      entering={index !== undefined ? FadeInDown.duration(260).delay(Math.min(index, 8) * 45) : undefined}
      style={[style, animStyle]}
    >
      {children}
    </AnimatedPressable>
  );
};
