import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, GRADIENTS,
  AmenityBadge, StarRating, PrimaryButton,
  Avatar, VerifiedBadge, TrustBadgesRow,
} from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { parseApiError } from '../../utils/errorMessages';
import { ridesApi } from '../../services/api';
import { haptics } from '../../utils/haptics';

export default function RideDetailScreen({ navigation, route }) {
  const params = route.params || {};
  const { rideId, rideData, boardingCity, exitCity } = params;
  const { bookRide } = useApp();
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [booking, setBooking] = useState(false);
  const [ride, setRide] = useState(() => rideData || null);
  const [loadingRide, setLoadingRide] = useState(false);

  useEffect(() => {
    if (!rideId) {
      showToast('Ride not found', 'error');
      navigation.goBack();
      return;
    }
    if (!ride) {
      setLoadingRide(true);
      ridesApi.getById(rideId).then(({ data }) => {
        if (data?.data) setRide(data.data);
        setLoadingRide(false);
      }).catch(() => setLoadingRide(false));
    }
  }, [rideId]);

  const driver = ride?.driver;
  const vehicle = ride?.vehicle;
  const available = ride ? (ride.totalSeats || 0) - (ride.bookedSeats || 0) : 0;
  const isSegment = !!(boardingCity && exitCity);

  if (loadingRide) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!ride) return null;

  const handleBook = () => {
    const priceLabel = isSegment
      ? `${boardingCity} → ${exitCity}`
      : `${ride.from} → ${ride.to}`;
    showModal({
      type: 'confirm',
      title: 'Confirm Booking',
      message: `${selectedSeats} seat(s) on route ${priceLabel}\n\nWould you like to confirm?`,
      confirmText: 'Confirm',
      cancelText: 'Cancel',
      onConfirm: async () => {
        setBooking(true);
        const { error } = await bookRide(rideId, selectedSeats, boardingCity, exitCity);
        setBooking(false);
        if (error) {
          showToast(parseApiError(error), 'error');
          return;
        }
        haptics.success();
        navigation.replace('BookingConfirm', { rideId, seats: selectedSeats, rideData: ride });
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={GRADIENTS.primary as any} style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerLabel}>Ride Detail</Text>
            {isSegment && (
              <View style={styles.segmentBanner}>
                <Ionicons name="git-branch-outline" size={12} color="rgba(255,255,255,0.9)" />
                <Text style={styles.segmentBannerText}>Segment</Text>
              </View>
            )}
          </View>

          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.cityBlock}>
                <Text style={styles.cityLarge}>{isSegment ? boardingCity : ride.from}</Text>
                <Text style={styles.timeSmall}>{ride.departureTime}</Text>
              </View>
              <View style={styles.routeMiddle}>
                <View style={styles.routeDot} />
                <View style={styles.routeArrowLine} />
                {/* Custom road icon instead of airplane */}
                <View style={styles.routeIconBox}>
                  <Ionicons name="car-sport" size={14} color={COLORS.primary} />
                </View>
                <View style={styles.routeArrowLine} />
                <View style={[styles.routeDot, { backgroundColor: '#4caf50' }]} />
              </View>
              <View style={[styles.cityBlock, { alignItems: 'flex-end' }]}>
                <Text style={styles.cityLarge}>{isSegment ? exitCity : ride.to}</Text>
                <Text style={styles.timeSmall}>{ride.arrivalTime || '—'}</Text>
              </View>
            </View>
            <View style={styles.dateLine}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.dateText}>{ride.date}</Text>
              {isSegment && (
                <Text style={styles.fullRouteText}> · Full: {ride.from} → {ride.to}</Text>
              )}
            </View>
          </View>
        </LinearGradient>

        {/* Price / Seats / Vehicle Row */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Per Seat</Text>
            <Text style={styles.infoValue}>Rs {ride.pricePerSeat?.toLocaleString()}</Text>
          </View>
          <View style={styles.dividerV} />
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Available</Text>
            <Text style={[styles.infoValue, { color: available > 0 ? COLORS.secondary : COLORS.danger }]}>
              {available} / {ride.totalSeats}
            </Text>
          </View>
          <View style={styles.dividerV} />
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Vehicle</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{vehicle?.type || 'Car'}</Text>
          </View>
        </View>

        {/* Driver */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Driver</Text>
          <View style={styles.driverCard}>
            <Avatar name={driver?.name} size={56} color={COLORS.primary} />
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{driver?.name || 'Unknown'}</Text>
                {driver?.isVerified && <Ionicons name="shield-checkmark" size={15} color={COLORS.secondary} />}
              </View>
              {driver?.rating > 0 && <StarRating rating={driver.rating} size={14} />}
              <TrustBadgesRow user={driver} max={3} style={{ marginTop: 6 }} />
              <Text style={styles.driverMeta}>
                {driver?.reviewCount > 0 ? `${driver.reviewCount} review${driver.reviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
                {driver?.city ? ` · ${driver.city}` : ''}
              </Text>
              {driver?.phone && (
                <View style={styles.driverPhoneRow}>
                  <Ionicons name="call-outline" size={13} color={COLORS.gray} />
                  <Text style={styles.driverPhone}>{driver.phone}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => showModal({ type: 'info', title: 'Call Driver', message: `Call ${driver?.name} at ${driver?.phone || 'N/A'}?`, confirmText: 'Call' })}
            >
              <LinearGradient colors={GRADIENTS.secondary as any} style={styles.callBtnGrad}>
                <Ionicons name="call" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vehicle</Text>
          <View style={styles.vehicleCard}>
            {vehicle?.images?.[0] ? (
              <Image source={{ uri: vehicle.images[0] }} style={styles.vehicleImg} resizeMode="cover" />
            ) : (
              <View style={[styles.vehicleImg, styles.vehicleImgPlaceholder]}>
                <Ionicons name="car-sport-outline" size={40} color={COLORS.gray} />
                <Text style={styles.vehicleImgLabel}>{vehicle?.brand || 'Vehicle'}</Text>
              </View>
            )}
            <View style={styles.vehicleDetails}>
              <View style={styles.vehicleHeaderRow}>
                <Text style={styles.vehicleName}>{vehicle?.brand} {vehicle?.model}</Text>
                <Text style={styles.plateNum}>{vehicle?.plateNumber}</Text>
              </View>
              <View style={styles.vehicleMetaRow}>
                <View style={styles.vehicleChip}>
                  <Ionicons name="car-outline" size={12} color={COLORS.gray} />
                  <Text style={styles.vehicleChipText}>{vehicle?.type || 'Car'}</Text>
                </View>
                <View style={styles.vehicleChip}>
                  <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                  <Text style={styles.vehicleChipText}>{vehicle?.totalSeats} seats</Text>
                </View>
                {vehicle?.color && (
                  <View style={styles.vehicleChip}>
                    <Ionicons name="color-palette-outline" size={12} color={COLORS.gray} />
                    <Text style={styles.vehicleChipText}>{vehicle.color}</Text>
                  </View>
                )}
              </View>
              {/* Amenities */}
              <View style={styles.amenityGrid}>
                {[
                  { key: 'ac', icon: 'snow-outline', label: 'AC', color: COLORS.teal },
                  { key: 'wifi', icon: 'wifi-outline', label: 'WiFi', color: COLORS.primary },
                  { key: 'music', icon: 'musical-notes-outline', label: 'Music', color: '#e91e63' },
                  { key: 'usbCharging', icon: 'flash-outline', label: 'USB', color: '#ff9800' },
                  { key: 'waterCooler', icon: 'water-outline', label: 'Water', color: '#03a9f4' },
                  { key: 'blanket', icon: 'bed-outline', label: 'Blanket', color: '#795548' },
                  { key: 'firstAid', icon: 'medkit-outline', label: 'First Aid', color: COLORS.danger },
                  { key: 'luggageRack', icon: 'briefcase-outline', label: 'Luggage', color: COLORS.gray },
                ].filter(f => vehicle?.[f.key]).map(f => (
                  <View key={f.key} style={[styles.amenityChip, { backgroundColor: f.color + '15' }]}>
                    <Ionicons name={(f.icon) as any} size={13} color={f.color} />
                    <Text style={[styles.amenityChipText, { color: f.color }]}>{f.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Route Details</Text>
          <View style={styles.routeDetail}>
            <View style={styles.routeDetailRow}>
              <View style={styles.rdIcon}>
                <Ionicons name="location" size={16} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.rdLabel}>Pickup Point</Text>
                <Text style={styles.rdValue}>{ride.pickupPoint}</Text>
              </View>
            </View>
            <View style={styles.rdDivider} />
            <View style={styles.routeDetailRow}>
              <View style={[styles.rdIcon, { backgroundColor: '#e8f5e9' }]}>
                <Ionicons name="flag" size={16} color={COLORS.secondary} />
              </View>
              <View>
                <Text style={styles.rdLabel}>Drop Point</Text>
                <Text style={styles.rdValue}>{ride.dropPoint}</Text>
              </View>
            </View>
            {ride.description && (
              <>
                <View style={styles.rdDivider} />
                <View style={styles.routeDetailRow}>
                  <View style={[styles.rdIcon, { backgroundColor: '#fff8e1' }]}>
                    <Ionicons name="information-circle" size={16} color={COLORS.accent} />
                  </View>
                  <Text style={styles.descText}>{ride.description}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Amenities */}
        {ride.amenities?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amenities</Text>
            <View style={styles.amenitiesRow}>
              {ride.amenities.map(a => <AmenityBadge key={a} name={a} />)}
            </View>
          </View>
        )}

        {available == 0 && (
          <View style={{ height: 80 }} />
        )}
      </ScrollView>

      {/* Book Bar */}
      {available > 0 && (
        <View style={styles.bookingBar}>
          <View style={styles.seatsSelector}>
            <Text style={styles.seatsSelectorLabel}>Seats:</Text>
            <TouchableOpacity style={styles.seatBtn} onPress={() => setSelectedSeats(Math.max(1, selectedSeats - 1))}>
              <Ionicons name="remove" size={16} color={COLORS.primary} />
            </TouchableOpacity>
            <Text style={styles.seatCount}>{selectedSeats}</Text>
            <TouchableOpacity style={styles.seatBtn} onPress={() => setSelectedSeats(Math.min(available, selectedSeats + 1))}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleBook} style={styles.bookBtn} disabled={booking}>
            <LinearGradient colors={GRADIENTS.primary as any} style={styles.bookBtnGrad}>
              <Text style={styles.bookBtnText}>Book • Rs {(selectedSeats * ride.pricePerSeat)?.toLocaleString()}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingTop: 48, paddingBottom: 16, paddingHorizontal: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  backBtn: { width: 34, height: 34, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerLabel: { fontSize: 15, color: '#fff', fontWeight: '700', flex: 1 },
  segmentBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  segmentBannerText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  routeCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 14 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cityBlock: { flex: 1 },
  cityLarge: { fontSize: 20, fontWeight: '800', color: '#fff' },
  timeSmall: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  routeMiddle: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  routeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  routeArrowLine: { width: 20, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)' },
  routeIconBox: { width: 26, height: 26, backgroundColor: '#fff', borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 },
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: 11, color: 'rgba(255,255,255,0.75)' },
  fullRouteText: { fontSize: 11, color: 'rgba(255,255,255,0.6)' },
  infoRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  infoBox: { flex: 1, padding: 16, alignItems: 'center' },
  dividerV: { width: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  infoValue: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  section: { margin: 16, marginTop: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  driverCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  driverInfo: { flex: 1 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  driverName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  driverMeta: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  driverPhoneRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 5 },
  driverPhone: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600' },
  callBtn: { borderRadius: 14, overflow: 'hidden' },
  callBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  vehicleImg: { width: '100%', height: 140 },
  vehicleImgPlaceholder: { backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', gap: 6 },
  vehicleImgLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  vehicleDetails: { padding: 14 },
  vehicleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  plateNum: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '700', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  vehicleMetaRow: { flexDirection: 'row', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  vehicleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  vehicleChipText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  amenityChipText: { fontSize: 11, fontWeight: '700' },
  routeDetail: { backgroundColor: '#fff', borderRadius: 16, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  routeDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rdIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  rdDivider: { height: 20, width: 1.5, backgroundColor: COLORS.border, marginLeft: 15, marginVertical: 4 },
  rdLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
  rdValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  descText: { fontSize: 13, color: COLORS.gray, flex: 1, lineHeight: 20 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap' },
  reviewCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  reviewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
  reviewInfo: { flex: 1 },
  reviewerName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 3 },
  reviewDate: { fontSize: 11, color: COLORS.gray },
  reviewComment: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  bookingBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 18, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  seatsSelector: { flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 8 },
  seatsSelectorLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  seatBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  seatCount: { fontSize: 18, fontWeight: '800', color: COLORS.primary, minWidth: 24, textAlign: 'center' },
  bookBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  bookBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
