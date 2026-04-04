import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { COLORS, SPACING } from './theme';

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  style?: StyleProp<ViewStyle>;
}
export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, onSeeAll, style }) => (
  <View style={[styles.row, style]}>
    <Text style={styles.title}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAll}>See All</Text>
      </TouchableOpacity>
    )}
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
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
});
