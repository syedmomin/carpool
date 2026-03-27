import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING } from './theme';

export const EmptyState = ({ icon, title, subtitle, style }) => (
  <View style={[styles.container, style]}>
    <Ionicons name={icon} size={64} color={COLORS.border} />
    <Text style={styles.title}>{title}</Text>
    {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.lg },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xxxl },
});
