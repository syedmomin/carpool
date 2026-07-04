import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, CURVE } from './theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  action?: { label: string; onPress: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = 'document-outline', title, subtitle, style, action }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconOuter}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon as any} size={36} color={COLORS.primary} />
        </View>
      </View>
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
  iconOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.primary + '08',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    ...CURVE,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 240,
  },
  actionBtnWrap: {
    marginTop: 24,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    ...CURVE,
  },
  actionBtn: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
