import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { scheduleRequestsApi } from '../../services/api';
import { socketService } from '../../services/socket.service';

const STATUS_CONFIG: any = {
  OPEN:      { color: COLORS.secondary, bg: '#e8f5e9', label: 'Open' },
  ACCEPTED:  { color: '#0369a1',        bg: '#e0f2fe', label: 'Accepted' },
  CANCELLED: { color: COLORS.danger,    bg: '#fef2f2', label: 'Cancelled' },
  EXPIRED:   { color: '#9a3412',        bg: '#fef2f2', label: 'Expired' },
};

export default function MyRequestsScreen({ navigation }) {
  const { showToast }  = useToast();
  const { showModal }  = useGlobalModal();

  const [requests, setRequests]     = useState<any[]>([]);
  const [loading, setLoading]       = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const { data } = await scheduleRequestsApi.getMine();
    isRefresh ? setRefreshing(false) : setLoading(false);
    if (data?.data) setRequests(data.data);
  }, []);

  useFocusEffect(useCallback(() => {
    load();

    // Live bid updates
    const onRideBid = (data: any) => {
      const bid = data.bid;
      if (!bid) return;
      setRequests(prev => prev.map(req => {
        if (req.id !== bid.scheduleRequestId) return req;
        const exists = (req.bids || []).find((b: any) => b.id === bid.id);
        if (exists) return req;
        return { ...req, bids: [...(req.bids || []), bid] };
      }));
    };
    const onBidWithdrawn = (data: any) => {
      if (!data.bidId) return;
      setRequests(prev => prev.map(req => ({
        ...req,
        bids: (req.bids || []).filter((b: any) => b.id !== data.bidId),
      })));
    };

    socketService.on('RIDE_BID', onRideBid);
    socketService.on('BID_WITHDRAWN', onBidWithdrawn);
    return () => {
      socketService.off('RIDE_BID', onRideBid);
      socketService.off('BID_WITHDRAWN', onBidWithdrawn);
    };
  }, [load]));

  const handleCancel = (req: any) => {
    showModal({
      type: 'danger',
      title: 'Cancel Request?',
      message: `Cancel your ${req.fromCity} → ${req.toCity} request on ${req.date}? All pending bids will be removed.`,
      confirmText: 'Yes, Cancel',
      cancelText: 'No',
      onConfirm: async () => {
        const { error } = await scheduleRequestsApi.cancel(req.id);
        if (error) { showToast(error, 'error'); return; }
        showToast('Request cancelled', 'info');
        load();
      },
    });
  };

  const handleAccept = (req: any, bid: any) => {
    showModal({
      type: 'primary',
      title: 'Accept Bid?',
      message: `Accept ${bid.driver?.name}'s offer of Rs ${bid.pricePerSeat}/seat for ${req.fromCity} → ${req.toCity}?\n\nA ride will be auto-created and your seat confirmed.`,
      confirmText: 'Accept & Book',
      cancelText: 'Not Now',
      icon: 'checkmark-circle-outline',
      onConfirm: async () => {
        const { error } = await scheduleRequestsApi.acceptBid(req.id, bid.id);
        if (error) { showToast(error, 'error'); return; }
        showToast('Bid accepted! Your ride is confirmed.', 'success', 4000);
        load();
      },
    });
  };

  const handleReject = async (req: any, bid: any) => {
    const { error } = await scheduleRequestsApi.rejectBid(req.id, bid.id);
    if (error) { showToast(error, 'error'); return; }
    showToast('Bid rejected', 'info');
    load();
  };

  const renderRequest = ({ item: req }: any) => {
    const sc          = STATUS_CONFIG[req.status] || STATUS_CONFIG.OPEN;
    const pendingBids = (req.bids || []).filter((b: any) => b.status === 'PENDING');
    const acceptedBid = (req.bids || []).find((b: any) => b.status === 'ACCEPTED');

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>{req.fromCity} → {req.toCity}</Text>
            <View style={styles.meta}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
              <Text style={styles.metaText}>{req.date}</Text>
              <Ionicons name="people-outline" size={13} color={COLORS.gray} />
              <Text style={styles.metaText}>{req.seats} seat{req.seats > 1 ? 's' : ''}</Text>
            </View>
            {req.note ? <Text style={styles.noteText}>"{req.note}"</Text> : null}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[styles.statusBadgeText, { color: sc.color }]}>{sc.label}</Text>
          </View>
        </View>

        {/* Accepted bid banner */}
        {acceptedBid && (
          <View style={styles.acceptedBanner}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} />
            <Text style={styles.acceptedText}>
              Accepted: {acceptedBid.driver?.name} — Rs {acceptedBid.pricePerSeat}/seat
            </Text>
          </View>
        )}

        {/* Pending bids */}
        {pendingBids.length > 0 && req.status === 'OPEN' && (
          <View style={styles.bidsSection}>
            <Text style={styles.bidsSectionTitle}>
              {pendingBids.length} Bid{pendingBids.length > 1 ? 's' : ''} Received
            </Text>
            {pendingBids.map((bid: any) => (
              <View key={bid.id} style={styles.bidCard}>
                <View style={styles.bidRow}>
                  <View style={styles.bidAvatar}>
                    <Text style={styles.bidAvatarText}>{bid.driver?.name?.[0] || 'D'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bidDriver}>{bid.driver?.name || 'Driver'}</Text>
                    {bid.driver?.rating > 0 && (
                      <View style={styles.ratingRow}>
                        <Ionicons name="star" size={11} color="#f59e0b" />
                        <Text style={styles.ratingText}>{bid.driver.rating}</Text>
                      </View>
                    )}
                    {bid.vehicle && (
                      <Text style={styles.bidVehicle}>{bid.vehicle.brand} {bid.vehicle.model} · {bid.vehicle.type}</Text>
                    )}
                    {bid.departureTime ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                        <Ionicons name="time-outline" size={11} color={COLORS.gray} />
                        <Text style={styles.bidVehicle}>Departs: {bid.departureTime}</Text>
                      </View>
                    ) : null}
                    {bid.note ? <Text style={styles.bidNote}>"{bid.note}"</Text> : null}
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Per Seat</Text>
                    <Text style={styles.price}>Rs {bid.pricePerSeat}</Text>
                    <Text style={styles.priceTotal}>Total Rs {bid.pricePerSeat * req.seats}</Text>
                  </View>
                </View>
                <View style={styles.bidActions}>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(req, bid)}>
                    <Ionicons name="close" size={14} color={COLORS.danger} />
                    <Text style={styles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(req, bid)}>
                    <LinearGradient colors={GRADIENTS.primary as any} style={styles.acceptBtnGrad}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                      <Text style={styles.acceptBtnText}>Accept</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Waiting */}
        {req.status === 'OPEN' && pendingBids.length === 0 && !acceptedBid && (
          <View style={styles.waitingRow}>
            <Ionicons name="time-outline" size={15} color={COLORS.gray} />
            <Text style={styles.waitingText}>Waiting for driver bids...</Text>
          </View>
        )}

        {/* Cancel */}
        {req.status === 'OPEN' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancel(req)}>
            <Ionicons name="close-circle-outline" size={15} color={COLORS.danger} />
            <Text style={styles.cancelBtnText}>Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.primary as any}
        title="My Requests"
        subtitle="Bids from drivers on your requests"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightIcon="add-outline"
        onRightPress={() => navigation.navigate('PostRequest')}
      />

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          renderItem={renderRequest}
          ListEmptyComponent={
            !refreshing ? (
              <EmptyState
                icon="calendar-outline"
                title="No Requests Yet"
                subtitle="Post a schedule request and drivers will bid with their prices."
                action={{ label: 'Post a Request', onPress: () => navigation.navigate('PostRequest') }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:           { padding: 16, paddingBottom: 100 },
  card:           { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardHeader:     { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  route:          { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  meta:           { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:       { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  noteText:       { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 4 },
  statusBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText:{ fontSize: 11, fontWeight: '700' },
  acceptedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10, marginBottom: 8 },
  acceptedText:   { fontSize: 13, fontWeight: '600', color: COLORS.secondary, flex: 1 },
  bidsSection:    { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 12, marginTop: 4 },
  bidsSectionTitle:{ fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  bidCard:        { backgroundColor: COLORS.lightGray, borderRadius: 12, padding: 12, marginBottom: 8 },
  bidRow:         { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  bidAvatar:      { width: 38, height: 38, borderRadius: 19, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  bidAvatarText:  { fontSize: 16, fontWeight: '700', color: '#fff' },
  bidDriver:      { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  ratingRow:      { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText:     { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  bidVehicle:     { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  bidNote:        { fontSize: 11, color: COLORS.gray, fontStyle: 'italic', marginTop: 3 },
  priceBox:       { alignItems: 'flex-end' },
  priceLabel:     { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase' },
  price:          { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  priceTotal:     { fontSize: 10, color: COLORS.gray },
  bidActions:     { flexDirection: 'row', gap: 8, marginTop: 10 },
  rejectBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.danger + '50', borderRadius: 10, paddingVertical: 8 },
  rejectBtnText:  { fontSize: 13, fontWeight: '600', color: COLORS.danger },
  acceptBtn:      { flex: 2, borderRadius: 10, overflow: 'hidden' },
  acceptBtnGrad:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9 },
  acceptBtnText:  { fontSize: 13, fontWeight: '700', color: '#fff' },
  waitingRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  waitingText:    { fontSize: 13, color: COLORS.gray, fontStyle: 'italic' },
  cancelBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, paddingTop: 12, marginTop: 4, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelBtnText:  { fontSize: 13, fontWeight: '600', color: COLORS.danger },
});
