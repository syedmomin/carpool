import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS, GRADIENTS,
  AmenityBadge, StarRating, PrimaryButton,
  Avatar, VerifiedBadge,
} from '../../components';
import { useApp } from '../../context/AppContext';
import { useGlobalModal } from '../../context/GlobalModalContext';

export default function RideDetailScreen({ navigation, route }) {
  const { rideId, boardingCity, exitCity } = route.params;
  const { getRideById, getDriverById, getVehicleById, getReviewsForDriver, bookRide } = useApp();
  const { showModal } = useGlobalModal();
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [booking, setBooking] = useState(false);

  const ride = getRideById(rideId);
  const driver = getDriverById(ride?.driverId);
  const vehicle = getVehicleById(ride?.vehicleId);
  const reviews = getReviewsForDriver(ride?.driverId);
  const available = ride ? ride.totalSeats - ride.bookedSeats : 0;
  const isSegment = !!(boardingCity && exitCity);

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
          showModal({ type: 'error', title: 'Booking Failed', message: error });
          return;
        }
        navigation.navigate('BookingConfirm', { rideId, seats: selectedSeats });
      },
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerLabel}>Ride Detail</Text>

          {isSegment && (
            <View style={styles.segmentBanner}>
              <Ionicons name="git-branch-outline" size={13} color="rgba(255,255,255,0.9)" />
              <Text style={styles.segmentBannerText}>Booking segment: {boardingCity} → {exitCity}</Text>
            </View>
          )}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View>
                <Text style={styles.cityLarge}>{isSegment ? boardingCity : ride.from}</Text>
                <Text style={styles.timeSmall}>{ride.departureTime}</Text>
              </View>
              <View style={styles.routeMiddle}>
                <View style={styles.routeDot} />
                <View style={styles.routeArrowLine} />
                <Ionicons name="airplane" size={16} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />
                <View style={styles.routeArrowLine} />
                <View style={[styles.routeDot, { backgroundColor: '#4caf50' }]} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.cityLarge}>{isSegment ? exitCity : ride.to}</Text>
                <Text style={styles.timeSmall}>{ride.arrivalTime}</Text>
              </View>
            </View>
            {isSegment && (
              <Text style={styles.fullRouteText}>Full route: {ride.from} → {ride.to}</Text>
            )}
            <Text style={styles.dateText}>
              <Ionicons name="calendar-outline" size={12} /> {ride.date}
            </Text>
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
            <View style={styles.driverAvatarWrap}>
              <Avatar name={driver?.name} size={52} color={COLORS.primary} />
              {driver?.verified && (
                <VerifiedBadge style={styles.verifiedBadge} />
              )}
            </View>
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>{driver?.name}</Text>
              <StarRating rating={driver?.rating} size={14} />
              <Text style={styles.driverTrips}>{driver?.totalTrips} trips completed</Text>
            </View>
            <TouchableOpacity
              style={styles.callBtn}
              onPress={() => showModal({ type: 'info', title: 'Call Driver', message: `Would you like to call ${driver?.name}?`, confirmText: 'Call' })}
            >
              <LinearGradient colors={GRADIENTS.secondary} style={styles.callBtnGrad}>
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
                <Ionicons name="car-sport-outline" size={48} color={COLORS.gray} />
              </View>
            )}
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleName}>{vehicle?.brand}</Text>
              <Text style={styles.vehicleModel}>{vehicle?.model} • {vehicle?.color}</Text>
              <View style={styles.plateRow}>
                <Ionicons name="card-outline" size={14} color={COLORS.gray} />
                <Text style={styles.plateNum}>{vehicle?.plateNumber}</Text>
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

        {/* Reviews */}
        {reviews?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {reviews.map(r => (
              <View key={r.id} style={styles.reviewCard}>
                <View style={styles.reviewTop}>
                  <Avatar name={r.reviewerName} size={36} color={COLORS.lightGray} />
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewerName}>{r.reviewerName}</Text>
                    <StarRating rating={r.rating} size={12} />
                  </View>
                  <Text style={styles.reviewDate}>{r.date}</Text>
                </View>
                <Text style={styles.reviewComment}>{r.comment}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
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
            <LinearGradient colors={GRADIENTS.primary} style={styles.bookBtnGrad}>
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
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 16 },
  headerLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 16 },
  segmentBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginBottom: 10, alignSelf: 'flex-start' },
  segmentBannerText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  fullRouteText: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 4, marginBottom: 4, textAlign: 'center' },
  routeCard: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 16, padding: 16 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cityLarge: { fontSize: 22, fontWeight: '800', color: '#fff' },
  timeSmall: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  routeMiddle: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
  routeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  routeArrowLine: { flex: 1, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', maxWidth: 30 },
  dateText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  infoRow: { flexDirection: 'row', backgroundColor: '#fff', marginHorizontal: 16, marginTop: -16, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  infoBox: { flex: 1, padding: 16, alignItems: 'center' },
  dividerV: { width: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  infoLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  infoValue: { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  section: { margin: 16, marginTop: 12 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  driverCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  driverAvatarWrap: { position: 'relative', marginRight: 12 },
  verifiedBadge: { position: 'absolute', bottom: -4, right: -4 },
  driverInfo: { flex: 1 },
  driverName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  driverTrips: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  callBtn: { borderRadius: 14, overflow: 'hidden' },
  callBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  vehicleCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  vehicleImg: { width: '100%', height: 160 },
  vehicleImgPlaceholder: { backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  vehicleDetails: { padding: 16 },
  vehicleName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary },
  vehicleModel: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  plateRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  plateNum: { fontSize: 13, color: COLORS.textPrimary, fontWeight: '600', backgroundColor: COLORS.lightGray, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
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
  bookingBar: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, borderTopWidth: 1, borderTopColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 8 },
  seatsSelector: { flexDirection: 'row', alignItems: 'center', marginRight: 16, gap: 8 },
  seatsSelectorLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  seatBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.lightGray, alignItems: 'center', justifyContent: 'center' },
  seatCount: { fontSize: 18, fontWeight: '800', color: COLORS.primary, minWidth: 24, textAlign: 'center' },
  bookBtn: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  bookBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  bookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
