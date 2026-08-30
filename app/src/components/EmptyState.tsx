import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, CURVE } from './theme';
import { EmptyIllustration } from './EmptyIllustration';

interface EmptyStateProps {
  /** @deprecated no longer rendered — every empty state now shares one illustration */
  icon?: string;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle, style, action }) => {
  return (
    <View style={[styles.container, style]}>
      <EmptyIllustration size={92} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {action ? (
        <Pressable
          style={({ pressed }) => [styles.actionBtnWrap, pressed && { opacity: 0.85 }]}
          onPress={action.onPress}
        >
          <LinearGradient colors={GRADIENTS.primary as any} style={styles.actionBtn}>
            <Text style={styles.actionText}>{action.label}</Text>
          </LinearGradient>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  title: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12.5,
    color: COLORS.gray,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 240,
  },
  actionBtnWrap: {
    marginTop: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    ...CURVE,
  },
  actionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
