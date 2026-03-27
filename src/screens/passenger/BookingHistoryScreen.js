import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, EmptyState, GradientHeader, StatusBadge, GhostButton } from '../../components';
import { useApp } from '../../context/AppContext';

export default function BookingHistoryScreen({ navigation }) {
  const { getMyBookings, getRideById, getDriverById, cancelBooking } = useApp();
  const bookings = getMyBookings();

  const handleCancel = (bookingId) => {
    Alert.alert('Booking Cancel Karen?', 'Kya aap yaqeen se cancel karna chahte hain?', [
      { text: 'Nahi', style: 'cancel' },
      { text: 'Haan, Cancel', style: 'destructive', onPress: () => cancelBooking(bookingId) },
    ]);
  };

  const renderBooking = ({ item }) => {
    const ride = getRideById(item.rideId);
    const driver = getDriverById(ride?.driverId);
    if (!ride) return null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.routeRow}>
            <Text style={styles.city}>{ride.from}</Text>
            <Ionicons name="arrow-forward" size={14} color={COLORS.gray} style={{ marginHorizontal: 8 }} />
            <Text style={styles.city}>{ride.to}</Text>
          </View>
          <StatusBadge status={item.status} />
        </View>

        <View style={styles.infoGrid}>
          {[
            { icon: 'calendar-outline', label: 'Date',   value: ride.date },
            { icon: 'time-outline',     label: 'Time',   value: ride.departureTime },
            { icon: 'people-outline',   label: 'Seats',  value: `${item.seats} seat(s)` },
            { icon: 'person-outline',   label: 'Driver', value: driver?.name || 'N/A' },
          ].map((info, i) => (
            <View key={i} style={styles.infoItem}>
              <Ionicons name={info.icon} size={14} color={COLORS.gray} />
              <Text style={styles.infoLabel}>{info.label}</Text>
              <Text style={styles.infoValue}>{info.value}</Text>
            </View>
          ))}
        </View>

        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.amountLabel}>Total Paid</Text>
            <Text style={styles.amountValue}>Rs {item.totalAmount?.toLocaleString()}</Text>
          </View>
          {item.status === 'confirmed' && (
            <GhostButton title="Cancel" color={COLORS.danger} onPress={() => handleCancel(item.id)} style={styles.cancelBtn} />
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
          <EmptyState icon="receipt-outline" title="Koi Booking Nahi" subtitle="Abhi tak koi ride book nahi ki. Pehli ride book karen!" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  listContent: { padding: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  city: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 14, backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, gap: 8 },
  infoItem: { width: '46%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginRight: 4 },
  infoValue: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, flex: 1 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12 },
  amountLabel: { fontSize: 11, color: COLORS.gray },
  amountValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  cancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
});
