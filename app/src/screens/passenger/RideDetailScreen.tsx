import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  COLORS, GRADIENTS, CURVE, SHADOWS, TYPOGRAPHY, AMENITY_CONFIG,
  StarRating, PrimaryButton, AppBar,
  Avatar, RouteTag, SectionHeader, DetailSkeleton, EmptyState, VehicleTypeImage,
} from '../../components';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { useToast } from '../../context/ToastContext';
import { ridesApi } from '../../services/api';
import { estimateRideDistanceKm } from '../../utils/geo';

function formatMinutes(mins: number) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Prefers the real routed duration (ride.route.duration, seconds, from
// OpenRouteService) — falls back to the difference between the ride's own
// departure/arrival times, which are also real driver-entered fields.
function durationLabel(ride: any) {
  if (ride?.route?.duration) return formatMinutes(ride.route.duration / 60);
  const from = ride?.departureTime, to = ride?.arrivalTime;
  if (from && to) {
    const [fh, fm] = from.replace(/\s?(am|pm)/i, '').split(':').map(Number);
    const [th, tm] = to.replace(/\s?(am|pm)/i, '').split(':').map(Number);
    if (![fh, fm, th, tm].some(isNaN)) {
      let mins = (th * 60 + tm) - (fh * 60 + fm);
      if (mins < 0) mins += 24 * 60;
      return formatMinutes(mins);
    }
  }
  return '';
}

function parseStops(raw: any): { city: string; arrivalTime?: string }[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    try { const parsed = JSON.parse(raw); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }
  return [];
}

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
  const rideDistanceKm = ride ? estimateRideDistanceKm(ride) : null;
  const rideDuration = ride ? durationLabel(ride) : '';
  const stops = ride?.isMultiStop ? parseStops(ride.stops) : [];

  if (loadingRide) {
    return (
      <View style={styles.container}>
        <AppBar title="Ride Details" />
        <DetailSkeleton />
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <EmptyState
          title="Couldn't Load This Ride"
          subtitle="Check your internet and try again."
          action={{ label: 'Try Again', onPress: fetchRide }}
        />
        <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: 'center', marginTop: -12, marginBottom: 24 }}>
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

  const vehicleAmenities = Object.entries(AMENITY_CONFIG).filter(([key]) => vehicle?.[key]);

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
        {/* Summary Card — a boarding-pass: a gradient "stub" carrying the
            route/time/price (the facts a passenger actually decides on),
            torn away from a plain white body (driver + amenities) by a
            punched, dashed perforation. Themeatically exact for a ride
            booking and immediately distinct from a generic bordered card. */}
        <View style={styles.ticketCard}>
          <LinearGradient colors={GRADIENTS.primary as any} style={styles.ticketStub} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.summaryTopRow}>
              <View style={styles.dateChip}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.85)" />
                <Text style={styles.dateChipText}>{ride.date}</Text>
                {isSegment && (
                  <View style={styles.segmentBanner}>
                    <Ionicons name="git-branch-outline" size={11} color="#fff" />
                    <Text style={styles.segmentBannerText}>Segment</Text>
                  </View>
                )}
                {!!ride.roundTripGroupId && (
                  <View style={styles.segmentBanner}>
                    <Ionicons name="swap-horizontal" size={11} color="#fff" />
                    <Text style={styles.segmentBannerText}>Round Trip</Text>
                  </View>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.priceValue}>Rs {ride.pricePerSeat?.toLocaleString()}</Text>
                <Text style={styles.priceCaption}>per seat</Text>
              </View>
            </View>

            {/* alignItems: 'center' on this row is the actual fix — it
                vertically centers the dot–line–dot connector against the
                time/city text next to it instead of pinning everything to
                a shared top edge, which is what read as "not aligned". */}
            <View style={styles.routeRow}>
              <View style={styles.cityBlock}>
                <Text style={styles.timeLarge}>{ride.departureTime}</Text>
                <Text style={styles.cityText} numberOfLines={1}>{isSegment ? boardingCity : ride.from}</Text>
              </View>
              <View style={styles.routeMiddle}>
                <View style={styles.routeLineRow}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeDashLine} />
                  <Ionicons name="car-sport" size={13} color="rgba(255,255,255,0.9)" />
                  <View style={styles.routeDashLine} />
                  <View style={styles.routeDotEnd} />
                </View>
              </View>
              <View style={[styles.cityBlock, { alignItems: 'flex-end' }]}>
                <Text style={styles.timeLarge}>{ride.arrivalTime || 'N/A'}</Text>
                <Text style={styles.cityText} numberOfLines={1}>{isSegment ? exitCity : ride.to}</Text>
              </View>
            </View>

            {(!!rideDuration || rideDistanceKm != null) && (
              <View style={styles.tripStatsRow}>
                {!!rideDuration && (
                  <View style={styles.tripStat}>
                    <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
                    <Text style={[styles.tripStatText, styles.tripStatTextLight]}>{rideDuration}</Text>
                  </View>
                )}
                {rideDistanceKm != null && (
                  <View style={styles.tripStat}>
                    <Ionicons name="speedometer-outline" size={13} color="rgba(255,255,255,0.85)" />
                    <Text style={[styles.tripStatText, styles.tripStatTextLight]}>{rideDistanceKm} km</Text>
                  </View>
                )}
              </View>
            )}

            {isSegment && (
              <View style={styles.fullRouteRow}>
                <Text style={styles.fullRouteLabel}>Full route: </Text>
                <RouteTag from={ride.from} to={ride.to} textStyle={styles.fullRouteLabel} arrowColor="rgba(255,255,255,0.75)" />
              </View>
            )}
          </LinearGradient>

          <View style={styles.ticketBody}>
            {/* Route Details — merged into the same ticket card as the
                gradient summary (not a separate card below) since it's
                elaborating on the exact same journey, not a new topic. */}
            <Text style={styles.ticketBodyLabel}>Route Details</Text>
            <View style={styles.routeDetailRow}>
              <View style={styles.rdIcon}>
                <Ionicons name="location" size={15} color={COLORS.primary} />
              </View>
              <View style={styles.rdTextCol}>
                <Text style={styles.rdLabel}>Pickup Point</Text>
                <Text style={styles.rdValue}>{ride.pickupPoint || `${isSegment ? boardingCity : ride.from} (driver will share the exact spot closer to the ride)`}</Text>
              </View>
            </View>
            {stops.map((stop, i) => (
              <React.Fragment key={i}>
                <View style={styles.rdDivider} />
                <View style={styles.routeDetailRow}>
                  <View style={styles.rdIcon}>
                    <Ionicons name="ellipse" size={9} color={COLORS.textSecondary} />
                  </View>
                  <View style={styles.rdTextCol}>
                    <Text style={styles.rdLabel}>Stop {i + 1}</Text>
                    <Text style={styles.rdValue}>{stop.city}{stop.arrivalTime ? ` · ${stop.arrivalTime}` : ''}</Text>
                  </View>
                </View>
              </React.Fragment>
            ))}
            <View style={styles.rdDivider} />
            <View style={styles.routeDetailRow}>
              <View style={styles.rdIcon}>
                <Ionicons name="flag" size={15} color={COLORS.secondary} />
              </View>
              <View style={styles.rdTextCol}>
                <Text style={styles.rdLabel}>Drop Point</Text>
                <Text style={styles.rdValue}>{ride.dropPoint || `${isSegment ? exitCity : ride.to} (driver will share the exact spot closer to the ride)`}</Text>
              </View>
            </View>
            {ride.description && (
              <>
                <View style={styles.rdDivider} />
                <View style={styles.routeDetailRow}>
                  <View style={styles.rdIcon}>
                    <Ionicons name="information-circle" size={15} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.descText}>{ride.description}</Text>
                </View>
              </>
            )}

            <View style={styles.summaryDivider} />

            {/* Driver row */}
            <View style={styles.driverRow}>
              <Avatar name={driver?.name} uri={driver?.avatar} size={48} color={COLORS.primary} />
              <View style={styles.driverInfo}>
                <View style={styles.driverNameRow}>
                  <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
                  {/* Verified badge — a real trust signal for a cash-only
                      booking; was missing from this screen entirely. */}
                  {driver?.isVerified && (
                    <Ionicons name="shield-checkmark" size={14} color={COLORS.secondary} style={{ marginLeft: 4 }} />
                  )}
                </View>
                <View style={styles.driverMetaRow}>
                  {driver?.rating > 0 && <StarRating rating={driver.rating} size={13} />}
                  {driver?.reviewCount > 0 && <Text style={styles.reviewCount}>({driver.reviewCount})</Text>}
                </View>
                <Text style={styles.driverMeta} numberOfLines={1}>
                  {vehicle?.brand} {vehicle?.model}
                </Text>
              </View>
              <View style={{ gap: 8, alignItems: 'flex-end' }}>
                {driver?.phone && (
                  <Pressable
                    style={styles.callIconBtn}
                    onPress={() => showModal({ type: 'info', title: 'Call Driver', message: `Call ${driver?.name} at ${driver?.phone || 'N/A'}?`, confirmText: 'Call' })}
                  >
                    <Ionicons name="call" size={16} color={COLORS.white} />
                  </Pressable>
                )}
                <Pressable
                  style={styles.viewProfileBtn}
                  onPress={() => navigation.navigate('Reviews', { userId: driver?.id, userName: driver?.name })}
                >
                  <Text style={styles.viewProfileText}>View Profile</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.summaryDivider} />

            {/* Seats only here — the amenity list itself already lives in
                the Vehicle section below, no need to repeat it. */}
            <View style={styles.amenityRow}>
              <View style={styles.amenityItem}>
                <Ionicons name="people-outline" size={16} color={COLORS.textSecondary} />
                <Text style={styles.amenityLabel}>{available} Seat{available !== 1 ? 's' : ''} Left</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.section}>
          <SectionHeader title="Vehicle" style={styles.sectionHeaderInSection} />
          <View style={styles.vehicleCard}>
            <View style={styles.vehicleHeaderRow}>
              {/* Small square thumbnail instead of a full-width banner —
                  this is one line item's icon, not a hero image. */}
              <View style={styles.vehicleThumb}>
                <VehicleTypeImage type={vehicle?.type} size={30} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{vehicle?.brand} {vehicle?.model}</Text>
                <Text style={styles.plateNum}>{vehicle?.plateNumber}</Text>
              </View>
            </View>

            <View style={styles.vehicleDetails}>

              {/* Features — shown first so they're immediately visible.
                  One neutral chip style for all of them (not a different
                  pastel per amenity) keeps this from reading as a bag of
                  candy-colored badges. */}
              <View style={styles.amenityGrid}>
                {vehicleAmenities.map(([key, cfg]) => (
                  <View key={key} style={styles.amenityChip}>
                    <Ionicons name={cfg.icon as any} size={13} color={COLORS.textSecondary} />
                    <Text style={styles.amenityChipText}>{cfg.label}</Text>
                  </View>
                ))}
              </View>

              {/* Meta chips — type, seats */}
              <View style={styles.vehicleMetaRow}>
                <View style={styles.vehicleChip}>
                  <Text style={styles.vehicleChipText}>{vehicle?.type || 'Car'}</Text>
                </View>
                <View style={styles.vehicleChip}>
                  <Ionicons name="people-outline" size={12} color={COLORS.gray} />
                  <Text style={styles.vehicleChipText}>{vehicle?.totalSeats} seats</Text>
                </View>
              </View>
            </View>
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

  // Cards below drop the border+custom-shadow combo (reads as flat/dated)
  // in favor of the app's shared SHADOWS token, same change made to the
  // ride-listing card — one consistent elevation language across screens.
  // Boarding-pass card: a gradient "stub" (route/time/price) torn from a
  // plain white "body" (driver/amenities) by a punched perforation.
  ticketCard: { borderRadius: 20, backgroundColor: COLORS.cardBg, ...SHADOWS.md, overflow: 'hidden' },
  ticketStub: { padding: 18, paddingBottom: 22 },
  ticketBody: { padding: 16, paddingTop: 14 },
  ticketBodyLabel: { ...TYPOGRAPHY.label, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  summaryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  dateChip: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', paddingRight: 12 },
  dateChipText: { ...TYPOGRAPHY.cardMeta, color: 'rgba(255,255,255,0.85)', fontWeight: '700' },
  segmentBanner: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  segmentBannerText: { ...TYPOGRAPHY.label, color: '#fff', fontWeight: '700' },
  priceValue: { fontSize: 19, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  priceCaption: { ...TYPOGRAPHY.cardCaption, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  // alignItems: 'center' is the actual fix — it vertically centers the
  // dot–line–dot connector against the time/city text beside it, instead
  // of pinning everything to a shared top edge (which read as "not
  // aligned" once the connector had its own top padding).
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 22 },
  cityBlock: { flex: 1 },
  timeLarge: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },
  cityText: { ...TYPOGRAPHY.cardMeta, color: 'rgba(255,255,255,0.8)', marginTop: 3 },
  routeMiddle: { alignItems: 'center', paddingHorizontal: 10 },
  routeLineRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  routeDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  routeDotEnd: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#fff' },
  routeDashLine: { width: 14, height: 1.5, backgroundColor: 'rgba(255,255,255,0.5)' },
  fullRouteRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12 },
  fullRouteLabel: { ...TYPOGRAPHY.cardCaption, color: 'rgba(255,255,255,0.75)' },
  summaryDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 14 },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 },
  driverInfo: { flex: 1 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center' },
  driverName: { ...TYPOGRAPHY.cardTitle, fontSize: 15, marginBottom: 4 },
  driverMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reviewCount: { ...TYPOGRAPHY.cardCaption, fontWeight: '600' },
  driverMeta: { ...TYPOGRAPHY.cardMeta, marginTop: 2 },
  callIconBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  viewProfileBtn: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  viewProfileText: { ...TYPOGRAPHY.cardCaption, fontWeight: '700', color: COLORS.primaryDark },
  amenityRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  amenityLabel: { ...TYPOGRAPHY.cardMeta },
  section: { marginTop: 16 },
  sectionHeaderInSection: { marginTop: 0, marginBottom: 12 },
  vehicleCard: { backgroundColor: COLORS.cardBg, borderRadius: 16, padding: 14, ...SHADOWS.sm },
  // A small square thumbnail (not a full-width banner) — this is one line
  // item's icon, not a hero image.
  vehicleThumb: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  vehicleDetails: { marginTop: 12 },
  vehicleHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  vehicleName: { ...TYPOGRAPHY.cardTitle, fontSize: 15 },
  plateNum: { ...TYPOGRAPHY.cardMeta, fontWeight: '700', marginTop: 2 },
  vehicleMetaRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  vehicleChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  vehicleChipText: { ...TYPOGRAPHY.cardMeta, fontWeight: '600' },
  amenityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  // One neutral chip for every amenity — a different tint per amenity
  // (AMENITY_CONFIG.color) is what made this row read as a candy strip.
  amenityChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.lightGray, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  amenityChipText: { ...TYPOGRAPHY.cardMeta, fontWeight: '600' },
  tripStatsRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 12 },
  tripStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripStatText: { ...TYPOGRAPHY.cardMeta, fontWeight: '700', color: COLORS.textPrimary },
  tripStatTextLight: { color: 'rgba(255,255,255,0.85)' },
  routeDetailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  rdIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  rdTextCol: { flex: 1 },
  rdDivider: { height: 18, width: 1.5, backgroundColor: COLORS.border, marginLeft: 14, marginVertical: 4 },
  rdLabel: { ...TYPOGRAPHY.cardCaption, marginBottom: 2 },
  rdValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, lineHeight: 19 },
  descText: { ...TYPOGRAPHY.cardMeta, flex: 1, lineHeight: 20 },
  bookingBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 14,
  },
  seatsSelector: { flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 8 },
  seatsSelectorLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  seatBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center', ...CURVE },
  seatCount: { fontSize: 18, fontWeight: '800', color: COLORS.primary, minWidth: 24, textAlign: 'center' },
  bookBtn: { flex: 1 },
});
