import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from './theme';

// ─── Progress Bar ─────────────────────────────────────────────────────────────
// Props:
//   value   - 0 to 1
//   color   - fill color (default: primary)
//   height  - bar height (default: 6)
//   label   - optional label on left
//   caption - optional text on right (e.g. "3/5 seats")
export const ProgressBar = ({ value = 0, color, height = 6, label, caption, style }) => {
  const pct = Math.min(Math.max(value, 0), 1);
  return (
    <View style={[styles.wrapper, style]}>
      {(label || caption) && (
        <View style={styles.labelRow}>
          {label && <Text style={styles.label}>{label}</Text>}
          {caption && <Text style={styles.caption}>{caption}</Text>}
        </View>
      )}
      <View style={[styles.track, { height }]}>
        <View
          style={[
            styles.fill,
            { width: `${pct * 100}%`, backgroundColor: color || COLORS.primary, height },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { width: '100%' },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  label: { fontSize: 12, color: COLORS.gray },
  caption: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  track: { backgroundColor: COLORS.border, borderRadius: RADIUS.full, overflow: 'hidden' },
  fill: { borderRadius: RADIUS.full },
});
