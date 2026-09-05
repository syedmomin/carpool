import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, GRADIENTS, CURVE, PrimaryButton, GhostButton, SectionHeader, RouteTag } from '../../components';
import { haptics } from '../../utils/haptics';

export default function BookingSuccessScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();

  useEffect(() => {
    haptics.success();
  }, []);

  const { seats, rideData, boardingCity, exitCity, booking } = route.params;
  const ride = rideData || null;

  const fromLabel = boardingCity ?? ride?.from ?? '-';
  const toLabel = exitCity ?? ride?.to ?? '-';
  const dateLabel = ride?.date ?? 'N/A';
  const timeLabel = ride?.departureTime ?? '';
  const totalFare = ride?.pricePerSeat != null ? (seats * ride.pricePerSeat) : null;

  const DETAIL_ROWS = [
    { label: 'Date & Time', value: timeLabel ? `${dateLabel} • ${timeLabel}` : dateLabel, icon: 'calendar-outline' },
    { label: 'Trip', value: `One Way • ${seats} Seat${seats !== 1 ? 's' : ''}`, icon: 'people-outline' },
    ...(booking?.pickupAddress ? [{ label: 'Pickup Point', value: booking.pickupAddress, icon: 'location-outline' }] : []),
    ...(booking?.dropAddress ? [{ label: 'Drop-off Point', value: booking.dropAddress, icon: 'flag-outline' }] : []),
    { label: 'Payment Method', value: 'Cash', icon: 'cash-outline' },
    {
      label: 'Total Fare',
      value: totalFare != null ? `Rs ${totalFare.toLocaleString()}` : 'N/A',
      icon: 'wallet-outline',
      highlight: true,
    },
  ];

  // Explicitly target the tab's root screen — this flow (Search > RideDetail >
  // BookingConfirm > BookingSuccess) all lives inside PassengerHomeTab's own
  // stack, so navigating to the tab alone is a no-op when it's already focused;
  // only navigating to its nested root screen reliably pops back to Home.
  const goHome = () => navigation.navigate('PassengerApp', { screen: 'PassengerHomeTab', params: { screen: 'PassengerHomeMain' } });
  const goToBooking = () => navigation.navigate('PassengerApp', { screen: 'BookingHistoryTab', params: { screen: 'BookingHistoryMain' } });

  return (
    <View style={styles.container}>
      {/* Compact success header — replaces the old oversized checkmark hero */}
      <LinearGradient colors={GRADIENTS.secondary as any} style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Pressable onPress={() => (navigation.canGoBack() ? navigation.goBack() : goHome())} style={styles.headerBackBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </Pressable>
        <View style={styles.headerIconWrap}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Booking Confirmed!</Text>
          <Text style={styles.headerSubtitle}>Your seat is booked, get ready to travel!</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Route summary strip */}
        <View style={styles.routeStrip}>
          <RouteTag from={fromLabel} to={toLabel} textStyle={styles.routeText} />
        </View>

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
      </ScrollView>

      {/* Fluid bottom action bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 14 }]}>
        <GhostButton title="Home" icon="home-outline" onPress={goHome} style={styles.homeBtn} />
        <PrimaryButton title="View Booking" icon="receipt-outline" onPress={goToBooking} style={styles.viewBtn} />
      </View>
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
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },

  /* Compact success header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerBackBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },

  /* Route strip */
  routeStrip: {
    width: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  routeText: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },

  /* Details card */
  detailsCard: {
    width: '100%',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 18,
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

  /* Fluid bottom bar — floating, elevated card lifted off the scroll content */
  bottomBar: {
    flexDirection: 'row', gap: 12,
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 14,
  },
  homeBtn: { flex: 1 },
  viewBtn: { flex: 1.6 },
});

