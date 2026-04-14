import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { scheduleRequestsApi, vehiclesApi } from '../../services/api';
import { socketService } from '../../services/socket.service';

// ─── Bid Modal ────────────────────────────────────────────────────────────────
// IMPORTANT: all hooks MUST be before any early return — Rules of Hooks
function BidModal({ visible, request, vehicles, onSubmit, onClose }) {
  const { showToast } = useToast();                         // hook — always first
  const [price, setPrice]             = useState('');
  const [selectedVehicle, setVehicle] = useState<any>(null);
  const [departureTime, setDepTime]   = useState('');
  const [note, setNote]               = useState('');
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    if (visible) {
      setPrice(''); setNote(''); setDepTime('');
      setVehicle(vehicles.find((v: any) => v.isActive) || vehicles[0] || null);
    }
  }, [visible, vehicles]);

  // early return AFTER all hooks
  if (!visible || !request) return null;

  const handleSubmit = async () => {
    if (!price || isNaN(Number(price)) || Number(price) < 1) {
      showToast('Please enter a valid price', 'warning'); return;
    }
    if (!selectedVehicle) {
      showToast('Please select a vehicle', 'warning'); return;
    }
    if (!departureTime.trim()) {
      showToast('Please enter departure time (e.g. 08:30)', 'warning'); return;
    }
    // basic HH:MM validation
    const timeReg = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeReg.test(departureTime.trim())) {
      showToast('Enter time in HH:MM format (e.g. 08:30)', 'warning'); return;
    }
    setSubmitting(true);
    await onSubmit({
      pricePerSeat:  Number(price),
      vehicleId:     selectedVehicle.id,
      departureTime: departureTime.trim(),
      note:          note.trim() || undefined,
    });
    setSubmitting(false);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={bm.overlay} onPress={onClose} activeOpacity={1}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <TouchableOpacity activeOpacity={1}>
            <View style={bm.sheet}>
              <View style={bm.handle} />
              <Text style={bm.title}>Place Your Bid</Text>

              {/* Route info */}
              <View style={bm.routeBox}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={bm.routeText}>{request.fromCity} → {request.toCity}</Text>
                  <Text style={bm.dateText}>{request.date} · {request.seats} seat{request.seats > 1 ? 's' : ''}</Text>
                </View>
              </View>

              {/* Price */}
              <Text style={bm.label}>Your Price Per Seat (Rs)</Text>
              <TextInput
                style={bm.priceInput}
                placeholder="e.g. 1500"
                placeholderTextColor={COLORS.gray}
                value={price}
                onChangeText={v => setPrice(v.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
              />
              {!!price && Number(price) > 0 && (
                <Text style={bm.totalPreview}>
                  Total for passenger: Rs {(Number(price) * request.seats).toLocaleString()}
                </Text>
              )}

              {/* Departure Time */}
              <Text style={[bm.label, { marginTop: 14 }]}>Departure Time</Text>
              <View style={bm.timeRow}>
                <Ionicons name="time-outline" size={18} color={COLORS.primary} />
                <TextInput
                  style={bm.timeInput}
                  placeholder="08:30"
                  placeholderTextColor={COLORS.gray}
                  value={departureTime}
                  onChangeText={v => {
                    // auto-insert colon
                    let val = v.replace(/[^0-9]/g, '');
                    if (val.length >= 3) val = val.slice(0, 2) + ':' + val.slice(2, 4);
                    setDepTime(val);
                  }}
                  keyboardType="number-pad"
                  maxLength={5}
                />
                <Text style={bm.timeHint}>HH:MM (24hr)</Text>
              </View>

              {/* Vehicle picker */}
              {vehicles.length > 0 && (
                <>
                  <Text style={[bm.label, { marginTop: 14 }]}>Select Vehicle</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {vehicles.map((v: any) => (
                      <TouchableOpacity
                        key={v.id}
                        style={[bm.vehicleChip, selectedVehicle?.id === v.id && bm.vehicleChipActive]}
                        onPress={() => setVehicle(v)}
                      >
                        <Ionicons name="car-outline" size={14} color={selectedVehicle?.id === v.id ? '#fff' : COLORS.primary} />
                        <Text style={[bm.vehicleChipText, selectedVehicle?.id === v.id && { color: '#fff' }]}>
                          {v.brand} {v.model}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Note */}
              <Text style={bm.label}>Note <Text style={bm.optional}>(optional)</Text></Text>
              <TextInput
                style={bm.noteInput}
                placeholder="E.g. I can pick you up from your location..."
                placeholderTextColor={COLORS.gray}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
                maxLength={150}
              />

              <TouchableOpacity
                style={[bm.submitBtn, (!price || submitting) && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={!price || submitting}
              >
                <LinearGradient colors={GRADIENTS.primary as any} style={bm.submitGrad}>
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="send-outline" size={16} color="#fff" /><Text style={bm.submitText}>Submit Bid</Text></>
                  }
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function OpenRequestsScreen({ navigation }) {
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();

  const [requests, setRequests]       = useState<any[]>([]);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [vehicles, setVehicles]       = useState<any[]>([]);
  const [bidTarget, setBidTarget]     = useState<any>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadRequests = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const { data } = await scheduleRequestsApi.getOpen();
    isRefresh ? setRefreshing(false) : setLoading(false);
    if (data?.data) setRequests(data.data);
  }, []);

  const loadVehicles = useCallback(async () => {
    const { data } = await vehiclesApi.myVehicles();
    if (data?.data) setVehicles(data.data);
  }, []);

  useFocusEffect(useCallback(() => {
    loadRequests();
    loadVehicles();

    // ── Live: new passenger request posted ───────────────────────────────
    const onNewRequest = (data: any) => {
      setRequests(prev => {
        if (prev.find(r => r.id === data.id)) return prev;
        return [{ ...data, bids: [] }, ...prev];
      });
      showToast(`New ride request: ${data.fromCity} → ${data.toCity}`, 'info');
    };

    // ── Live: request cancelled by passenger — remove ─────────────────────
    const onRequestCancelled = (data: any) => {
      setRequests(prev => prev.filter(r => r.id !== data.scheduleRequestId));
    };

    // ── Live: someone else's bid was accepted — mark request closed ───────
    const onBidAccepted = (data: any) => {
      setRequests(prev => prev.map(r =>
        r.id === data.scheduleRequestId ? { ...r, status: 'ACCEPTED' } : r
      ));
    };

    // ── Live: driver's own bid was rejected (update bid status in list) ───
    const onBidRejected = (data: any) => {
      setRequests(prev => prev.map(r => ({
        ...r,
        bids: (r.bids || []).map((b: any) =>
          b.id === data.bidId ? { ...b, status: 'REJECTED' } : b
        ),
      })));
    };

    socketService.on('SCHEDULE_REQUEST',  onNewRequest);
    socketService.on('REQUEST_CANCELLED', onRequestCancelled);
    socketService.on('BID_ACCEPTED',      onBidAccepted);
    socketService.on('BID_REJECTED',      onBidRejected);

    return () => {
      socketService.off('SCHEDULE_REQUEST',  onNewRequest);
      socketService.off('REQUEST_CANCELLED', onRequestCancelled);
      socketService.off('BID_ACCEPTED',      onBidAccepted);
      socketService.off('BID_REJECTED',      onBidRejected);
    };
  }, [loadRequests, loadVehicles]));

  // ── Place / Update Bid ────────────────────────────────────────────────────
  const handlePlaceBid = async (bidData: any) => {
    const { data, error } = await scheduleRequestsApi.placeBid(bidTarget.id, bidData);
    if (error) { showToast(error, 'error'); return; }

    showToast('Bid placed! Waiting for passenger to accept.', 'success');
    setBidTarget(null);

    // Live update the local list immediately — no refresh needed
    setRequests(prev => prev.map(r => {
      if (r.id !== bidTarget.id) return r;
      const existingBids = (r.bids || []).filter((b: any) => b.status !== 'PENDING');
      return {
        ...r,
        bids: [...existingBids, {
          id:            data?.data?.id || 'temp_' + Date.now(),
          status:        'PENDING',
          pricePerSeat:  bidData.pricePerSeat,
          departureTime: bidData.departureTime,
          note:          bidData.note,
        }],
      };
    }));
  };

  // ── Withdraw Bid ──────────────────────────────────────────────────────────
  const handleWithdraw = (request: any) => {
    const myBid = (request.bids || [])[0];
    if (!myBid) return;
    showModal({
      type: 'danger',
      title: 'Withdraw Bid?',
      message: `Withdraw your bid of Rs ${myBid.pricePerSeat}/seat for ${request.fromCity} → ${request.toCity}?`,
      confirmText: 'Withdraw',
      cancelText: 'Keep Bid',
      onConfirm: async () => {
        setWithdrawing(request.id);
        const { error } = await scheduleRequestsApi.withdrawBid(request.id, myBid.id);
        setWithdrawing(null);
        if (error) { showToast(error, 'error'); return; }
        showToast('Bid withdrawn', 'info');
        // Live update — remove bid from list
        setRequests(prev => prev.map(r =>
          r.id === request.id ? { ...r, bids: [] } : r
        ));
      },
    });
  };

  // ── Render item ───────────────────────────────────────────────────────────
  const renderItem = ({ item }: { item: any }) => {
    const myBid         = (item.bids || [])[0];
    const hasBid        = !!myBid;
    const isAccepted    = item.status === 'ACCEPTED';
    const isWithdrawing = withdrawing === item.id;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>{item.fromCity} → {item.toCity}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
              <Text style={styles.metaText}>{item.date}</Text>
              <Ionicons name="people-outline" size={13} color={COLORS.gray} />
              <Text style={styles.metaText}>{item.seats} seat{item.seats > 1 ? 's' : ''}</Text>
            </View>
          </View>
          <View style={[styles.badge, isAccepted ? styles.badgeAccepted : styles.badgeOpen]}>
            <Text style={[styles.badgeText, isAccepted ? styles.badgeTextAccepted : styles.badgeTextOpen]}>
              {isAccepted ? 'Accepted' : 'Open'}
            </Text>
          </View>
        </View>

        {/* Passenger */}
        <View style={styles.passengerRow}>
          <View style={styles.passengerAvatar}>
            <Text style={styles.passengerAvatarText}>{item.passenger?.name?.[0] || 'P'}</Text>
          </View>
          <Text style={styles.passengerName}>{item.passenger?.name || 'Passenger'}</Text>
        </View>

        {/* Note */}
        {item.note ? (
          <View style={styles.noteRow}>
            <Ionicons name="chatbubble-ellipses-outline" size={13} color={COLORS.gray} />
            <Text style={styles.noteText}>"{item.note}"</Text>
          </View>
        ) : null}

        {/* My Bid status */}
        {hasBid && (
          <View style={styles.myBidRow}>
            <Ionicons name="pricetag-outline" size={14} color={COLORS.primary} />
            <Text style={styles.myBidText}>
              Your bid: Rs {myBid.pricePerSeat}/seat
              {myBid.departureTime ? ` · ${myBid.departureTime}` : ''}
            </Text>
            <View style={[
              styles.bidStatusDot,
              myBid.status === 'ACCEPTED' ? styles.bidDotAccepted
              : myBid.status === 'REJECTED' ? styles.bidDotRejected
              : styles.bidDotPending
            ]} />
            <Text style={styles.bidStatusText}>
              {myBid.status === 'ACCEPTED' ? 'Accepted!' : myBid.status === 'REJECTED' ? 'Not selected' : 'Pending'}
            </Text>
          </View>
        )}

        {/* Actions */}
        {!isAccepted && (
          <View style={styles.actionRow}>
            {!hasBid ? (
              <TouchableOpacity style={styles.bidBtn} onPress={() => setBidTarget(item)}>
                <LinearGradient colors={GRADIENTS.primary as any} style={styles.bidBtnGrad}>
                  <Ionicons name="send-outline" size={15} color="#fff" />
                  <Text style={styles.bidBtnText}>Place Bid</Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : myBid.status === 'PENDING' ? (
              <>
                <TouchableOpacity style={styles.updateBtn} onPress={() => setBidTarget(item)}>
                  <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.updateBtnText}>Update Bid</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleWithdraw(item)} disabled={isWithdrawing}>
                  {isWithdrawing
                    ? <ActivityIndicator size="small" color={COLORS.danger} />
                    : <><Ionicons name="close-outline" size={14} color={COLORS.danger} /><Text style={styles.withdrawBtnText}>Withdraw</Text></>
                  }
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        )}

        {/* Accepted — ride was created */}
        {isAccepted && myBid?.status === 'ACCEPTED' && (
          <View style={styles.rideCreatedBanner}>
            <Ionicons name="checkmark-circle" size={15} color={COLORS.secondary} />
            <Text style={styles.rideCreatedText}>Ride created! Check My Rides to manage it.</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientHeader
        colors={GRADIENTS.teal as any}
        title="Passenger Requests"
        subtitle="Browse and bid on schedule requests"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.teal} />
          <Text style={styles.loadingText}>Loading requests...</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={() => loadRequests(true)}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No Open Requests"
              subtitle="No passengers have posted schedule requests yet. Check back soon!"
            />
          }
        />
      )}

      <BidModal
        visible={!!bidTarget}
        request={bidTarget}
        vehicles={vehicles}
        onSubmit={handlePlaceBid}
        onClose={() => setBidTarget(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: COLORS.gray },
  listContent:  { padding: 16, paddingBottom: 100 },

  card:         { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 8 },
  cardHeader:   { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  route:        { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText:     { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeOpen:    { backgroundColor: '#e8f5e9' },
  badgeAccepted:{ backgroundColor: '#e0f2fe' },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  badgeTextOpen:{ color: COLORS.secondary },
  badgeTextAccepted: { color: '#0369a1' },

  passengerRow:        { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  passengerAvatar:     { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary + '20', alignItems: 'center', justifyContent: 'center' },
  passengerAvatarText: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  passengerName:       { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },

  noteRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: COLORS.lightGray, borderRadius: 8, padding: 8, marginBottom: 8 },
  noteText: { flex: 1, fontSize: 12, color: COLORS.gray, fontStyle: 'italic' },

  myBidRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: 8, padding: 8, marginBottom: 8 },
  myBidText:     { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1 },
  bidStatusDot:  { width: 8, height: 8, borderRadius: 4 },
  bidDotPending: { backgroundColor: '#f59e0b' },
  bidDotAccepted:{ backgroundColor: COLORS.secondary },
  bidDotRejected:{ backgroundColor: COLORS.danger },
  bidStatusText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },

  actionRow:      { flexDirection: 'row', gap: 8 },
  bidBtn:         { flex: 1, borderRadius: 10, overflow: 'hidden' },
  bidBtnGrad:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10 },
  bidBtnText:     { fontSize: 14, fontWeight: '700', color: '#fff' },
  updateBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 8 },
  updateBtnText:  { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  withdrawBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.danger + '40', borderRadius: 10, paddingVertical: 8 },
  withdrawBtnText:{ fontSize: 13, fontWeight: '600', color: COLORS.danger },

  rideCreatedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10, marginTop: 6 },
  rideCreatedText:   { fontSize: 13, fontWeight: '600', color: COLORS.secondary, flex: 1 },
});

const bm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  title:      { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  routeBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 16 },
  routeText:  { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  dateText:   { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  label:      { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  optional:   { fontSize: 11, fontWeight: '400', color: COLORS.gray },
  priceInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  totalPreview:{ fontSize: 13, color: COLORS.gray, textAlign: 'center', marginBottom: 4 },
  timeRow:    { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4 },
  timeInput:  { flex: 1, fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  timeHint:   { fontSize: 11, color: COLORS.gray },
  vehicleChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary + '40', marginRight: 8, backgroundColor: '#eff6ff' },
  vehicleChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vehicleChipText:  { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  noteInput:  { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 60, marginBottom: 16 },
  submitBtn:  { borderRadius: 14, overflow: 'hidden' },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
