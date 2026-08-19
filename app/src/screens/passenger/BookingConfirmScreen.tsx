import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE, GhostButton, GradientHeader } from '../../components';
import { haptics } from '../../utils/haptics';

export default function BookingConfirmScreen({ navigation, route }) {
  useEffect(() => {
    haptics.success();
  }, []);

  const { rideId, seats, rideData, booking, boardingCity, exitCity } = route.params;
  const ride   = rideData || null;
  const driver = ride?.driver;

  // Real booking id from the server-created row — never fabricate one.
  const bookingId = booking?.id ? `#${booking.id}` : '—';

  const TICKET_ROWS = [
    { label: 'Date',         value: ride?.date ?? 'N/A',                                                           icon: 'calendar-outline' },
    { label: 'Seats',        value: `${seats} seat(s)`,                                                            icon: 'people-outline' },
    { label: 'Driver',       value: driver?.name ?? 'N/A',                                                         icon: 'person-outline' },
    { label: 'Vehicle',      value: ride?.vehicle ? `${ride.vehicle.brand} • ${ride.vehicle.plateNumber}` : 'N/A', icon: 'car-outline' },
    { label: 'Total Amount', value: `Rs ${(seats * ride?.pricePerSeat)?.toLocaleString()}`,                         icon: 'wallet-outline', highlight: true },
    { label: 'Payment',      value: 'Cash on Board',                                                               icon: 'cash-outline' },
  ];

  return (
    <View style={styles.container}>
      <GradientHeader
        title="Booking Sent!"
        subtitle="Driver will confirm your request soon"
        onBack={() => navigation.navigate('PassengerApp', { screen: 'PassengerHomeTab' })}
      />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Floating ticket card */}
        <View style={[styles.ticketCard, CURVE]}>
          {/* Route block */}
          <View style={styles.routeBlock}>
            <View style={styles.routeLeft}>
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.routeLine} />
              <View style={[styles.dot, { backgroundColor: '#22c55e' }]} />
            </View>
            <View style={styles.routeInfo}>
              <View style={styles.routeRow}>
                <Text style={styles.cityName}>{boardingCity ?? ride?.from ?? '-'}</Text>
                <Text style={styles.timeLabel}>{ride?.departureTime ?? ''}</Text>
              </View>
              <View style={styles.routeSpacer} />
              <View style={styles.routeRow}>
                <Text style={styles.cityName}>{exitCity ?? ride?.to ?? '-'}</Text>
                <Text style={styles.timeLabel}>{ride?.arrivalTime ?? ''}</Text>
              </View>
            </View>
            {ride?.date ? (
              <View style={styles.datePill}>
                <Text style={styles.datePillText}>{ride.date}</Text>
              </View>
            ) : null}
          </View>

          {/* Dashed tear-line */}
          <View style={styles.dashedDivider} />

          {/* Info rows */}
          {TICKET_ROWS.map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <View style={styles.infoLeft}>
                <Ionicons name={item.icon as any} size={16} color={COLORS.gray} />
                <Text style={styles.infoLabel}>{item.label}</Text>
              </View>
              <Text style={[styles.infoValue, item.highlight ? styles.infoValueHighlight : null]}>
                {item.value}
              </Text>
            </View>
          ))}

          {/* Barcode section */}
          <View style={styles.dashedDivider} />
          <View style={styles.barcodeRow}>
            {Array(30).fill(0).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.barcodeLine,
                  { height: i % 3 === 0 ? 28 : i % 2 === 0 ? 20 : 16 },
                ]}
              />
            ))}
          </View>
          <Text style={styles.bookingId}>{bookingId}</Text>
        </View>

        {/* Info notice */}
        <View style={[styles.noticeBox, CURVE]}>
          <Ionicons name={'information-circle' as any} size={18} color="#d97706" style={{ marginTop: 1 }} />
          <Text style={styles.noticeText}>
            Driver will confirm within a few hours. You'll get notified when they respond.
          </Text>
        </View>

        {/* Primary gradient button */}
        <LinearGradient
          colors={GRADIENTS.primary as any}
          style={[styles.primaryBtn, CURVE]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name={'receipt-outline' as any} size={20} color="#fff" />
          <Text
            style={styles.primaryBtnText}
            onPress={() => navigation.navigate('PassengerApp', { screen: 'BookingHistoryTab' })}
          >
            View My Bookings
          </Text>
        </LinearGradient>

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
    backgroundColor: '#f5f7fa',
  },

  /* Scroll body */
  body: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 12,
  },

  /* Ticket card */
  ticketCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
    marginBottom: 16,
  },

  /* Route block */
  routeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 14,
  },
  routeLeft: {
    alignItems: 'center',
    width: 16,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 32,
    backgroundColor: '#e2e8f0',
    marginVertical: 4,
  },
  routeInfo: {
    flex: 1,
  },
  routeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routeSpacer: {
    height: 20,
  },
  cityName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  timeLabel: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: '500',
  },
  datePill: {
    backgroundColor: COLORS.primary + '12',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'center',
  },
  datePillText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },

  /* Dashed divider */
  dashedDivider: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
  },

  /* Info rows */
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    fontWeight: '600',
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoValueHighlight: {
    color: COLORS.primary,
    fontWeight: '800',
    fontSize: 16,
  },

  /* Barcode */
  barcodeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    gap: 3,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  barcodeLine: {
    width: 3,
    backgroundColor: '#cbd5e1',
    borderRadius: 1.5,
  },
  bookingId: {
    textAlign: 'center',
    fontSize: 13,
    letterSpacing: 2,
    color: COLORS.gray,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    paddingBottom: 16,
    paddingTop: 8,
  },

  /* Notice box */
  noticeBox: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#92400e',
    lineHeight: 19,
  },

  /* Primary button */
  primaryBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.2,
  },
});
