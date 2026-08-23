import React from 'react';
import { View, Text, Pressable, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, CURVE, GRADIENTS } from './theme';

// ─── Filter Chip (toggle) ────────────────────────────────────────────────────
interface ChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
  onPress: () => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}
export const Chip: React.FC<ChipProps> = ({ label, icon, active, onPress, color, style }) => {
  const isActive = !!active;
  const activeColor = color || COLORS.primary;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        isActive
          ? { backgroundColor: activeColor, borderColor: activeColor }
          : { backgroundColor: COLORS.white, borderColor: COLORS.border },
        pressed && { opacity: 0.8 },
        style,
      ]}
    >
      {icon ? (
        <Ionicons name={icon as any}
          size={14}
          color={isActive ? '#fff' : COLORS.gray}
          style={styles.chipIcon}
        />
      ) : null}
      <Text style={[styles.chipText, { color: isActive ? '#fff' : COLORS.gray }]}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─── Chip Group (horizontal scrollable row helper) ───────────────────────────
interface ChipItem {
  label: string;
  value?: any;
  icon?: keyof typeof Ionicons.glyphMap;
}
interface ChipGroupProps {
  chips: ChipItem[];
  activeValue: any;
  onSelect: (value: any) => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}
export const ChipGroup: React.FC<ChipGroupProps> = ({ chips, activeValue, onSelect, color, style }) => (
  <View style={[styles.group, style]}>
    {chips.map(chip => (
      <Chip
        key={chip.value ?? chip.label}
        label={chip.label}
        icon={chip.icon}
        active={activeValue === (chip.value ?? chip.label)}
        onPress={() => onSelect(chip.value ?? chip.label)}
        color={color}
        style={styles.groupChip}
      />
    ))}
  </View>
);

// ─── Tab Pills ───────────────────────────────────────────────────────────────
interface TabItem {
  label: string;
  value: any;
}
interface TabPillsProps {
  tabs: TabItem[];
  activeTab: any;
  onSelect: (value: any) => void;
  color?: string;
  style?: StyleProp<ViewStyle>;
}
export const TabPills: React.FC<TabPillsProps> = ({ tabs, activeTab, onSelect, color, style }) => (
  <View style={[styles.tabRow, style]}>
    {tabs.map(tab => {
      const isActive = activeTab === tab.value;
      const activeColors = color ? [color, color] : GRADIENTS.primary;
      return (
        <Pressable
          key={tab.value}
          onPress={() => onSelect(tab.value)}
          style={styles.tabPillWrap}
        >
          {isActive ? (
            <LinearGradient
              colors={activeColors as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tabPill}
            >
              <Text style={[styles.tabText, styles.tabTextActive]}>{tab.label}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.tabPill}>
              <Text style={styles.tabText}>{tab.label}</Text>
            </View>
          )}
        </Pressable>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm - 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...CURVE,
  },
  chipIcon: { marginRight: 4 },
  chipText: { fontSize: 13, fontWeight: '600' },
  group: { flexDirection: 'row', flexWrap: 'wrap' },
  groupChip: { marginRight: 8, marginBottom: 8 },

  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.lightGray,
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
    ...CURVE,
  },
  tabPillWrap: { flex: 1 },
  tabPill: {
    paddingVertical: 9,
    borderRadius: RADIUS.md - 2,
    alignItems: 'center',
    ...CURVE,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: '#fff', fontWeight: '700' },
});
