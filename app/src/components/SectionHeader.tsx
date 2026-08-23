import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SPACING } from './theme';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onSeeAll, subtitle, style }) => (
  <View style={[styles.row, style]}>
    <View style={styles.titleGroup}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {onSeeAll ? (
      <Pressable
        onPress={onSeeAll}
        style={({ pressed }) => [styles.seeAllBtn, pressed && { opacity: 0.65 }]}
      >
        <Text style={styles.seeAll}>See All</Text>
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  titleGroup: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, letterSpacing: -0.1 },
  subtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  seeAllBtn: { paddingVertical: 4, paddingHorizontal: 8 },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
});
