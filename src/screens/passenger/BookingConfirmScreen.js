import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton, GhostButton } from '../../components';
import { useApp } from '../../context/AppContext';

export default function BookingConfirmScreen({ navigation, route }) {
  const { rideId, seats } = route.params;
  const { getRideById, getDriverById } = useApp();
  const ride = getRideById(rideId);
  const driver = getDriverById(ride?.driverId);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={70} color="#fff" />
        </View>
        <Text style={styles.successTitle}>Booking Confirm!</Text>
        <Text style={styles.successSub}>Aapki seat book ho gayi hai</Text>
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <Ionicons name="ticket-outline" size={20} color={COLORS.primary} />
            <Text style={styles.ticketTitle}>Booking Ticket</Text>
            <Text style={styles.bookingId}>#BK{Date.now().toString().slice(-6)}</Text>
          </View>

          <View style={styles.ticketDivider} />

          <View style={styles.ticketRow}>
            <View style={styles.ticketRouteLeft}>
              <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.ticketRouteLine} />
              <View style={[styles.dot, { backgroundColor: COLORS.secondary }]} />
            </View>
            <View style={styles.ticketRouteInfo}>
              <View style={styles.ticketRouteRow}>
                <Text style={styles.ticketCity}>{ride?.from}</Text>
                <Text style={styles.ticketTime}>{ride?.departureTime}</Text>
              </View>
              <View style={styles.ticketRouteRow}>
                <Text style={styles.ticketCity}>{ride?.to}</Text>
                <Text style={styles.ticketTime}>{ride?.arrivalTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.ticketDivider} />

          {[
            { label: 'Date', value: ride?.date, icon: 'calendar-outline' },
            { label: 'Seats', value: `${seats} seat(s)`, icon: 'people-outline' },
            { label: 'Driver', value: driver?.name, icon: 'person-outline' },
            { label: 'Total Amount', value: `Rs ${(seats * ride?.pricePerSeat)?.toLocaleString()}`, icon: 'wallet-outline' },
            { label: 'Payment', value: 'Cash on Board', icon: 'cash-outline' },
          ].map((item, i) => (
            <View key={i} style={styles.ticketInfoRow}>
              <View style={styles.ticketInfoLeft}>
                <Ionicons name={item.icon} size={16} color={COLORS.gray} />
                <Text style={styles.ticketInfoLabel}>{item.label}</Text>
              </View>
              <Text style={[styles.ticketInfoValue, i === 3 && { color: COLORS.primary, fontWeight: '800' }]}>
                {item.value}
              </Text>
            </View>
          ))}

          {/* Barcode Placeholder */}
          <View style={styles.ticketDivider} />
          <View style={styles.barcodeRow}>
            {Array(30).fill(0).map((_, i) => (
              <View key={i} style={[styles.barcodeLine, { height: i % 3 === 0 ? 32 : i % 2 === 0 ? 24 : 20 }]} />
            ))}
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.infoText}>Driver aapko departure se 1 ghante pehle call karega. Pickup point par time par pahunchein.</Text>
        </View>

        <PrimaryButton
          title="My Bookings Dekho"
          onPress={() => navigation.navigate('BookingHistory')}
          icon="receipt-outline"
          style={{ marginBottom: 12 }}
        />
        <GhostButton
          title="Home Ja'o"
          onPress={() => navigation.navigate('PassengerHome')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  successIcon: { marginBottom: 12 },
  successTitle: { fontSize: 26, fontWeight: '900', color: '#fff' },
  successSub: { fontSize: 15, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  body: { flex: 1, padding: 20, marginTop: -20 },
  ticketCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5, marginBottom: 16 },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  ticketTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, flex: 1 },
  bookingId: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  ticketDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  ticketRow: { flexDirection: 'row', alignItems: 'stretch' },
  ticketRouteLeft: { alignItems: 'center', marginRight: 12, paddingVertical: 2 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  ticketRouteLine: { width: 2, flex: 1, backgroundColor: COLORS.border, marginVertical: 3 },
  ticketRouteInfo: { flex: 1, justifyContent: 'space-between', paddingVertical: 2 },
  ticketRouteRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
