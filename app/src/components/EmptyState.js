import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from './theme';
import {
  EmptyRidesIllustration,
  EmptyBookingsIllustration,
  EmptyNotificationsIllustration,
  EmptyGeneralIllustration,
} from './Illustrations';

const ILLUSTRATION_MAP = {
  'car-outline':                EmptyRidesIllustration,
  'car-sport-outline':          EmptyRidesIllustration,
  'receipt-outline':            EmptyBookingsIllustration,
  'notifications-off-outline':  EmptyNotificationsIllustration,
};

export const EmptyState = ({ icon, title, subtitle, style }) => {
  const IllustrationComponent = ILLUSTRATION_MAP[icon] || EmptyGeneralIllustration;

  return (
    <View style={[styles.container, style]}>
      <IllustrationComponent size={140} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  title: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.lg },
  subtitle: { fontSize: 14, color: COLORS.gray, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xxxl },
});
