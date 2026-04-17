import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  Modal, ScrollView, Image, Dimensions, Animated, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useSocketData } from '../../context/SocketDataContext';
import { scheduleRequestsApi } from '../../services/api';

const { width: SW } = Dimensions.get('window');

const STATUS_CONFIG: any = {
  OPEN:      { color: COLORS.secondary, bg: '#e8f5e9', label: 'Open' },
  ACCEPTED:  { color: '#0369a1',        bg: '#e0f2fe', label: 'Accepted' },
  CANCELLED: { color: COLORS.danger,    bg: '#fef2f2', label: 'Cancelled' },
  EXPIRED:   { color: '#9a3412',        bg: '#fef2f2', label: 'Expired' },
};

const AMENITY_MAP = [
  { key: 'ac',          icon: 'snow-outline',           color: '#0ea5e9', label: 'A/C' },
  { key: 'wifi',        icon: 'wifi-outline',           color: '#6366f1', label: 'WiFi' },
  { key: 'music',       icon: 'musical-notes-outline',  color: '#ec4899', label: 'Music' },
  { key: 'usbCharging', icon: 'flash-outline',          color: '#f59e0b', label: 'USB' },
  { key: 'waterCooler', icon: 'water-outline',          color: '#06b6d4', label: 'Water' },
  { key: 'blanket',     icon: 'bed-outline',            color: '#8b5cf6', label: 'Blanket' },
  { key: 'firstAid',   icon: 'medkit-outline',         color: '#ef4444', label: 'First Aid' },
  { key: 'luggageRack', icon: 'briefcase-outline',      color: '#64748b', label: 'Luggage' },
];

