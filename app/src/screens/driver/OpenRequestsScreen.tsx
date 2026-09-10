import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable,
  ActivityIndicator, TextInput, Modal, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, CURVE, AppBar, EmptyState, RequestCardSkeleton, Avatar, RouteTag, PrimaryButton } from '../../components';
import CitySearchModal from '../../components/CitySearchModal';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useSocketData } from '../../context/SocketDataContext';
import { scheduleRequestsApi, vehiclesApi } from '../../services/api';

// ─── Offer Modal ───────────────────────────────────────────────────────────────
function OfferModal({ visible, request, vehicles, onSubmit, onClose, onAddVehicle }) {
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
    const errorMsg = await onSubmit({
      pricePerSeat: Number(price),
      vehicleId:    selectedVehicle.id,
      note:         note.trim() || undefined,
    });
    setSubmitting(false);
    if (errorMsg) {
      Alert.alert('Could Not Send Offer', errorMsg, [{ text: 'OK' }]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={bm.overlay} onPress={onClose}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ justifyContent: 'flex-end', flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Pressable>
            <View style={bm.sheet}>
              <View style={bm.handle} />
              <Text style={bm.title}>Make an Offer</Text>

              {/* Route + departure time from passenger */}
              <View style={bm.routeBox}>
                <Ionicons name="navigate-outline" size={16} color={COLORS.primary} />
                <View style={{ flex: 1 }}>
                  <RouteTag from={request.fromCity} to={request.toCity} textStyle={bm.routeText} />
                  <Text style={bm.dateText}>{request.date} · {request.seats} seat{request.seats > 1 ? 's' : ''}</Text>
                  {request.departureTime && request.departureTime !== '00:00' && (
                    <View style={bm.timeTag}>
                      <Ionicons name="time-outline" size={12} color={COLORS.primary} />
                      <Text style={bm.timeTagText}>Passenger departs at {request.departureTime}</Text>
                    </View>
                  )}
                  {!!request.fromAddress && (
                    <View style={bm.timeTag}>
                      <Ionicons name="location-outline" size={12} color={COLORS.primary} />
                      <Text style={bm.timeTagText} numberOfLines={1}>{request.fromAddress}</Text>
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

              {/* No vehicle — give a clear path instead of a dead-end */}
              {vehicles.length === 0 && (
                <View style={bm.noVehicleBox}>
                  <Ionicons name="car-outline" size={22} color={COLORS.primary} />
                  <Text style={bm.noVehicleText}>Add a vehicle first, then you can make offers.</Text>
                  <Pressable style={bm.addVehicleBtn} onPress={() => { onClose(); onAddVehicle?.(); }}>
                    <Ionicons name="add-circle-outline" size={16} color="#fff" />
                    <Text style={bm.addVehicleBtnText}>Add a Vehicle</Text>
                  </Pressable>
                </View>
              )}

              {/* Vehicle picker */}
              {vehicles.length > 0 && (
                <>
                  <Text style={[bm.label, { marginTop: 14 }]}>Select Vehicle</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {vehicles.map((v: any) => (
                      <Pressable
                        key={v.id}
                        style={[bm.vehicleChip, selectedVehicle?.id === v.id && bm.vehicleChipActive]}
                        onPress={() => setVehicle(v)}
                      >
                        <Ionicons name="car-outline" size={14} color={selectedVehicle?.id === v.id ? '#fff' : COLORS.primary} />
                        <Text style={[bm.vehicleChipText, selectedVehicle?.id === v.id && { color: '#fff' }]}>
                          {v.brand} {v.model}
                        </Text>
                      </Pressable>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Note */}
              <Text style={bm.label}>Note <Text style={bm.optional}>(optional)</Text></Text>
              <TextInput
                style={bm.noteInput}
                placeholder="E.g. Can pick you up 10 mins early if that works"
                placeholderTextColor={COLORS.gray}
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={2}
                maxLength={150}
              />

              {vehicles.length > 0 && (
                <PrimaryButton
                  title="Submit Offer"
                  icon="send-outline"
                  onPress={handleSubmit}
                  loading={submitting}
                  disabled={!price}
                  style={bm.submitBtn}
                />
              )}
            </View>
          </Pressable>
        </ScrollView>
      </Pressable>
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
  const [dismissed, setDismissed]       = useState<Set<string>>(new Set());

  const visibleRequests = openRequests.filter(r => !dismissed.has(r.id));

  const loadVehicles = useCallback(async () => {
    const { data } = await vehiclesApi.myVehicles();
    if (data?.data) setVehicles(data.data);
  }, []);

  useFocusEffect(useCallback(() => {
    loadOpenRequests();
    loadVehicles();
  }, [loadOpenRequests, loadVehicles]));

  const handleCityChange = useCallback(async (city: string) => {
    setDriverCity(city);
    setCityModal(false);
    await loadOpenRequests(true, city);
  }, []);

  const handlePlaceBid = async (bidData: any): Promise<string | undefined> => {
    const { data, error } = await scheduleRequestsApi.placeBid(bidTarget.id, bidData);
    if (error) return error;
    showToast('Offer sent! Waiting for passenger to accept.', 'success');
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
      type: 'danger', title: 'Withdraw Offer?',
      message: `Withdraw your offer of Rs ${myBid.pricePerSeat}/seat for ${request.fromCity} > ${request.toCity}?`,
      confirmText: 'Withdraw', cancelText: 'Keep Offer',
      onConfirm: async () => {
        setWithdrawing(request.id);
        const { error } = await scheduleRequestsApi.withdrawBid(request.id, myBid.id);
        setWithdrawing(null);
        if (error) { showToast(error, 'error'); return; }
        showToast('Offer withdrawn', 'info');
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
          <View style={styles.metaRow}>
            {hasTime && (
              <Text style={styles.metaText}>{item.departureTime} · </Text>
            )}
            <Text style={styles.metaText}>{item.date}</Text>
          </View>
          <View style={[styles.badge, isAccepted ? styles.badgeAccepted : styles.badgeOpen]}>
            <Text style={[styles.badgeText, isAccepted ? styles.badgeTextAccepted : styles.badgeTextOpen]}>
              {isAccepted ? 'Accepted' : 'Open'}
            </Text>
          </View>
        </View>

        <RouteTag from={item.fromCity} to={item.toCity} textStyle={styles.route} />

        {/* Passenger */}
        <View style={styles.passengerRow}>
          <Avatar name={item.passenger?.name || 'P'} uri={item.passenger?.avatar} size={32} />
          <Text style={styles.passengerName}>{item.passenger?.name || 'Passenger'}</Text>
          {item.passenger?.rating > 0 && (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.ratingText}>{item.passenger.rating}</Text>
            </View>
          )}
          <Text style={styles.seatsInline}>{item.seats} seat{item.seats > 1 ? 's' : ''}</Text>
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
              Your offer: Rs {myBid.pricePerSeat}/seat
            </Text>
            <View style={[
              styles.bidStatusDot,
              myBid.status === 'ACCEPTED' ? styles.bidDotAccepted
              : myBid.status === 'REJECTED' ? styles.bidDotRejected
              : styles.bidDotPending
            ]} />
            <Text style={[styles.bidStatusText, myBid.status === 'REJECTED' && { color: COLORS.danger }]}>
              {myBid.status === 'ACCEPTED' ? 'Accepted' : myBid.status === 'REJECTED' ? 'Declined, try a new offer?' : 'Pending'}
            </Text>
          </View>
        )}

        {/* Actions */}
        {!isAccepted && (
          <View style={styles.actionRow}>
            {!hasBid || myBid.status === 'REJECTED' ? (
              <>
                {!hasBid && (
                  <Pressable style={styles.declineBtn} onPress={() => setDismissed(prev => new Set(prev).add(item.id))}>
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </Pressable>
                )}
                <Pressable style={styles.bidBtn} onPress={() => setBidTarget(item)}>
                  <Text style={styles.bidBtnText}>{myBid?.status === 'REJECTED' ? 'Offer Again' : 'Accept'}</Text>
                </Pressable>
              </>
            ) : myBid.status === 'PENDING' ? (
              <>
                <Pressable style={styles.updateBtn} onPress={() => setBidTarget(item)}>
                  <Ionicons name="create-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.updateBtnText}>Update Offer</Text>
                </Pressable>
                <Pressable style={styles.withdrawBtn} onPress={() => handleWithdraw(item)} disabled={isWithdrawing}>
                  {isWithdrawing
                    ? <ActivityIndicator size="small" color={COLORS.danger} />
                    : <><Ionicons name="close-outline" size={14} color={COLORS.danger} /><Text style={styles.withdrawBtnText}>Withdraw</Text></>
                  }
                </Pressable>
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
      <AppBar
        title="Open Requests"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        rightIcon="funnel-outline"
        onRightPress={() => setCityModal(true)}
      />

      {/* Current city (tap the filter icon above to change) */}
      {driverCity ? (
        <View style={styles.cityHint}>
          <Ionicons name="location" size={13} color={COLORS.primary} />
          <Text style={styles.cityHintText}>Showing requests near {driverCity}</Text>
        </View>
      ) : (
        <Pressable style={styles.cityBar} onPress={() => setCityModal(true)}>
          <View style={styles.cityBarLeft}>
            <View style={styles.cityDot} />
            <Text style={styles.cityBarValue}>Select your city to see requests</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
        </Pressable>
      )}

      {!openRequestsState.loaded && openRequestsState.loading ? (
        <View style={{ flex: 1, padding: 16 }}>
          {[1, 2, 3].map(i => <RequestCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={visibleRequests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={renderItem}
          ListEmptyComponent={
            openRequestsState.error ? (
              <EmptyState
                icon="calendar-outline"
                title="Couldn't load requests"
                subtitle="Check your internet and try again."
                action={{ label: 'Try Again', onPress: () => loadOpenRequests(true) }}
  />
            ) : (
              <EmptyState
                icon="calendar-outline"
                title={driverCity ? `No Requests from ${driverCity}` : 'Select Your City'}
                subtitle={driverCity
                  ? 'Try widening your search or check back later.'
                  : 'Pick your city to see requests near you.'
                }
              />
            )
          }
        />
      )}

      <OfferModal
        visible={!!bidTarget}
        request={bidTarget}
        vehicles={vehicles}
        onSubmit={handlePlaceBid}
        onClose={() => setBidTarget(null)}
        onAddVehicle={() => navigation.navigate('MyVehiclesTab', { screen: 'VehicleSetup' })}
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
  listContent:  { padding: 16, paddingBottom: 32 },

  // City filter hint / selector
  cityHint:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, marginTop: 12, marginBottom: 4 },
  cityHintText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  cityBar:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.cardBg, marginHorizontal: 16, marginTop: 12, marginBottom: 4, padding: 14, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border },
  cityBarLeft:   { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  cityDot:       { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  cityBarValue:  { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },

  card:         { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  route:        { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  metaRow:      { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText:     { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  badge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeOpen:    { backgroundColor: '#e8f5e9' },
  badgeAccepted:{ backgroundColor: '#e0f2fe' },
  badgeText:    { fontSize: 11, fontWeight: '700' },
  badgeTextOpen:{ color: COLORS.secondary },
  badgeTextAccepted: { color: '#0369a1' },

  passengerRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  passengerName: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText:    { fontSize: 12, fontWeight: '700', color: COLORS.textPrimary },
  seatsInline:   { fontSize: 12, color: COLORS.textSecondary, marginLeft: 'auto' },

  noteRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: COLORS.lightGray, borderRadius: 8, padding: 8, marginBottom: 8 },
  noteText: { flex: 1, fontSize: 12, color: COLORS.gray, fontStyle: 'italic' },

  myBidRow:         { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: 8, padding: 8, marginBottom: 8 },
  myBidRowRejected: { backgroundColor: '#fff5f5' },
  myBidText:     { fontSize: 13, fontWeight: '700', color: COLORS.primary, flex: 1 },
  bidStatusDot:  { width: 8, height: 8, borderRadius: 4 },
  bidDotPending: { backgroundColor: COLORS.warning },
  bidDotAccepted:{ backgroundColor: COLORS.secondary },
  bidDotRejected:{ backgroundColor: COLORS.danger },
  bidStatusText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },

  actionRow:      { flexDirection: 'row', gap: 8 },
  declineBtn:     { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, paddingVertical: 10 },
  declineBtnText: { fontSize: 14, fontWeight: '700', color: COLORS.textSecondary },
  bidBtn:         { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10 },
  bidBtnText:     { fontSize: 14, fontWeight: '700', color: COLORS.white },
  updateBtn:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 8 },
  updateBtnText:  { fontSize: 13, fontWeight: '600', color: COLORS.primary },
  withdrawBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.danger + '40', borderRadius: 10, paddingVertical: 8 },
  withdrawBtnText:{ fontSize: 13, fontWeight: '600', color: COLORS.danger },

  rideCreatedBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 10, padding: 10, marginTop: 6 },
  rideCreatedText:   { fontSize: 13, fontWeight: '400', color: COLORS.secondary, flex: 1 },
});

const bm = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet:      { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },
  title:      { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 16 },
  routeBox:   { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, marginBottom: 16 },
  routeText:  { fontSize: 14, fontWeight: '700', color: COLORS.primary },
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
  noVehicleBox: { alignItems: 'center', gap: 10, backgroundColor: COLORS.primary + '0d', borderRadius: 14, padding: 18, marginVertical: 14 },
  noVehicleText: { fontSize: 13, color: COLORS.textPrimary, textAlign: 'center', lineHeight: 19 },
  addVehicleBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  addVehicleBtnText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  submitBtn: { marginTop: 4 },
});

