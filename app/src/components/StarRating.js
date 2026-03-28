import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

export const StarRating = ({ rating, size = 14, showNumber = true }) => (
  <View style={styles.row}>
    {[1, 2, 3, 4, 5].map(i => (
      <Ionicons
        key={i}
        name={
          i <= Math.floor(rating)
            ? 'star'
            : i - 0.5 <= rating
            ? 'star-half'
            : 'star-outline'
        }
        size={size}
        color={COLORS.accent}
      />
    ))}
    {showNumber && (
      <Text style={[styles.num, { fontSize: size }]}> {rating}</Text>
    )}
  </View>
);

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  num: { color: COLORS.gray, fontWeight: '600', marginLeft: 2 },
});