// ─── Vehicle Details Modal ────────────────────────────────────────────────────
function VehicleDetailsModal({ visible, vehicle, driver, onClose }: any) {
  const [imgIdx, setImgIdx] = useState(0);
  if (!visible || !vehicle) return null;

  const images    = vehicle.images || [];
  const amenities = AMENITY_MAP.filter(a => vehicle[a.key]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={vm.overlay}>
        <View style={vm.sheet}>
          {/* Handle */}
          <View style={vm.handleWrap}>
            <View style={vm.handle} />
          </View>

          {/* Gradient header with driver info */}
          <LinearGradient colors={GRADIENTS.primary as any} style={vm.header}>
            <View style={vm.headerContent}>
              <View style={vm.avatarRing}>
                <View style={vm.avatarInner}>
                  <Text style={vm.avatarText}>{driver?.name?.[0] || 'D'}</Text>
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={vm.driverName}>{driver?.name || 'Driver'}</Text>
                {driver?.rating > 0 ? (
                  <View style={vm.ratingRow}>
                    <Ionicons name="star" size={13} color="#fbbf24" />
                    <Text style={vm.ratingText}>{driver.rating} · {driver.reviewCount} reviews</Text>
                  </View>
                ) : (
                  <Text style={vm.noRatingText}>No reviews yet</Text>
                )}
              </View>
              <TouchableOpacity onPress={onClose} style={vm.closeBtn}>
                <Ionicons name="close" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Vehicle name strip */}
            <View style={vm.vehicleNameStrip}>
              <Ionicons name="car-sport-outline" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={vm.vehicleNameText}>{vehicle.brand} {vehicle.model}</Text>
              {vehicle.color ? <Text style={vm.vehicleColorDot}>· {vehicle.color}</Text> : null}
            </View>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            {/* Image gallery */}
            {images.length > 0 ? (
              <View style={vm.galleryWrapper}>
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / SW))}>
                  {images.map((uri: string, i: number) => (
                    <Image key={i} source={{ uri }} style={[vm.galleryImg, { width: SW }]} resizeMode="cover" />
                  ))}
                </ScrollView>
                {images.length > 1 && (
                  <View style={vm.dotsRow}>
                    {images.map((_: any, i: number) => (
                      <View key={i} style={[vm.dot, i === imgIdx && vm.dotActive]} />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={vm.imgPlaceholder}>
                <LinearGradient colors={['#e0f2fe', '#bfdbfe']} style={vm.imgPlaceholderGrad}>
                  <Ionicons name="car-outline" size={52} color={COLORS.primary + '60'} />
                  <Text style={vm.imgPlaceholderText}>No photos available</Text>
                </LinearGradient>
              </View>
            )}

            {/* Specs grid */}
            <View style={vm.section}>
              <Text style={vm.sectionTitle}>Vehicle Details</Text>
              <View style={vm.specsGrid}>
                <View style={vm.specCard}>
                  <LinearGradient colors={['#eff6ff', '#dbeafe']} style={vm.specCardGrad}>
                    <Ionicons name="car-sport-outline" size={22} color={COLORS.primary} />
                    <Text style={vm.specLabel}>Type</Text>
                    <Text style={vm.specValue}>{vehicle.type}</Text>
                  </LinearGradient>
                </View>
                <View style={vm.specCard}>
                  <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={vm.specCardGrad}>
                    <Ionicons name="people-outline" size={22} color={COLORS.secondary} />
                    <Text style={vm.specLabel}>Capacity</Text>
                    <Text style={vm.specValue}>{vehicle.totalSeats} seats</Text>
                  </LinearGradient>
                </View>
                {vehicle.plateNumber && (
                  <View style={vm.specCard}>
                    <LinearGradient colors={['#fefce8', '#fef9c3']} style={vm.specCardGrad}>
                      <Ionicons name="id-card-outline" size={22} color="#ca8a04" />
                      <Text style={vm.specLabel}>Plate</Text>
                      <Text style={vm.specValue}>{vehicle.plateNumber}</Text>
                    </LinearGradient>
                  </View>
                )}
                {vehicle.color && (
                  <View style={vm.specCard}>
                    <LinearGradient colors={['#fdf4ff', '#fae8ff']} style={vm.specCardGrad}>
                      <Ionicons name="color-palette-outline" size={22} color="#a855f7" />
                      <Text style={vm.specLabel}>Color</Text>
                      <Text style={vm.specValue}>{vehicle.color}</Text>
                    </LinearGradient>
                  </View>
                )}
              </View>
            </View>

            {/* Amenities */}
            {amenities.length > 0 && (
              <View style={vm.section}>
                <Text style={vm.sectionTitle}>Amenities</Text>
                <View style={vm.amenitiesGrid}>
                  {amenities.map(a => (
                    <View key={a.key} style={[vm.amenityChip, { backgroundColor: a.color + '14', borderColor: a.color + '35' }]}>
                      <View style={[vm.amenityIconWrap, { backgroundColor: a.color + '20' }]}>
                        <Ionicons name={a.icon as any} size={18} color={a.color} />
                      </View>
                      <Text style={[vm.amenityLabel, { color: a.color }]}>{a.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Pulsing live dot indicator ───────────────────────────────────────────────
function LiveDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1,   duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <View style={liveDotStyles.wrap}>
      <Animated.View style={[liveDotStyles.ring, { transform: [{ scale }], opacity }]} />
      <View style={liveDotStyles.core} />
    </View>
  );
}
const liveDotStyles = StyleSheet.create({
  wrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: COLORS.primary + '30' },
  core: { width: 8,  height: 8,  borderRadius: 4, backgroundColor: COLORS.primary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyRequestsScreen({ navigation }) {
  const { showToast }  = useToast();
  const { showModal }  = useGlobalModal();
  const { myRequests, myRequestsState, loadMyRequests, removeRequest, patchRequest } = useSocketData();

  const [refreshing, setRefreshing]         = useState(false);
  const [actionBidId, setActionBidId]       = useState<string | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<{ vehicle: any; driver: any } | null>(null);

  // Load once on first focus; socket keeps it live
  useFocusEffect(useCallback(() => {
    if (!myRequestsState.loaded) loadMyRequests();
  }, [myRequestsState.loaded]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyRequests(true);
    setRefreshing(false);
  };

  const handleCancel = (req: any) => {
    showModal({
      type: 'danger', title: 'Cancel Request?',
      message: `Cancel your ${req.fromCity} → ${req.toCity} request on ${req.date}? All pending bids will be removed.`,
      confirmText: 'Yes, Cancel', cancelText: 'No',
      onConfirm: async () => {
        const { error } = await scheduleRequestsApi.cancel(req.id);
        if (error) { showToast(error, 'error'); return; }
        showToast('Request cancelled', 'info');
        removeRequest(req.id);
      },
    });
  };

  const handleAccept = (req: any, bid: any) => {
    showModal({
      type: 'primary', title: 'Accept Bid?',
      message: `Accept ${bid.driver?.name}'s offer of Rs ${bid.pricePerSeat}/seat for ${req.fromCity} → ${req.toCity}?\n\nA ride will be auto-created and your seat confirmed.`,
      confirmText: 'Accept & Book', cancelText: 'Not Now', icon: 'checkmark-circle-outline',
      onConfirm: async () => {
        const { data, error } = await scheduleRequestsApi.acceptBid(req.id, bid.id);
        if (error) { showToast(error, 'error'); return; }
        removeRequest(req.id);
        const rideData = {
          ...(data?.data ?? {}),
          from:     req.fromCity,
          to:       req.toCity,
          driver:   bid.driver,
          vehicle:  bid.vehicle,
          pricePerSeat: bid.pricePerSeat,
        };
        navigation.navigate('BookingConfirm', {
          rideId:   rideData.id,
          seats:    req.seats,
          rideData,
        });
      },
    });
  };

  const handleReject = async (req: any, bid: any) => {
    setActionBidId(bid.id);
    const { error } = await scheduleRequestsApi.rejectBid(req.id, bid.id);
    setActionBidId(null);
    if (error) { showToast(error, 'error'); return; }
    showToast('Bid rejected', 'info');
    // SocketListener will update context via BID_REJECTED; remove optimistically too
    patchRequest(req.id, {
      bids: (req.bids || []).filter((b: any) => b.id !== bid.id),
    });
  };

  const isInitialLoad = !myRequestsState.loaded && myRequestsState.loading;

  const renderRequest = ({ item: req }: any) => {
    const sc          = STATUS_CONFIG[req.status] || STATUS_CONFIG.OPEN;
    const pendingBids = (req.bids || []).filter((b: any) => b.status === 'PENDING');
    const acceptedBid = (req.bids || []).find((b: any) => b.status === 'ACCEPTED');
    const hasTime     = req.departureTime && req.departureTime !== '00:00';

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.route}>{req.fromCity} → {req.toCity}</Text>
            <View style={styles.meta}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.gray} />
              <Text style={styles.metaText}>{req.date}</Text>
              {hasTime && (
                <>
                  <Ionicons name="time-outline" size={13} color={COLORS.primary} />
                  <Text style={[styles.metaText, { color: COLORS.primary, fontWeight: '700' }]}>{req.departureTime}</Text>
                </>
              )}
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
            <View style={styles.bidsSectionHeader}>
              <Ionicons name="pricetags-outline" size={14} color={COLORS.primary} />
              <Text style={styles.bidsSectionTitle}>
                {pendingBids.length} Bid{pendingBids.length > 1 ? 's' : ''} Received
              </Text>
            </View>

            {pendingBids.map((bid: any) => {
              const isActioning = !!actionBidId;
              const isThisBid   = actionBidId === bid.id;

              return (
                <View key={bid.id} style={styles.bidCard}>
                  {/* Driver + Price row */}
                  <View style={styles.bidTopRow}>
                    <View style={styles.bidAvatar}>
                      <Text style={styles.bidAvatarText}>{bid.driver?.name?.[0] || 'D'}</Text>
                    </View>
                    <View style={styles.bidDriverInfo}>
                      <Text style={styles.bidDriver}>{bid.driver?.name || 'Driver'}</Text>
                      {bid.driver?.rating > 0 && (
                        <View style={styles.ratingRow}>
                          <Ionicons name="star" size={11} color="#f59e0b" />
                          <Text style={styles.ratingText}>{bid.driver.rating} · {bid.driver.reviewCount} reviews</Text>
                        </View>
                      )}
                      {bid.vehicle && (
                        <Text style={styles.bidVehicle}>{bid.vehicle.brand} {bid.vehicle.model} · {bid.vehicle.type}</Text>
                      )}
                    </View>
                    <View style={styles.bidPriceBox}>
                      <Text style={styles.bidPrice}>Rs {bid.pricePerSeat}</Text>
                      <Text style={styles.bidPriceLabel}>per seat</Text>
                      <Text style={styles.bidTotal}>Total Rs {bid.pricePerSeat * req.seats}</Text>
                    </View>
                  </View>

                  {/* Note */}
                  {bid.note ? (
                    <View style={styles.bidNoteRow}>
                      <Ionicons name="chatbubble-ellipses-outline" size={12} color={COLORS.gray} />
                      <Text style={styles.bidNote}>"{bid.note}"</Text>
                    </View>
                  ) : null}

                  {/* Vehicle detail chip */}
                  {bid.vehicle && (
                    <TouchableOpacity
                      style={styles.vehicleChip}
                      onPress={() => setVehicleDetails({ vehicle: bid.vehicle, driver: bid.driver })}
                      disabled={isActioning}
                    >
                      <Ionicons name="car-outline" size={13} color={COLORS.primary} />
                      <Text style={styles.vehicleChipText}>View Vehicle Details</Text>
                      <Ionicons name="chevron-forward" size={13} color={COLORS.primary + '80'} />
                    </TouchableOpacity>
                  )}

                  {/* Action buttons */}
                  <View style={styles.bidActions}>
                    <TouchableOpacity
                      style={[styles.rejectBtn, isActioning && { opacity: 0.45 }]}
                      onPress={() => handleReject(req, bid)}
                      disabled={isActioning}
                    >
                      {isThisBid
                        ? <ActivityIndicator size="small" color={COLORS.danger} />
                        : <><Ionicons name="close" size={15} color={COLORS.danger} /><Text style={styles.rejectBtnText}>Decline</Text></>
                      }
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.acceptBtnWrap, isActioning && { opacity: 0.45 }]}
                      onPress={() => handleAccept(req, bid)}
                      disabled={isActioning}
                    >
                      <LinearGradient colors={GRADIENTS.primary as any} style={styles.acceptBtnGrad}>
                        <Ionicons name="checkmark-circle" size={15} color="#fff" />
                        <Text style={styles.acceptBtnText}>Accept & Book</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Waiting */}
        {req.status === 'OPEN' && pendingBids.length === 0 && !acceptedBid && (
          <View style={styles.waitingRow}>
            <LiveDot />
            <View style={{ flex: 1 }}>
              <Text style={styles.waitingText}>Listening for driver bids</Text>
              <Text style={styles.waitingSubText}>Drivers will see your request and place offers</Text>
            </View>
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

      {isInitialLoad ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={myRequests}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={onRefresh}
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

      <VehicleDetailsModal
        visible={!!vehicleDetails}
        vehicle={vehicleDetails?.vehicle}
        driver={vehicleDetails?.driver}
        onClose={() => setVehicleDetails(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: COLORS.bg },
  loadingCenter:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list:             { padding: 16, paddingBottom: 100 },

  card:             { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 14, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10 },
  cardHeader:       { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  route:            { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  meta:             { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText:         { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  noteText:         { fontSize: 12, color: COLORS.gray, fontStyle: 'italic', marginTop: 4 },
  statusBadge:      { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText:  { fontSize: 11, fontWeight: '800' },

  acceptedBanner:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e8f5e9', borderRadius: 12, padding: 12, marginBottom: 10 },
  acceptedText:     { fontSize: 13, fontWeight: '600', color: COLORS.secondary, flex: 1 },

  bidsSection:      { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 14, marginTop: 4 },
  bidsSectionHeader:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  bidsSectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },

  // ── Bid card ──────────────────────────────────────────────────────────────
  bidCard:          { backgroundColor: '#f8fafc', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },

  bidTopRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  bidAvatar:        { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  bidAvatarText:    { fontSize: 17, fontWeight: '800', color: '#fff' },
  bidDriverInfo:    { flex: 1 },
  bidDriver:        { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },
  ratingRow:        { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  ratingText:       { fontSize: 11, color: '#f59e0b', fontWeight: '600' },
  bidVehicle:       { fontSize: 11, color: COLORS.gray, marginTop: 3 },

  bidPriceBox:      { alignItems: 'flex-end', flexShrink: 0 },
  bidPrice:         { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  bidPriceLabel:    { fontSize: 10, color: COLORS.gray, marginTop: 1 },
  bidTotal:         { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginTop: 2 },

  bidNoteRow:       { flexDirection: 'row', alignItems: 'flex-start', gap: 6, backgroundColor: '#fff', borderRadius: 8, padding: 8, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  bidNote:          { flex: 1, fontSize: 12, color: COLORS.gray, fontStyle: 'italic' },

  vehicleChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 10, borderWidth: 1, borderColor: COLORS.primary + '25' },
  vehicleChipText:  { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.primary },

  // ── Action buttons ────────────────────────────────────────────────────────
  bidActions:       { flexDirection: 'row', gap: 8 },
  rejectBtn:        { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderWidth: 1.5, borderColor: COLORS.danger + '40', borderRadius: 12, paddingVertical: 10, backgroundColor: '#fff5f5' },
  rejectBtnText:    { fontSize: 13, fontWeight: '700', color: COLORS.danger },
  acceptBtnWrap:    { flex: 2, borderRadius: 12, overflow: 'hidden' },
  acceptBtnGrad:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 11 },
  acceptBtnText:    { fontSize: 13, fontWeight: '800', color: '#fff' },

  // ── Footer ────────────────────────────────────────────────────────────────
  waitingRow:       { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f0f7ff', borderRadius: 12, padding: 12, marginTop: 4 },
  waitingText:      { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  waitingSubText:   { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  cancelBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.border },
  cancelBtnText:    { fontSize: 13, fontWeight: '600', color: COLORS.danger },
});

// ─── Vehicle Details Modal Styles ─────────────────────────────────────────────
const vm = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '94%', overflow: 'hidden' },
  handleWrap:    { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, alignItems: 'center', paddingTop: 10 },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.5)' },

  // Header
  header:        { paddingTop: 28, paddingBottom: 20, paddingHorizontal: 20 },
  headerContent: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  avatarRing:    { width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' },
  avatarInner:   { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarText:    { fontSize: 22, fontWeight: '900', color: '#fff' },
  driverName:    { fontSize: 18, fontWeight: '900', color: '#fff' },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText:    { fontSize: 13, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  noRatingText:  { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  closeBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  vehicleNameStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  vehicleNameText:  { fontSize: 15, fontWeight: '800', color: '#fff', flex: 1 },
  vehicleColorDot:  { fontSize: 13, color: 'rgba(255,255,255,0.8)' },

  // Gallery
  galleryWrapper:{ position: 'relative' },
  galleryImg:    { height: 220 },
  dotsRow:       { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 10, backgroundColor: '#f8fafc' },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive:     { backgroundColor: COLORS.primary, width: 20, borderRadius: 3 },
  imgPlaceholder:{ },
  imgPlaceholderGrad: { height: 160, alignItems: 'center', justifyContent: 'center', gap: 10 },
  imgPlaceholderText: { fontSize: 13, color: COLORS.primary + '80', fontWeight: '600' },

  // Sections
  section:       { paddingHorizontal: 20, paddingTop: 20 },
  sectionTitle:  { fontSize: 13, fontWeight: '800', color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 },

  // Specs grid
  specsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  specCard:      { flex: 1, minWidth: '43%', borderRadius: 14, overflow: 'hidden' },
  specCardGrad:  { padding: 14, alignItems: 'center', gap: 6 },
  specLabel:     { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.5 },
  specValue:     { fontSize: 14, fontWeight: '900', color: COLORS.textPrimary },

  // Amenities
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  amenityIconWrap:{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  amenityLabel:  { fontSize: 12, fontWeight: '700' },
});
