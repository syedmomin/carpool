import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, CURVE,
  StarRating, PrimaryButton, AppBar,
  Avatar, TrustBadgesRow, RouteTag, SectionHeader,
} from '../../components';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { ridesApi } from '../../services/api';

export default function RideDetailScreen({ navigation, route }) {
  const params = route.params || {};
  const insets = useSafeAreaInsets();
  const { rideId, rideData, boardingCity, exitCity } = params;
  const { showModal } = useGlobalModal();
  const { showToast } = useToast();
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [favorite, setFavorite] = useState(false);
  const [ride, setRide] = useState(() => rideData || null);
  // Start in loading when we'll need to fetch, so the error view never flashes
  // for a frame before the fetch begins.
  const [loadingRide, setLoadingRide] = useState(() => !!rideId && !rideData);
  const [loadError, setLoadError] = useState(false);

  const fetchRide = useCallback(() => {
    if (!rideId) return;
    setLoadingRide(true);
    setLoadError(false);
    ridesApi.getById(rideId).then(({ data }) => {
      if (data?.data) setRide(data.data);
      else setLoadError(true);
      setLoadingRide(false);
    }).catch(() => { setLoadError(true); setLoadingRide(false); });
  }, [rideId]);

  useEffect(() => {
    if (!rideId) {
      showToast('Ride not found', 'error');
      navigation.goBack();
      return;
    }
    if (!ride) fetchRide();
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

  if (!ride) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg, padding: 28 }}>
        <Ionicons name="cloud-offline-outline" size={56} color={COLORS.gray} />
        <Text style={{ fontSize: 17, fontWeight: '800', color: COLORS.textPrimary, marginTop: 16 }}>Couldn't load this ride</Text>
        <Text style={{ fontSize: 13, color: COLORS.gray, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          Please check your connection and try again.
        </Text>
        <View style={{ height: 20 }} />
        <PrimaryButton title="Try Again" onPress={fetchRide} icon="refresh-outline" style={{ alignSelf: 'stretch' }} />
        <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 14 }}>
          <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const handleBook = () => {
    navigation.navigate('BookingConfirm', {
      rideId,
      rideData: ride,
      boardingCity,
      exitCity,
      initialSeats: selectedSeats,
    });
  };

  const aboutBullets = [
    'Leaving on time',
    vehicle?.ac ? 'AC vehicle for a comfortable journey' : 'Comfortable journey',
    driver?.rating >= 4.5 ? 'Highly rated driver' : driver?.isVerified ? 'Verified driver' : 'Experienced driver',
  ];

  return (
    <View style={styles.container}>
      <AppBar
        title="Ride Details"
        rightAction={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Pressable style={styles.headerIconBtn} onPress={() => navigation.navigate('Reviews', { userId: driver?.id, userName: driver?.name })}>
              <Ionicons name="person-outline" size={20} color={COLORS.textPrimary} />
            </Pressable>
            <Pressable style={styles.headerIconBtn} onPress={() => setFavorite(f => !f)}>
              <Ionicons name={favorite ? 'heart' : 'heart-outline'} size={20} color={favorite ? COLORS.danger : COLORS.textPrimary} />
            </Pressable>
          </View>
        }
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTopRow}>
            <View style={styles.dateChip}>
              <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.dateChipText}>{ride.date}</Text>
              {isSegment && (
                <View style={styles.segmentBanner}>
                  <Ionicons name="git-branch-outline" size={11} color={COLORS.primary} />
                  <Text style={styles.segmentBannerText}>Segment</Text>
                </View>
              )}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.priceValue}>Rs {ride.pricePerSeat?.toLocaleString()}</Text>
              <Text style={styles.priceCaption}>per seat</Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.cityBlock}>
              <Text style={styles.timeLarge}>{ride.departureTime}</Text>
              <Text style={styles.cityText} numberOfLines={1}>{isSegment ? boardingCity : ride.from}</Text>
            </View>
            <View style={styles.routeMiddle}>
              <Text style={styles.durationPill}>{ride.duration || ''}</Text>
              <View style={styles.routeLineRow}>
                <View style={[styles.routeDot, { backgroundColor: COLORS.secondary }]} />
                <View style={styles.routeDashLine} />
                <Ionicons name="car-sport" size={14} color={COLORS.primary} />
                <View style={styles.routeDashLine} />
                <View style={[styles.routeDot, { backgroundColor: COLORS.danger }]} />
              </View>
            </View>
            <View style={[styles.cityBlock, { alignItems: 'flex-end' }]}>
              <Text style={styles.timeLarge}>{ride.arrivalTime || '-'}</Text>
              <Text style={styles.cityText} numberOfLines={1}>{isSegment ? exitCity : ride.to}</Text>
            </View>
          </View>

          {isSegment && (
            <View style={styles.fullRouteRow}>
              <Text style={styles.fullRouteLabel}>Full route: </Text>
              <RouteTag from={ride.from} to={ride.to} textStyle={styles.fullRouteLabel} arrowColor={COLORS.gray} />
            </View>
          )}

          <View style={styles.summaryDivider} />

          {/* Driver row */}
          <View style={styles.driverRow}>
            <Avatar name={driver?.name} uri={driver?.avatar} size={48} color={COLORS.primary} />
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{driver?.name || 'Unknown'}</Text>
                {driver?.isVerified && <Ionicons name="shield-checkmark" size={14} color={COLORS.secondary} />}
              </View>
              <View style={styles.driverMetaRow}>
                {driver?.rating > 0 && <StarRating rating={driver.rating} size={13} />}
                <Text style={styles.driverMeta} numberOfLines={1}>
                  {vehicle?.brand} {vehicle?.model} {vehicle?.year || ''}
                </Text>
              </View>
            </View>
            <Pressable
              style={styles.viewProfileBtn}
              onPress={() => navigation.navigate('Reviews', { userId: driver?.id, userName: driver?.name })}
            >
              <Text style={styles.viewProfileText}>View Profile</Text>
            </Pressable>
          </View>

          <View style={styles.summaryDivider} />

          {/* Amenity icons row */}
          <View style={styles.amenityRow}>
            <View style={styles.amenityItem}>
              <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
              <Text style={styles.amenityLabel}>{available} Seat{available !== 1 ? 's' : ''} Left</Text>
            </View>
            <View style={styles.amenityItem}>
              <Ionicons name={vehicle?.smoking ? 'logo-no-smoking' : 'ban-outline'} size={16} color={COLORS.textSecondary} />
              <Text style={styles.amenityLabel}>No Smoking</Text>
            </View>
            {vehicle?.ac && (
              <View style={styles.amenityItem}>
                <Ionicons name="snow-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.amenityLabel}>AC</Text>
              </View>
            )}
            {vehicle?.music && (
              <View style={styles.amenityItem}>
                <Ionicons name="musical-notes-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.amenityLabel}>Music</Text>
              </View>
            )}
          </View>
        </View>

        {/* About this ride */}
        <View style={styles.aboutCard}>
          <SectionHeader title="About this ride" style={styles.sectionHeaderInCard} />
          {aboutBullets.map((b, i) => (
            <View key={i} style={styles.aboutRow}>
              <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
              <Text style={styles.aboutText}>{b}</Text>
            </View>
          ))}
        </View>

        {/* Driver contact */}
        <View style={styles.section}>
          <View style={styles.contactRow}>
            <TrustBadgesRow user={driver} max={3} />
            {driver?.phone && (
              <Pressable
                style={styles.callBtn}
                onPress={() => showModal({ type: 'info', title: 'Call Driver', message: `Call ${driver?.name} at ${driver?.phone || 'N/A'}?`, confirmText: 'Call' })}
              >
                <Ionicons name="call" size={16} color={COLORS.white} />
                <Text style={styles.callBtnText}>Call</Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.section}>
          <SectionHeader title="Vehicle" style={styles.sectionHeaderInSection} />
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

              {/* Features — shown first so they're immediately visible */}
              <View style={styles.amenityGrid}>
                {[
                  { key: 'ac',           icon: 'snow-outline',            label: 'AC',        color: COLORS.teal },
                  { key: 'wifi',         icon: 'wifi-outline',            label: 'WiFi',      color: COLORS.primary },
                  { key: 'music',        icon: 'musical-notes-outline',   label: 'Music',     color: '#e91e63' },
                  { key: 'usbCharging',  icon: 'flash-outline',           label: 'USB',       color: '#ff9800' },
                  { key: 'waterCooler',  icon: 'water-outline',           label: 'Water',     color: '#03a9f4' },
                  { key: 'blanket',      icon: 'bed-outline',             label: 'Blanket',   color: '#795548' },
                  { key: 'firstAid',     icon: 'medkit-outline',          label: 'First Aid', color: COLORS.danger },
                  { key: 'luggageRack',  icon: 'briefcase-outline',       label: 'Luggage',   color: COLORS.gray },
                ].filter(f => vehicle?.[f.key]).map(f => (
                  <View key={f.key} style={[styles.amenityChip, { backgroundColor: f.color + '15' }]}>
                    <Ionicons name={(f.icon) as any} size={13} color={f.color} />
                    <Text style={[styles.amenityChipText, { color: f.color }]}>{f.label}</Text>
                  </View>
                ))}
              </View>

              {/* Meta chips — type, seats, color */}
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
            </View>
          </View>
        </View>

        {/* Route Details */}
        <View style={styles.section}>
          <SectionHeader title="Route Details" style={styles.sectionHeaderInSection} />
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

        {available == 0 && (
          <View style={{ height: 80 }} />
        )}
      </ScrollView>

      {/* Book Bar */}
      {available > 0 && (
        <View style={[styles.bookingBar, { paddingBottom: insets.bottom + 14 }]}>
          <View style={styles.seatsSelector}>
            <Text style={styles.seatsSelectorLabel}>Seats:</Text>
            <Pressable style={styles.seatBtn} onPress={() => setSelectedSeats(Math.max(1, selectedSeats - 1))}>
              <Ionicons name="remove" size={16} color={COLORS.primary} />
            </Pressable>
            <Text style={styles.seatCount}>{selectedSeats}</Text>
            <Pressable style={styles.seatBtn} onPress={() => setSelectedSeats(Math.min(available, selectedSeats + 1))}>
              <Ionicons name="add" size={16} color={COLORS.primary} />
            </Pressable>
          </View>
          <PrimaryButton
            title={`Book This Ride · Rs ${(selectedSeats * ride.pricePerSeat)?.toLocaleString()}`}
            onPress={handleBook}
            style={styles.bookBtn}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  headerIconBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightGray },
  summaryCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: 'rgba(15, 23, 42, 0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 2,
    ...CURVE,
  },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  segmentBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primaryLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, marginLeft: 8 },
  segmentBannerText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  priceValue: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  priceCaption: { fontSize: 11, color: COLORS.textSecondary, marginTop: 1 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cityBlock: { flex: 1 },
  timeLarge: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  cityText: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  routeMiddle: { alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  durationPill: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, backgroundColor: COLORS.lightGray, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  routeLineRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  routeDot: { width: 6, height: 6, borderRadius: 3 },
  routeDashLine: { width: 16, height: 1, backgroundColor: COLORS.border },
  fullRouteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  fullRouteLabel: { fontSize: 11, color: COLORS.textSecondary },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  driverInfo: { flex: 1 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  driverName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  driverMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  driverMeta: { fontSize: 12, color: COLORS.textSecondary },
  viewProfileBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  viewProfileText: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amenityLabel: { fontSize: 12, fontWeight: '500', color: COLORS.textSecondary },
  aboutCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, marginTop: 16,
    borderWidth: 1, borderColor: COLORS.border,
  },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  aboutText: { fontSize: 13, fontWeight: '500', color: COLORS.textPrimary },
  section: { marginTop: 16 },
  sectionHeaderInCard: { marginTop: 0, marginBottom: 0 },
  sectionHeaderInSection: { marginTop: 0, marginBottom: 12 },
  contactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  callBtnText: { fontSize: 13, fontWeight: '700', color: COLORS.white },
  vehicleCard: {
    backgroundColor: COLORS.cardBg, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: COLORS.border,
    ...CURVE,
  },
  vehicleImg: { width: '100%', height: 140 },
  vehicleImgPlaceholder: { backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', gap: 6 },
  vehicleImgLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  vehicleDetails: { padding: 14 },
  vehicleHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  vehicleName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  plateNum: { fontSize: 12, color: COLORS.textPrimary, fontWeight: '700', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  vehicleMetaRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  vehicleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  vehicleChipText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  amenityChipText: { fontSize: 11, fontWeight: '700' },
  routeDetail: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, ...CURVE },
  routeDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rdIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  rdDivider: { height: 20, width: 1.5, backgroundColor: COLORS.border, marginLeft: 15, marginVertical: 4 },
  rdLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 2 },
  rdValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  descText: { fontSize: 13, color: COLORS.gray, flex: 1, lineHeight: 20 },
  bookingBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 0, borderTopWidth: 1, borderTopColor: COLORS.border },
  seatsSelector: { flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 8 },
  seatsSelectorLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  seatBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', ...CURVE },
  seatCount: { fontSize: 18, fontWeight: '800', color: COLORS.primary, minWidth: 24, textAlign: 'center' },
  bookBtn: { flex: 1 },
});
