import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge, GhostButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

export default function BookingHistoryScreen({ navigation }) {
  const { getMyBookings, getRideById, getDriverById, cancelBooking } = useApp();
  const { showModal } = useGlobalModal();
  const bookings = getMyBookings();

  const confirmCancel = (bookingId) => {
    showModal({
      type: 'danger',
      title: 'Cancel Booking?',
      message: 'Are you sure you want to cancel this booking? This action cannot be undone.',
      confirmText: 'Yes, Cancel',
      cancelText: 'Keep Booking',
      icon: 'close-circle-outline',
      onConfirm: () => cancelBooking(bookingId),
    });
  };

  const renderBooking = ({ item }) => {
    // API returns nested ride; fallback to local lookup
    const ride       = item.ride || getRideById(item.rideId);
    if (!ride) return null;
    const fromCity   = ride.fromCity || ride.from || '';
    const toCity     = ride.toCity   || ride.to   || '';
    const driverName = ride.driver?.name || 'N/A';
    const isActive   = item.status === 'CONFIRMED' || item.status === 'confirmed';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.routeRow}>
            <View style={styles.cityDot} />
            <Text style={styles.city}>{fromCity}</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.gray} style={{ marginHorizontal: 8 }} />
            <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
            <Text style={styles.city}>{toCity}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.infoGrid}>
          {[
            { icon: 'calendar-outline', label: 'Date',   value: ride.date },
            { icon: 'time-outline',     label: 'Time',   value: ride.departureTime },
            { icon: 'people-outline',   label: 'Seats',  value: `${item.seats} seat(s)` },
            { icon: 'person-outline',   label: 'Driver', value: driverName },
          ].map((info, i) => (
            <View key={i} style={styles.infoItem}>
              <Ionicons name={info.icon} size={14} color={COLORS.primary} />
              <View>
                <Text style={styles.infoLabel}>{info.label}</Text>
                <Text style={styles.infoValue}>{info.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Total Paid</Text>
            <Text style={styles.amountValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
          </View>
          {isActive && (
            <TouchableOpacity style={styles.cancelBtn} onPress={() => confirmCancel(item.id)}>
              <Ionicons name="close-circle-outline" size={16} color={COLORS.danger} />
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary}
        title="My Bookings"
        subtitle={`${bookings.length} total bookings`}
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderBooking}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No Bookings"
            subtitle="You haven't booked any rides yet. Book your first ride!"
          />
        }
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary, marginRight: 5 },
  city: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, backgroundColor: COLORS.lightGray, borderRadius: 14, padding: 14, gap: 12 },
  infoItem: { width: '46%', flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { fontSize: 10, color: COLORS.gray },
  infoValue: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  amountLabel: { fontSize: 11, color: COLORS.gray },
  amountValue: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#fff0f0', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.danger + '30' },
  cancelBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.danger },
});
