import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, TextInput, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState, RequestCardSkeleton } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useSocketData } from '../../context/SocketDataContext';
import { scheduleRequestsApi, vehiclesApi } from '../../services/api';

// ─── Bid Modal ────────────────────────────────────────────────────────────────
function BidModal({ visible, request, vehicles, onSubmit, onClose }) {
  const { showToast } = useToast();
  const [price, setPrice]             = useState('');
  const [selectedVehicle, setVehicle] = useState<any>(null);
  const [note, setNote]               = useState('');
  const [submitting, setSubmitting]   = useState(false);

  useEffect(() => {
    if (visible) {
      setPrice(''); setNote('');
      setVehicle(vehicles.find((v: any) => v.isActive) || vehicles[0] || null);
    }
  }, [visible, vehicles]);

  if (!visible || !request) return null;

  const handleSubmit = async () => {
    if (!price || isNaN(Number(price)) || Number(price) < 1) {
      showToast('Please enter a valid price', 'warning'); return;
    }
    if (!selectedVehicle) {
      showToast('Please select a vehicle', 'warning'); return;
    }
    setSubmitting(true);
    await onSubmit({
      pricePerSeat: Number(price),
      vehicleId:    selectedVehicle.id,
      note:         note.trim() || undefined,
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

              {/* Route + departure time from passenger */}
              <View style={bm.routeBox}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={bm.routeText}>{request.fromCity} → {request.toCity}</Text>
                  <Text style={bm.dateText}>{request.date} · {request.seats} seat{request.seats > 1 ? 's' : ''}</Text>
                  {request.departureTime && request.departureTime !== '00:00' && (
                    <View style={bm.timeTag}>
                      <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                      <Text style={bm.timeTagText}>Passenger departs at {request.departureTime}</Text>
                    </View>
                  )}
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
  const {
    openRequests, openRequestsState, loadOpenRequests,
    upsertOwnBid, patchOpenRequest,
    driverCity, setDriverCity,
  } = useSocketData();

  const [refreshing, setRefreshing]     = useState(false);
  const [vehicles, setVehicles]         = useState<any[]>([]);
  const [bidTarget, setBidTarget]       = useState<any>(null);
  const [withdrawing, setWithdrawing]   = useState<string | null>(null);
  const [cityModal, setCityModal]       = useState(false);

  const loadVehicles = useCallback(async () => {
    const { data } = await vehiclesApi.myVehicles();
    if (data?.data) setVehicles(data.data);
  }, []);

  useFocusEffect(useCallback(() => {
    if (!openRequestsState.loaded) loadOpenRequests();
    loadVehicles();
  }, [openRequestsState.loaded]));

  const handleCityChange = useCallback(async (city: string) => {
    setDriverCity(city);
    setCityModal(false);
    await loadOpenRequests(true, city);
  }, []);

  const handlePlaceBid = async (bidData: any) => {
    const { data, error } = await scheduleRequestsApi.placeBid(bidTarget.id, bidData);
    if (error) { showToast(error, 'error'); return; }
    showToast('Bid placed! Waiting for passenger to accept.', 'success');
    setBidTarget(null);
    // Optimistic update; BID_PLACED socket will reconcile with real id
    upsertOwnBid(bidTarget.id, {
      id:           data?.data?.id || 'temp_' + Date.now(),
      status:       'PENDING',
      pricePerSeat: bidData.pricePerSeat,
      departureTime:bidTarget.departureTime,
      vehicleId:    bidData.vehicleId,
      note:         bidData.note,
    });
  };

  const handleWithdraw = (request: any) => {
    const myBid = (request.bids || [])[0];
    if (!myBid) return;
    showModal({
      type: 'danger', title: 'Withdraw Bid?',
      message: `Withdraw your bid of Rs ${myBid.pricePerSeat}/seat for ${request.fromCity} → ${request.toCity}?`,
      confirmText: 'Withdraw', cancelText: 'Keep Bid',
      onConfirm: async () => {
        setWithdrawing(request.id);
        const { error } = await scheduleRequestsApi.withdrawBid(request.id, myBid.id);
        setWithdrawing(null);
        if (error) { showToast(error, 'error'); return; }
        showToast('Bid withdrawn', 'info');
        patchOpenRequest(request.id, { bids: [] });
      },
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOpenRequests(true);
    setRefreshing(false);
  };

  const renderItem = ({ item }: { item: any }) => {
    const myBid         = (item.bids || [])[0];
    const hasBid        = !!myBid;
    const isAccepted    = item.status === 'ACCEPTED';
    const isWithdrawing = withdrawing === item.id;
    const hasTime       = item.departureTime && item.departureTime !== '00:00';

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>{item.fromCity} → {item.toCity}</Text>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
              <Text style={styles.metaText}>{item.date}</Text>
              {hasTime && (
                <>
                  <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                  <Text style={[styles.metaText, { color: COLORS.primary, fontWeight: '700' }]}>{item.departureTime}</Text>
                </>
              )}
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
          <View style={[
            styles.myBidRow,
            myBid.status === 'REJECTED' && styles.myBidRowRejected,
          ]}>
            <Ionicons
              name="pricetag-outline"
              size={14}
              color={myBid.status === 'REJECTED' ? COLORS.danger : COLORS.primary}
            />
            <Text style={[styles.myBidText, myBid.status === 'REJECTED' && { color: COLORS.danger }]}>
              Your bid: Rs {myBid.pricePerSeat}/seat
            </Text>
            <View style={[
              styles.bidStatusDot,
              myBid.status === 'ACCEPTED' ? styles.bidDotAccepted
              : myBid.status === 'REJECTED' ? styles.bidDotRejected
              : styles.bidDotPending
            ]} />
            <Text style={[styles.bidStatusText, myBid.status === 'REJECTED' && { color: COLORS.danger }]}>
              {myBid.status === 'ACCEPTED' ? 'Accepted!' : myBid.status === 'REJECTED' ? 'Declined — bid again?' : 'Pending'}
            </Text>
          </View>
        )}

        {/* Actions */}
        {!isAccepted && (
          <View style={styles.actionRow}>
            {!hasBid || myBid.status === 'REJECTED' ? (
              <TouchableOpacity style={styles.bidBtn} onPress={() => setBidTarget(item)}>
                <LinearGradient colors={GRADIENTS.primary as any} style={styles.bidBtnGrad}>
                  <Ionicons name="send-outline" size={15} color="#fff" />
                  <Text style={styles.bidBtnText}>{myBid?.status === 'REJECTED' ? 'Bid Again' : 'Place Bid'}</Text>
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

      {/* InDrive-style city selector */}
      <TouchableOpacity style={styles.cityBar} onPress={() => setCityModal(true)} activeOpacity={0.8}>
        <View style={styles.cityBarLeft}>
          <View style={styles.cityDot} />
          <View>
            <Text style={styles.cityBarLabel}>Your current city</Text>
            <Text style={styles.cityBarValue}>{driverCity || 'Select city to see requests'}</Text>
          </View>
        </View>
        <View style={styles.changeCityBtn}>
          <Ionicons name="swap-vertical-outline" size={16} color={COLORS.primary} />
          <Text style={styles.changeCityText}>Change</Text>
        </View>
      </TouchableOpacity>

      {!openRequestsState.loaded && openRequestsState.loading ? (
        <View style={{ flex: 1, padding: 16 }}>
          {[1, 2, 3].map(i => <RequestCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={openRequests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={renderItem}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title={driverCity ? `No requests from ${driverCity}` : 'Select your city'}
              subtitle={driverCity
                ? 'No passengers have posted requests from your city yet.'
                : 'Tap "Change" above to set your current city and see nearby requests.'
              }
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

      <CitySearchModal
        visible={cityModal}
        title="Where are you now?"
        onSelect={handleCityChange}
        onClose={() => setCityModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter:{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText:  { fontSize: 14, color: COLORS.gray },
  listContent:  { padding: 16, paddingBottom: 100 },

  // InDrive-style city bar
  cityBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, marginBottom: 4, padding: 14, borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.primary + '30', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
  cityBarLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cityDot:       { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary, borderWidth: 2, borderColor: COLORS.primary + '40' },
  cityBarLabel:  { fontSize: 11, color: COLORS.gray, fontWeight: '500' },
  cityBarValue:  { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginTop: 1 },
  changeCityBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary + '12', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  changeCityText:{ fontSize: 12, fontWeight: '700', color: COLORS.primary },

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

  myBidRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: 8, padding: 8, marginBottom: 8 },
  myBidRowRejected: { backgroundColor: '#fff5f5' },
  myBidText:     { fontSize: 13, fontWeight: '600', color: COLORS.primary, flex: 1 },
  bidStatusDot:  { width: 8, height: 8, borderRadius: 4 },
  bidDotPending: { backgroundColor: COLORS.warning },
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
  timeTag:    { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  timeTagText:{ fontSize: 12, fontWeight: '700', color: COLORS.primary },
  label:      { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  optional:   { fontSize: 11, fontWeight: '400', color: COLORS.gray },
  priceInput: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center', marginBottom: 4 },
  totalPreview:{ fontSize: 13, color: COLORS.gray, textAlign: 'center', marginBottom: 4 },
  vehicleChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.primary + '40', marginRight: 8, backgroundColor: '#eff6ff' },
  vehicleChipActive:{ backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  vehicleChipText:  { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  noteInput:  { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 12, fontSize: 14, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 60, marginBottom: 16 },
  submitBtn:  { borderRadius: 14, overflow: 'hidden' },
  submitGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitText: { fontSize: 16, fontWeight: '800', color: '#fff' },
});
