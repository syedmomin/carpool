import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, PrimaryButton, GhostButton } from '../../components';

export default function BookingConfirmScreen({ navigation, route }) {
  const { rideId, seats, rideData } = route.params;
  const ride   = rideData || null;
  const driver = ride?.driver;

  const TICKET_ROWS = [
    { label: 'Date',         value: ride?.date,                                              icon: 'calendar-outline' },
    { label: 'Seats',        value: `${seats} seat(s)`,                                     icon: 'people-outline' },
    { label: 'Driver',       value: driver?.name || 'N/A',                                  icon: 'person-outline' },
    { label: 'Vehicle',      value: ride?.vehicle ? `${ride.vehicle.brand} • ${ride.vehicle.plateNumber}` : 'N/A', icon: 'car-outline' },
    { label: 'Total Amount', value: `Rs ${(seats * ride?.pricePerSeat)?.toLocaleString()}`,  icon: 'wallet-outline', highlight: true },
    { label: 'Payment',      value: 'Cash on Board',                                        icon: 'cash-outline' },
  ];

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary as any}
        title="Booking Request Sent!"
        subtitle="Waiting for driver to accept your request"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.ticketCard}>
          {/* Ticket Header */}
          <View style={styles.ticketHeader}>
            <Ionicons name="ticket-outline" size={20} color={COLORS.primary} />
            <Text style={styles.ticketTitle}>Booking Request Ticket</Text>
            <Text style={styles.bookingId}>#BK{Date.now().toString().slice(-6)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Route */}
          <View style={styles.ticketRoute}>
            <View style={styles.routeLeft}>
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.routeLine} />
              <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
            </View>
            <View style={styles.routeInfo}>
              <View style={styles.routeRow}>
                <Text style={styles.ticketCity}>{ride?.from}</Text>
                <Text style={styles.ticketTime}>{ride?.departureTime}</Text>
              </View>
              <View style={styles.routeRow}>
                <Text style={styles.ticketCity}>{ride?.to}</Text>
                <Text style={styles.ticketTime}>{ride?.arrivalTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Info Rows */}
          {TICKET_ROWS.map((item, i) => (
            <View key={i} style={styles.ticketInfoRow}>
              <View style={styles.ticketInfoLeft}>
                <Ionicons name={(item.icon) as any} size={16} color={COLORS.gray} />
                <Text style={styles.ticketInfoLabel}>{item.label}</Text>
              </View>
              <Text style={[styles.ticketInfoValue, item.highlight && { color: COLORS.primary, fontWeight: '800', fontSize: 16 }]}>
                {item.value}
              </Text>
            </View>
          ))}

          {/* Barcode */}
          <View style={styles.divider} />
          <View style={styles.barcodeRow}>
            {Array(30).fill(0).map((_, i) => (
              <View key={i} style={[styles.barcodeLine, { height: i % 3 === 0 ? 32 : i % 2 === 0 ? 24 : 20 }]} />
            ))}
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>Your request has been sent to the driver. You will receive a notification once the driver accepts or rejects your booking.</Text>
        </View>

        <PrimaryButton
          title="View My Bookings"
          onPress={() => navigation.navigate('PassengerApp', { screen: 'BookingHistoryTab' })}
          icon="receipt-outline"
          style={{ marginBottom: 12 }}
        />
        <GhostButton
          title="Go to Home"
          onPress={() => navigation.navigate('PassengerApp', { screen: 'PassengerHomeTab' })}
        />
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20, marginTop: -20 },
  ticketCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: 16 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  ticketTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  bookingId: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  ticketRoute: { flexDirection: 'row', alignItems: 'stretch' },
  routeLeft: { alignItems: 'center', marginRight: 12, paddingVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  routeLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 3 },
  routeInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between' },
  ticketCity: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  ticketTime: { fontSize: 13, color: COLORS.gray },
  ticketInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  ticketInfoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketInfoLabel: { fontSize: 13, color: COLORS.gray },
  ticketInfoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  barcodeRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 2, paddingTop: 4 },
  barcodeLine: { width: 3, backgroundColor: COLORS.textPrimary, borderRadius: 1 },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
  infoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 20 },
});
