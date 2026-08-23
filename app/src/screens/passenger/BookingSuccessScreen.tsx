import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, PrimaryButton, GhostButton, AppBar, SectionHeader } from '../../components';
import { haptics } from '../../utils/haptics';

// Light decorative confetti dots scattered around the checkmark circle.
// Purely visual — positions/colors are fixed, no data dependency.
const CONFETTI = [
  { top: -6,  left: 14,  size: 10, color: '#f59e0b', shape: 'circle' },
  { top: 10,  left: -14, size: 8,  color: '#1a73e8', shape: 'square' },
  { top: -12, left: 96,  size: 8,  color: '#2e7d32', shape: 'circle' },
  { top: 30,  left: 132, size: 10, color: '#f59e0b', shape: 'square' },
  { top: 96,  left: -18, size: 10, color: '#2e7d32', shape: 'square' },
  { top: 112, left: 128, size: 8,  color: '#1a73e8', shape: 'circle' },
  { top: 140, left: 4,   size: 8,  color: '#f59e0b', shape: 'circle' },
  { top: 138, left: 108, size: 10, color: '#2e7d32', shape: 'circle' },
];

export default function BookingSuccessScreen({ navigation, route }) {
  useEffect(() => {
    haptics.success();
  }, []);

  const { seats, rideData, boardingCity, exitCity } = route.params;
  const ride = rideData || null;

  const fromLabel = boardingCity ?? ride?.from ?? '-';
  const toLabel = exitCity ?? ride?.to ?? '-';
  const dateLabel = ride?.date ?? 'N/A';
  const timeLabel = ride?.departureTime ?? '';
  const totalFare = ride?.pricePerSeat != null ? (seats * ride.pricePerSeat) : null;

  const DETAIL_ROWS = [
    { label: 'Route', value: `${fromLabel} → ${toLabel}`, icon: 'navigate-outline' },
    { label: 'Date & Time', value: timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel, icon: 'calendar-outline' },
    { label: 'Trip', value: `One Way • ${seats} Seat${seats !== 1 ? 's' : ''}`, icon: 'people-outline' },
    {
      label: 'Total Fare',
      value: totalFare != null ? `Rs ${totalFare.toLocaleString()}` : 'N/A',
      icon: 'wallet-outline',
      highlight: true,
    },
    { label: 'Payment Method', value: 'Cash', icon: 'cash-outline' },
  ];

  return (
    <View style={styles.container}>
      <AppBar
        title="Booking Confirmed"
        onBack={() => navigation.navigate('PassengerApp', { screen: 'PassengerHomeTab' })}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Checkmark hero with confetti */}
        <View style={styles.heroWrap}>
          <View style={styles.confettiLayer}>
            {CONFETTI.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.confettiDot,
                  {
                    top: c.top, left: c.left,
                    width: c.size, height: c.size,
                    backgroundColor: c.color,
                    borderRadius: c.shape === 'circle' ? c.size / 2 : 3,
                    transform: [{ rotate: `${(i * 37) % 360}deg` }],
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.checkOuter}>
            <View style={styles.checkInner}>
              <Ionicons name="checkmark" size={54} color="#fff" />
            </View>
          </View>
        </View>

        <Text style={styles.title}>Booking Confirmed!</Text>
        <Text style={styles.subtitle}>Your ride has been booked successfully.</Text>

        {/* Booking Details card */}
        <View style={[styles.detailsCard, CURVE]}>
          <SectionHeader title="Booking Details" style={styles.detailsHeader} />
          {DETAIL_ROWS.map((item, i) => (
            <View key={i} style={[styles.infoRow, i === DETAIL_ROWS.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.infoLeft}>
                <Ionicons name={item.icon as any} size={16} color={COLORS.gray} />
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
              <Text
                style={[styles.infoValue, item.highlight ? styles.infoValueHighlight : null]}
                numberOfLines={1}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <PrimaryButton
          title="View Booking"
          icon="receipt-outline"
          onPress={() => navigation.navigate('PassengerApp', { screen: 'BookingHistoryTab', params: { screen: 'BookingHistoryMain' } })}
          style={{ marginBottom: 12 }}
        />

        <GhostButton
          title="Back to Home"
          onPress={() => navigation.navigate('PassengerApp', { screen: 'PassengerHomeTab' })}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: 'center',
  },

  /* Hero */
  heroWrap: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  confettiLayer: {
    position: 'absolute',
    width: 140,
    height: 140,
  },
  confettiDot: {
    position: 'absolute',
  },
  checkOuter: {
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },

  /* Details card */
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
    marginBottom: 24,
  },
  detailsHeader: {
    marginTop: 0,
    marginBottom: 12,
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '700',
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
});
