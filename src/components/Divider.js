import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from './theme';

// ─── Simple Divider ───────────────────────────────────────────────────────────
export const Divider = ({ style }) => <View style={[styles.line, style]} />;

// ─── Divider with Text (e.g. "OR") ───────────────────────────────────────────
export const DividerText = ({ label = 'OR', style }) => (
  <View style={[styles.row, style]}>
    <View style={styles.half} />
    <Text style={styles.label}>{label}</Text>
    <View style={styles.half} />
  </View>
);

const styles = StyleSheet.create({
  line: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  row: { flexDirection: 'row', alignItems: 'center', marginVertical: SPACING.md },
  half: { flex: 1, height: 1, backgroundColor: COLORS.border },
  label: { fontSize: 13, color: COLORS.gray, paddingHorizontal: SPACING.md, fontWeight: '500' },
});
