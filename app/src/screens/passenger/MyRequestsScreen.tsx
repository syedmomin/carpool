import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
  Modal, ScrollView, Image, Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, GradientHeader, EmptyState } from '../../components';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { scheduleRequestsApi } from '../../services/api';
import { socketService } from '../../services/socket.service';

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

  const images   = vehicle.images || [];
  const amenities = AMENITY_MAP.filter(a => vehicle[a.key]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={vm.overlay}>
        <View style={vm.sheet}>
          {/* Handle */}
          <View style={vm.handle} />

          {/* Driver info header */}
          <View style={vm.driverRow}>
            <View style={vm.driverAvatar}>
              <Text style={vm.driverAvatarText}>{driver?.name?.[0] || 'D'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={vm.driverName}>{driver?.name || 'Driver'}</Text>
              {driver?.rating > 0 && (
                <View style={vm.ratingRow}>
                  <Ionicons name="star" size={13} color="#f59e0b" />
                  <Text style={vm.ratingText}>{driver.rating} ({driver.reviewCount} reviews)</Text>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={vm.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Image gallery */}
            {images.length > 0 ? (
              <View style={vm.galleryWrapper}>
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
                  onMomentumScrollEnd={e => setImgIdx(Math.round(e.nativeEvent.contentOffset.x / (SW - 48)))}>
                  {images.map((uri: string, i: number) => (
                    <Image key={i} source={{ uri }} style={[vm.galleryImg, { width: SW - 48 }]} resizeMode="cover" />
                  ))}
                </ScrollView>
                {images.length > 1 && (
                  <View style={vm.dots}>
                    {images.map((_: any, i: number) => (
                      <View key={i} style={[vm.dot, i === imgIdx && vm.dotActive]} />
                    ))}
                  </View>
                )}
              </View>
            ) : (
              <View style={vm.imgPlaceholder}>
                <Ionicons name="car-outline" size={48} color={COLORS.border} />
                <Text style={vm.imgPlaceholderText}>No photos</Text>
              </View>
            )}

            {/* Vehicle specs */}
            <View style={vm.specsGrid}>
              <View style={vm.specItem}>
                <Ionicons name="car-sport-outline" size={18} color={COLORS.primary} />
                <Text style={vm.specLabel}>Type</Text>
                <Text style={vm.specValue}>{vehicle.type}</Text>
              </View>
              <View style={vm.specItem}>
                <Ionicons name="people-outline" size={18} color={COLORS.primary} />
                <Text style={vm.specLabel}>Seats</Text>
                <Text style={vm.specValue}>{vehicle.totalSeats}</Text>
              </View>
              {vehicle.color && (
                <View style={vm.specItem}>
                  <Ionicons name="color-palette-outline" size={18} color={COLORS.primary} />
                  <Text style={vm.specLabel}>Color</Text>
                  <Text style={vm.specValue}>{vehicle.color}</Text>
                </View>
              )}
              {vehicle.plateNumber && (
                <View style={vm.specItem}>
                  <Ionicons name="id-card-outline" size={18} color={COLORS.primary} />
                  <Text style={vm.specLabel}>Plate</Text>
                  <Text style={vm.specValue}>{vehicle.plateNumber}</Text>
                </View>
              )}
            </View>

            {/* Amenities */}
            {amenities.length > 0 && (
              <View style={vm.amenitiesSection}>
                <Text style={vm.amenitiesTitle}>Amenities</Text>
                <View style={vm.amenitiesGrid}>
                  {amenities.map(a => (
                    <View key={a.key} style={[vm.amenityChip, { backgroundColor: a.color + '12', borderColor: a.color + '30' }]}>
                      <Ionicons name={a.icon as any} size={16} color={a.color} />
                      <Text style={[vm.amenityLabel, { color: a.color }]}>{a.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Full name banner */}
            <View style={vm.nameBanner}>
              <Text style={vm.nameBannerText}>{vehicle.brand} {vehicle.model}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function MyRequestsScreen({ navigation }) {
  const { showToast }  = useToast();
  const { showModal }  = useGlobalModal();

  const [requests, setRequests]             = useState<any[]>([]);
  const [loading, setLoading]               = useState(false);
  const [refreshing, setRefreshing]         = useState(false);
  const [vehicleDetails, setVehicleDetails] = useState<{ vehicle: any; driver: any } | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    const { data } = await scheduleRequestsApi.getMine();
    isRefresh ? setRefreshing(false) : setLoading(false);
    if (data?.data) setRequests(data.data);
  }, []);

  useFocusEffect(useCallback(() => {
    load();

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
      type: 'danger', title: 'Cancel Request?',
      message: `Cancel your ${req.fromCity} → ${req.toCity} request on ${req.date}? All pending bids will be removed.`,
      confirmText: 'Yes, Cancel', cancelText: 'No',
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
      type: 'primary', title: 'Accept Bid?',
      message: `Accept ${bid.driver?.name}'s offer of Rs ${bid.pricePerSeat}/seat for ${req.fromCity} → ${req.toCity}?\n\nA ride will be auto-created and your seat confirmed.`,
      confirmText: 'Accept & Book', cancelText: 'Not Now', icon: 'checkmark-circle-outline',
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
                    {bid.note ? <Text style={styles.bidNote}>"{bid.note}"</Text> : null}
                  </View>
                  <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>Per Seat</Text>
                    <Text style={styles.price}>Rs {bid.pricePerSeat}</Text>
                    <Text style={styles.priceTotal}>Total Rs {bid.pricePerSeat * req.seats}</Text>
                  </View>
                </View>

                {/* Details + Reject + Accept */}
                <View style={styles.bidActions}>
                  {bid.vehicle && (
                    <TouchableOpacity style={styles.detailsBtn}
                      onPress={() => setVehicleDetails({ vehicle: bid.vehicle, driver: bid.driver })}>
                      <Ionicons name="information-circle-outline" size={14} color={COLORS.primary} />
                      <Text style={styles.detailsBtnText}>Details</Text>
                    </TouchableOpacity>
                  )}
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

      <VehicleDetailsModal
        visible={!!vehicleDetails}
        vehicle={vehicleDetails?.vehicle}
        driver={vehicleDetails?.driver}
        onClose={() => setVehicleDetails(null)}
      />
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
  bidActions:     { flexDirection: 'row', gap: 6, marginTop: 10 },
  detailsBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderColor: COLORS.primary + '40', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10 },
  detailsBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
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

// ─── Vehicle Details Modal Styles ─────────────────────────────────────────────
const vm = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet:         { backgroundColor: '#fff', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '92%', paddingHorizontal: 24, paddingTop: 12, paddingBottom: 40 },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: COLORS.border, alignSelf: 'center', marginBottom: 16 },

  driverRow:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  driverAvatar:  { width: 46, height: 46, borderRadius: 23, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  driverAvatarText: { fontSize: 20, fontWeight: '800', color: '#fff' },
  driverName:    { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  ratingRow:     { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  ratingText:    { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  closeBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },

  galleryWrapper:{ borderRadius: 16, overflow: 'hidden', marginBottom: 16, position: 'relative' },
  galleryImg:    { height: 210 },
  dots:          { flexDirection: 'row', justifyContent: 'center', gap: 6, paddingVertical: 8, backgroundColor: 'rgba(0,0,0,0.02)' },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotActive:     { backgroundColor: COLORS.primary, width: 18 },

  imgPlaceholder:     { height: 160, backgroundColor: COLORS.lightGray, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 16, gap: 8 },
  imgPlaceholderText: { fontSize: 13, color: COLORS.gray },

  specsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  specItem:   { flex: 1, minWidth: '42%', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: COLORS.border },
  specLabel:  { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', fontWeight: '600' },
  specValue:  { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary },

  amenitiesSection: { marginBottom: 16 },
  amenitiesTitle:   { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 10 },
  amenitiesGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  amenityChip:      { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  amenityLabel:     { fontSize: 12, fontWeight: '700' },

  nameBanner:     { backgroundColor: COLORS.primary + '10', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8 },
  nameBannerText: { fontSize: 18, fontWeight: '900', color: COLORS.primary, letterSpacing: 0.5 },
});
