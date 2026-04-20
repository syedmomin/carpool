import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TouchableOpacity } from 'react-native';
import { COLORS, SPACING } from './theme';
import {
  EmptyRidesIllustration,
  EmptyBookingsIllustration,
  EmptyNotificationsIllustration,
  EmptyGeneralIllustration,
  EmptyChatIllustration,
  EmptyReviewsIllustration,
} from './Illustrations';

const ILLUSTRATION_MAP: Record<string, any> = {
  'car-outline':                EmptyRidesIllustration,
  'car-sport-outline':          EmptyRidesIllustration,
  'calendar-outline':           EmptyRidesIllustration,
  'time-outline':               EmptyBookingsIllustration,
  'receipt-outline':            EmptyBookingsIllustration,
  'notifications-off-outline':  EmptyNotificationsIllustration,
  'notifications-outline':      EmptyNotificationsIllustration,
  'chatbubbles-outline':        EmptyChatIllustration,
  'star-outline':               EmptyReviewsIllustration,
  'wallet-outline':             EmptyGeneralIllustration,
  'search-outline':             EmptyRidesIllustration,
};

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  style?: StyleProp<ViewStyle>;
  action?: { label: string; onPress: () => void };
}
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, subtitle, style, action }) => {
  const IllustrationComponent = ILLUSTRATION_MAP[icon] || EmptyGeneralIllustration;

  return (
    <View style={[styles.container, style]}>
      <IllustrationComponent size={140} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {action && (
        <TouchableOpacity style={styles.actionBtn} onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  title:      { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: SPACING.lg },
  subtitle:   { fontSize: 14, color: COLORS.gray, marginTop: SPACING.sm, textAlign: 'center', paddingHorizontal: SPACING.xxxl },
  actionBtn:  { marginTop: 20, backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  actionText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
