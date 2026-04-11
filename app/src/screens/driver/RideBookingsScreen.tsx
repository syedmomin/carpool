import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Image, Linking, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, GradientHeader, EmptyState, Avatar, StatusBadge } from '../../components';
import { ridesApi, bookingsApi } from '../../services/api';
import { socketService } from '../../services/socket.service';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

export default function RideBookingsScreen({ navigation, route }) {
  const { rideId } = route.params;
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRide = useCallback(async () => {
    setLoading(true);
    const { data, error } = await ridesApi.getById(rideId);
    setLoading(false);
    if (error) {
      showToast(error, 'error');
      navigation.goBack();
      return;
    }
    setRide(data.data || data);
  }, [rideId]);

  useFocusEffect(useCallback(() => {
    fetchRide();

    // Listen for new booking requests for this specific ride
    socketService.on('BOOKING_REQUESTED', (data) => {
      console.log('New booking request for this ride:', data);
      if (data.rideId === rideId) {
        fetchRide();
      }
    });

    return () => {
      socketService.off('BOOKING_REQUESTED');
    };
  }, [fetchRide, rideId]));

  const handleAccept = (bookingId: string, name: string) => {
    showModal({
      type: 'primary',
      title: 'Accept Booking?',
      message: `Are you sure you want to accept ${name}'s booking request?`,
      confirmText: 'Accept',
      cancelText: 'Cancel',
      icon: 'checkmark-circle-outline',
      onConfirm: async () => {
        setActionLoading(bookingId);
        const { error } = await bookingsApi.accept(bookingId);
        setActionLoading(null);
        if (error) showToast(error, 'error');
        else {
          showToast('Booking accepted!', 'success');
          fetchRide();
        }
      },
    });
  };

  const handleReject = (bookingId: string, name: string) => {
    showModal({
      type: 'danger',
      title: 'Reject Booking?',
      message: `Are you sure you want to reject ${name}'s request? The seats will be released.`,
      confirmText: 'Reject',
      cancelText: 'Cancel',
      icon: 'close-circle-outline',
      onConfirm: async () => {
        setActionLoading(bookingId);
        const { error } = await bookingsApi.reject(bookingId);
        setActionLoading(null);
        if (error) showToast(error, 'error');
        else {
          showToast('Booking rejected', 'info');
          fetchRide();
        }
      },
    });
  };

  const callPassenger = (phone: string) => {
    Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Error', 'Could not open phone dialer.'));
  };

  const renderBooking = ({ item }: { item: any }) => {
    const p = item.passenger;
    const isPending = item.status === 'PENDING';
    const isConfirmed = item.status === 'CONFIRMED';
    const isActioning = actionLoading === item.id;

    return (
      <View style={[styles.card, !isPending && { opacity: 0.8 }]}>
        <View style={styles.cardTop}>
          <Avatar name={p.name} size={48} color={COLORS.primary} />
          <View style={styles.pInfo}>
            <Text style={styles.pName}>{p.name}</Text>
            <Text style={styles.pMeta}>{item.seats} seat{item.seats !== 1 ? 's' : ''} • Rs {item.totalAmount.toLocaleString()}</Text>
          </View>
          <StatusBadge status={item.status.toLowerCase()} label={item.status} />
        </View>

        {isPending ? (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.btn, styles.rejectBtn]} 
              onPress={() => handleReject(item.id, p.name)}
              disabled={!!actionLoading}
            >
              <Ionicons name="close" size={18} color={COLORS.danger} />
              <Text style={styles.rejectText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.btn, styles.acceptBtn]} 
              onPress={() => handleAccept(item.id, p.name)}
              disabled={!!actionLoading}
            >
              {isActioning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text style={styles.acceptText}>Accept</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.confirmedRow}>
            <TouchableOpacity style={styles.contactBtn} onPress={() => callPassenger(p.phone)}>
              <Ionicons name="call-outline" size={16} color={COLORS.primary} />
              <Text style={styles.contactText}>Call</Text>
            </TouchableOpacity>
            <View style={styles.btnDivider} />
            <TouchableOpacity 
              style={styles.contactBtn} 
              onPress={() => navigation.navigate('Chat', { 
                bookingId: item.id, 
                otherUser: p,
                rideInfo: { label: `${ride?.fromCity || ride?.from} → ${ride?.toCity || ride?.to}` }
              })}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={COLORS.primary} />
              <Text style={styles.contactText}>Chat</Text>
            </TouchableOpacity>
          </View>

        )}
      </View>
    );
  };

  if (loading && !ride) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.teal} />
      </View>
    );
  }

  const pending = ride?.bookings?.filter((b: any) => b.status === 'PENDING') || [];
  const confirmed = ride?.bookings?.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED') || [];

  return (
    <View style={styles.container}>
      <GradientHeader 
        colors={GRADIENTS.teal as any} 
        title="Manage Bookings" 
        subtitle={ride ? `${ride.from} → ${ride.to}` : ''}
        onBack={() => navigation.goBack()} 
      />

      <FlatList
        data={[...pending, ...confirmed]}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={renderBooking}
        ListHeaderComponent={
          ride && (
            <View style={styles.summary}>
              <View style={styles.stat}>
                <Text style={styles.statVal}>{ride.bookedSeats}/{ride.totalSeats}</Text>
                <Text style={styles.statLab}>Seats Filled</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.stat}>
                <Text style={styles.statVal}>{pending.length}</Text>
                <Text style={styles.statLab}>Pending</Text>
              </View>
            </View>
          )
        }
        ListEmptyComponent={<EmptyState icon="people-outline" title="No Bookings Yet" subtitle="Passenger requests will appear here." />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 40 },
  summary: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 20, alignItems: 'center', elevation: 2 },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  statLab: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  divider: { width: 1, height: 30, backgroundColor: COLORS.border },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 14, marginBottom: 12, elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  pInfo: { flex: 1 },
  pName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  pMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6, borderWidth: 1.5 },
  rejectBtn: { borderColor: COLORS.danger + '30', backgroundColor: '#fff5f5' },
  rejectText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  acceptBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  confirmedRow: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, marginTop: 2 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' },
  contactText: { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  btnDivider: { width: 1, height: 20, backgroundColor: COLORS.border },
});

