import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS } from './theme';
import { EmptyIllustration } from './EmptyIllustration';
import { PrimaryButton } from './Button';

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
        <PrimaryButton title={action.label} onPress={action.onPress} style={styles.actionBtnWrap} />
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
  actionBtnWrap: { marginTop: 20 },
});
