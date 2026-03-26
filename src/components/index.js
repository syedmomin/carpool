import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const COLORS = {
  primary: '#1a73e8',
  primaryDark: '#1557b0',
  secondary: '#34a853',
  accent: '#fbbc04',
  danger: '#ea4335',
  white: '#ffffff',
  black: '#1a1a2e',
  gray: '#6b7280',
  lightGray: '#f3f4f6',
  border: '#e5e7eb',
  cardBg: '#ffffff',
  bg: '#f8f9ff',
  textPrimary: '#111827',
  textSecondary: '#6b7280',
  gradient1: '#1a73e8',
  gradient2: '#0d47a1',
};

// Primary Button
export const PrimaryButton = ({ title, onPress, style, loading, icon, color }) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={loading}
    activeOpacity={0.85}
    style={[styles.btnContainer, style]}
  >
    <LinearGradient
      colors={color ? [color, color] : [COLORS.primary, COLORS.primaryDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.btnGradient}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={18} color="#fff" style={{ marginRight: 8 }} />}
          <Text style={styles.btnText}>{title}</Text>
        </>
      )}
    </LinearGradient>
  </TouchableOpacity>
);

// Ghost Button
export const GhostButton = ({ title, onPress, style, color }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    style={[styles.ghostBtn, { borderColor: color || COLORS.primary }, style]}
  >
    <Text style={[styles.ghostBtnText, { color: color || COLORS.primary }]}>{title}</Text>
  </TouchableOpacity>
);

// Star Rating
export const StarRating = ({ rating, size = 14, showNumber = true }) => (
  <View style={styles.starRow}>
    {[1, 2, 3, 4, 5].map(i => (
      <Ionicons
        key={i}
        name={i <= Math.floor(rating) ? 'star' : i - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={size}
        color={COLORS.accent}
      />
    ))}
    {showNumber && <Text style={[styles.ratingNum, { fontSize: size }]}> {rating}</Text>}
  </View>
);

// Amenity Badge
export const AmenityBadge = ({ name }) => {
  const icons = {
    'AC': 'snow-outline', 'WiFi': 'wifi-outline', 'Music': 'musical-notes-outline',
    'Water Bottle': 'water-outline', 'Snacks': 'fast-food-outline', 'Blanket': 'bed-outline',
  };
  return (
    <View style={styles.amenityBadge}>
      <Ionicons name={icons[name] || 'checkmark-circle-outline'} size={12} color={COLORS.primary} />
      <Text style={styles.amenityText}>{name}</Text>
    </View>
  );
};

// Ride Card
export const RideCard = ({ ride, driver, vehicle, onPress }) => {
  const available = ride.totalSeats - ride.bookedSeats;
  return (
    <TouchableOpacity style={styles.rideCard} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.rideCardHeader}>
        <View style={styles.routeSection}>
          <View style={styles.routeLeft}>
            <View style={styles.routeDot} />
            <View style={styles.routeLine} />
            <View style={[styles.routeDot, { backgroundColor: COLORS.secondary }]} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.routeRow}>
              <Text style={styles.cityName}>{ride.from}</Text>
              <Text style={styles.timeText}>{ride.departureTime}</Text>
            </View>
            <View style={styles.routeRow}>
              <Text style={styles.cityName}>{ride.to}</Text>
              <Text style={styles.timeText}>{ride.arrivalTime}</Text>
            </View>
          </View>
        </View>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>Per Seat</Text>
          <Text style={styles.priceAmount}>Rs {ride.pricePerSeat?.toLocaleString()}</Text>
        </View>
      </View>

      <View style={styles.rideCardDivider} />

      <View style={styles.rideCardFooter}>
        <View style={styles.driverInfo}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverInitial}>{driver?.name?.[0] || 'D'}</Text>
          </View>
          <View>
            <Text style={styles.driverName}>{driver?.name || 'Driver'}</Text>
            <StarRating rating={driver?.rating || 4.5} size={12} />
          </View>
        </View>
        <View style={styles.vehicleInfo}>
          <Ionicons name="car-outline" size={14} color={COLORS.gray} />
          <Text style={styles.vehicleText}>{vehicle?.brand || 'Vehicle'}</Text>
        </View>
        <View style={[styles.seatsBadge, { backgroundColor: available > 0 ? '#e8f5e9' : '#ffebee' }]}>
          <Ionicons name="people-outline" size={12} color={available > 0 ? COLORS.secondary : COLORS.danger} />
          <Text style={[styles.seatsText, { color: available > 0 ? COLORS.secondary : COLORS.danger }]}>
            {available} seats
          </Text>
        </View>
      </View>

      {ride.amenities?.length > 0 && (
        <View style={styles.amenitiesRow}>
          {ride.amenities.slice(0, 4).map(a => <AmenityBadge key={a} name={a} />)}
        </View>
      )}
    </TouchableOpacity>
  );
};

// Section Header
export const SectionHeader = ({ title, onSeeAll }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAll && (
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAll}>See All</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Empty State
export const EmptyState = ({ icon, title, subtitle }) => (
  <View style={styles.emptyState}>
    <Ionicons name={icon} size={64} color={COLORS.border} />
    <Text style={styles.emptyTitle}>{title}</Text>
    {subtitle && <Text style={styles.emptySubtitle}>{subtitle}</Text>}
  </View>
);

const styles = StyleSheet.create({
  btnContainer: { borderRadius: 12, overflow: 'hidden' },
  btnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 24 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.3 },
  ghostBtn: { borderRadius: 12, borderWidth: 1.5, paddingVertical: 13, paddingHorizontal: 24, alignItems: 'center' },
  ghostBtnText: { fontSize: 15, fontWeight: '600' },
  starRow: { flexDirection: 'row', alignItems: 'center' },
  ratingNum: { color: COLORS.gray, fontWeight: '600', marginLeft: 2 },
  amenityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, marginRight: 6, marginBottom: 4 },
  amenityText: { fontSize: 11, color: COLORS.primary, marginLeft: 4, fontWeight: '500' },
  rideCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  rideCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  routeSection: { flexDirection: 'row', flex: 1 },
  routeLeft: { alignItems: 'center', marginRight: 10, paddingTop: 3 },
  routeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.primary },
  routeLine: { width: 2, height: 24, backgroundColor: COLORS.border, marginVertical: 3 },
  routeInfo: { flex: 1, justifyContent: 'space-between', height: 52 },
  routeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cityName: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
  timeText: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  priceSection: { alignItems: 'flex-end', justifyContent: 'center', marginLeft: 12 },
  priceLabel: { fontSize: 11, color: COLORS.gray },
  priceAmount: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  rideCardDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 12 },
  rideCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  driverInfo: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  driverInitial: { color: '#fff', fontWeight: '700', fontSize: 14 },
  driverName: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  vehicleInfo: { flexDirection: 'row', alignItems: 'center' },
  vehicleText: { fontSize: 12, color: COLORS.gray, marginLeft: 4 },
  seatsBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  seatsText: { fontSize: 12, fontWeight: '600', marginLeft: 4 },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  seeAll: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: COLORS.gray, marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
});
