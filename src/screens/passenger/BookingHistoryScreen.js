import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, EmptyState } from '../../components';
import { useApp } from '../../context/AppContext';

const STATUS_COLORS = {
  confirmed: COLORS.secondary,
  cancelled: COLORS.danger,
  completed: COLORS.gray,
  pending: COLORS.accent,
};

export default function BookingHistoryScreen({ navigation }) {
  const { getMyBookings, getRideById, getDriverById, cancelBooking } = useApp();
  const bookings = getMyBookings();

  const handleCancel = (bookingId) => {
    Alert.alert(
      'Booking Cancel Karen?',
      'Kya aap yaqeen se cancel karna chahte hain?',
      [
        { text: 'Nahi', style: 'cancel' },
        { text: 'Haan, Cancel', style: 'destructive', onPress: () => cancelBooking(bookingId) },
      ]
    );
  };

  const renderBooking = ({ item }) => {
    const ride = getRideById(item.rideId);
    const driver = getDriverById(ride?.driverId);
    if (!ride) return null;

    return (
      <View style={styles.bookingCard}>
        <View style={styles.bookingHeader}>
          <View style={styles.routeRow}>
            <Text style={styles.city}>{ride.from}</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.gray} style={{ marginHorizontal: 8 }} />
            <Text style={styles.city}>{ride.to}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          {[
            { icon: 'calendar-outline', label: 'Date', value: ride.date },
            { icon: 'time-outline', label: 'Time', value: ride.departureTime },
            { icon: 'people-outline', label: 'Seats', value: `${item.seats} seat(s)` },
            { icon: 'person-outline', label: 'Driver', value: driver?.name || 'N/A' },
          ].map((info, i) => (
            <View key={i} style={styles.infoItem}>
              <Ionicons name={info.icon} size={14} color={COLORS.gray} />
              <Text style={styles.infoLabel}>{info.label}</Text>
              <Text style={styles.infoValue}>{info.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.bookingFooter}>
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Total Paid</Text>
            <Text style={styles.amountValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
          </View>
          {item.status === 'confirmed' && (
            <TouchableOpacity onPress={() => handleCancel(item.id)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a73e8', '#0d47a1']} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <Text style={styles.headerSub}>{bookings.length} total bookings</Text>
      </LinearGradient>

      <FlatList
        data={bookings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderBooking}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="Koi Booking Nahi"
            subtitle="Abhi tak koi ride book nahi ki. Pehli ride book karen!"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  listContent: { padding: 16 },
  bookingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  bookingHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  city: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, gap: 8 },
  infoItem: { width: '46%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginRight: 4 },
  infoValue: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  bookingFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  amountBox: {},
  amountLabel: { fontSize: 11, color: COLORS.gray },
  amountValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  cancelBtn: { borderWidth: 1.5, borderColor: COLORS.danger, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  cancelBtnText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
});
