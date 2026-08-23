import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, EmptyState, Avatar, StarRating, StatusBadge, TrustBadgesRow, TabPills, SectionHeader } from '../../components';
import { ridesApi, bookingsApi } from '../../services/api';
import { socketService } from '../../services/socket.service';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

function requestedAtLabel(createdAt?: string) {
  if (!createdAt) return null;
  const d = new Date(createdAt);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function RideBookingsScreen({ navigation, route }) {
  const { rideId } = route.params;
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'accepted'>('pending');
  const fetchingRef = useRef(false);

  const fetchRide = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    const { data, error } = await ridesApi.getMineById(rideId);
    setLoading(false);
    fetchingRef.current = false;
    if (error) {
      showToast(error, 'error');
      navigation.goBack();
      return;
    }
    setRide(data.data || data);
  }, [rideId]);

  useFocusEffect(useCallback(() => {
    fetchRide();
  }, [fetchRide]));

  // Socket always active — update booking list in real-time even if screen loses focus
  useEffect(() => {
    const onBookingChanged = (data: any) => {
      if (data.rideId === rideId) fetchRide();
    };
    socketService.on('BOOKING_REQUESTED',  onBookingChanged);
    socketService.on('BOOKING_CANCELLED',  onBookingChanged);
    socketService.on('BOOKING_ACCEPTED',   onBookingChanged);
    socketService.on('BOOKING_REJECTED',   onBookingChanged);
    return () => {
      socketService.off('BOOKING_REQUESTED',  onBookingChanged);
      socketService.off('BOOKING_CANCELLED',  onBookingChanged);
      socketService.off('BOOKING_ACCEPTED',   onBookingChanged);
      socketService.off('BOOKING_REJECTED',   onBookingChanged);
    };
  }, [rideId, fetchRide]);

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
          showToast('Booking accepted', 'success');
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

  const renderPendingCard = (item: any) => {
    const p = item.passenger;
    const isActioning = actionLoading === item.id;
    const requestedAt = requestedAtLabel(item.createdAt);

    return (
      <View key={item.id} style={styles.card}>
        <View style={styles.cardTop}>
          <Avatar name={p.name} uri={p.avatar} size={48} color={COLORS.primary} />
          <View style={styles.pInfo}>
            <View style={styles.pNameRow}>
              <Text style={styles.pName}>{p.name}</Text>
              {p.rating > 0 && <StarRating rating={p.rating} size={12} />}
            </View>
            <Text style={styles.pMeta}>{item.seats} seat{item.seats !== 1 ? 's' : ''} · Rs {item.totalAmount.toLocaleString()}</Text>
            <TrustBadgesRow user={p} max={2} style={{ marginTop: 4 }} />
          </View>
        </View>

        {requestedAt && <Text style={styles.requestedAt}>Requested at {requestedAt}</Text>}

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.btn, styles.rejectBtn]}
            onPress={() => handleReject(item.id, p.name)}
            disabled={!!actionLoading}
          >
            <Ionicons name="close" size={18} color={COLORS.danger} />
            <Text style={styles.rejectText}>Reject</Text>
          </Pressable>
          <Pressable
            style={[styles.btn, styles.acceptBtn]}
            onPress={() => handleAccept(item.id, p.name)}
            disabled={!!actionLoading}
          >
            {isActioning ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark" size={18} color={COLORS.white} />
                <Text style={styles.acceptText}>Accept</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    );
  };

  const renderAcceptedRow = (item: any) => {
    const p = item.passenger;
    return (
      <Pressable
        key={item.id}
        style={({ pressed }) => [styles.acceptedRow, pressed && styles.acceptedRowPressed]}
        onPress={() => navigation.navigate('DriverBookingDetail', { booking: { ...item, ride } })}
      >
        <Avatar name={p.name} uri={p.avatar} size={40} color={COLORS.primary} />
        <View style={{ flex: 1 }}>
          <View style={styles.pNameRow}>
            <Text style={styles.pName}>{p.name}</Text>
            {p.rating > 0 && <StarRating rating={p.rating} size={12} />}
          </View>
          <Text style={styles.pMeta}>{item.seats} seat{item.seats !== 1 ? 's' : ''}</Text>
        </View>
        <Text style={styles.bookingPrice}>Rs {item.totalAmount.toLocaleString()}</Text>
        <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
      </Pressable>
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
  const accepted = ride?.bookings?.filter((b: any) => b.status === 'CONFIRMED' || b.status === 'COMPLETED') || [];
  const confSeats = accepted.reduce((s: number, b: any) => s + (b.seats || 1), 0);
  const isFinished = ride?.status === 'COMPLETED' || ride?.status === 'CANCELLED' || ride?.status === 'EXPIRED';
  const earned = accepted.reduce((s: number, b: any) => s + (b.totalAmount || 0), 0);

  const hasTime = ride?.departureTime && ride.departureTime !== '00:00';

  // Build the list; for 'accepted'/'all' tabs, inject a section-header marker
  // ahead of the accepted rows so they read as a distinct "Accepted Bookings" group.
  let listData: any[] = [];
  if (tab === 'pending') {
    listData = pending;
  } else {
    listData = accepted.length ? [{ id: '__accepted_header', _section: true }, ...accepted] : [];
  }

  return (
    <View style={styles.container}>
      <AppBar
        title="Ride Bookings"
        onBack={() => navigation.goBack()}
      />

      {ride && (
        <View style={styles.subtitleBlock}>
          <Text style={styles.subtitleRoute}>{(ride.fromCity || ride.from)} → {(ride.toCity || ride.to)}</Text>
          <Text style={styles.subtitleDate}>
            {ride.date}{hasTime ? `, ${ride.departureTime}` : ''}
          </Text>
        </View>
      )}

      <View style={styles.summaryRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{confSeats}/{ride?.totalSeats ?? 0}</Text>
          <Text style={styles.statLab}>{isFinished ? 'Passengers' : 'Confirmed Seats'}</Text>
        </View>
        <View style={styles.divider} />
        {isFinished ? (
          <View style={styles.stat}>
            <Text style={styles.statVal}>Rs {earned.toLocaleString()}</Text>
            <Text style={styles.statLab}>Total Earned</Text>
          </View>
        ) : (
          <View style={styles.stat}>
            <Text style={styles.statVal}>{pending.length}</Text>
            <Text style={styles.statLab}>Pending</Text>
          </View>
        )}
      </View>

      <TabPills
        style={styles.tabs}
        tabs={[
          { label: `Pending (${pending.length})`, value: 'pending' },
          { label: `Accepted (${accepted.length})`, value: 'accepted' },
        ]}
        activeTab={tab}
        onSelect={(v) => setTab(v)}
      />

      <FlatList
        data={listData}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          item._section
            ? <SectionHeader title="Accepted Bookings" style={styles.sectionHeader} />
            : item.status === 'PENDING' ? renderPendingCard(item) : renderAcceptedRow(item)
        )}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title={tab === 'pending' ? 'No Pending Requests' : 'No Accepted Bookings'}
            subtitle="Passenger requests will appear here."
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  subtitleBlock: { paddingHorizontal: 16, marginBottom: 12 },
  subtitleRoute: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  subtitleDate: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  summaryRow: {
    flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14,
    marginHorizontal: 16, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, ...CURVE,
  },
  stat: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  statLab: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  divider: { width: 1, height: 28, backgroundColor: COLORS.border },
  tabs: { marginHorizontal: 16, marginBottom: 12 },
  sectionHeader: { marginBottom: 10 },
  list: { padding: 16, paddingTop: 0, paddingBottom: 32 },
  card: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  pInfo: { flex: 1 },
  pNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  pMeta: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  requestedAt: { fontSize: 11, color: COLORS.gray, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 10, gap: 6, borderWidth: 1.5 },
  rejectBtn: { borderColor: COLORS.danger + '30', backgroundColor: '#fff5f5' },
  rejectText: { color: COLORS.danger, fontWeight: '700', fontSize: 13 },
  acceptBtn: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  acceptText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  acceptedRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.cardBg, borderRadius: 16,
    padding: 12, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, ...CURVE,
  },
  acceptedRowPressed: { backgroundColor: COLORS.lightGray },
  bookingPrice: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
});
