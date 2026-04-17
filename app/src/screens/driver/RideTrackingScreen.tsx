import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Dimensions, ActivityIndicator, Animated, FlatList, Linking,
} from 'react-native';
import { MapView, Marker } from '../../components/Map';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, Avatar } from '../../components';
import { ridesApi } from '../../services/api';
import { socketService } from '../../services/socket.service';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import ReviewModal from '../../components/ReviewModal';

const { width } = Dimensions.get('window');
const isDriver = (role?: string) => role === 'DRIVER';

// ─── Elapsed timer hook ───────────────────────────────────────────────────────
function useElapsed(active: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2, '0')}m`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Animated live pulse ──────────────────────────────────────────────────────
function LiveDot({ active }: { active: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    if (!active) return;
    const anim = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale,   { toValue: 1.6, duration: 900, useNativeDriver: true }),
          Animated.timing(scale,   { toValue: 1,   duration: 900, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.2, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.8, duration: 900, useNativeDriver: true }),
        ]),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [active]);

  return (
    <View style={dot.wrap}>
      <Animated.View style={[dot.ring, { transform: [{ scale }], opacity }]} />
      <View style={dot.core} />
    </View>
  );
}
const dot = StyleSheet.create({
  wrap:  { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  ring:  { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#22c55e', opacity: 0.4 },
  core:  { width: 9, height: 9, borderRadius: 5, backgroundColor: '#22c55e' },
});

// ─── Star rating display ──────────────────────────────────────────────────────
function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons
          key={n}
          name={n <= Math.round(r) ? 'star' : 'star-outline'}
          size={11}
          color="#f59e0b"
        />
      ))}
      {rating !== null && (
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#d97706', marginLeft: 3 }}>
          {r.toFixed(1)}
        </Text>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RideTrackingScreen({ route, navigation }) {
  const { rideId } = route.params;
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const { currentUser } = useApp();
  const driver = isDriver(currentUser?.role);

  const [ride, setRide]                   = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [currentSpeed, setCurrentSpeed]   = useState(0);
  const [isFinishing, setIsFinishing]     = useState(false);
  const [ratingIndex, setRatingIndex]     = useState(-1);
  const locationSub                       = useRef<any>(null);
  const mapRef                            = useRef<any>(null);
  const mountedRef                        = useRef(true);

  const elapsed = useElapsed(driver && !loading);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    fetchRide();
    socketService.connect();
    socketService.joinRide(rideId, driver ? 'driver' : 'rider');

    // Passenger: listen for driver location
    const onLocationUpdate = (payload: any) => {
      if (!mountedRef.current || payload.rideId !== rideId) return;
      setCurrentLocation(payload);
      mapRef.current?.animateCamera({
        center: { latitude: payload.latitude, longitude: payload.longitude },
        heading: payload.heading || 0,
        pitch: 40,
        zoom: 17,
      }, { duration: 800 });
    };

    // Both: listen for ride completion (driver covers own device edge cases only)
    const onRideCompleted = (data: any) => {
      if (!mountedRef.current || data.rideId !== rideId) return;
      if (driver) {
        // SocketListener shows passenger review — here we just handle external completion
        navigation.navigate('DriverApp', { screen: 'MyRidesTab' });
      }
      // Passenger is handled entirely by SocketListener (navigate + review)
    };

    if (driver) {
      startTracking();
    } else {
      socketService.onLocationUpdate(onLocationUpdate);
    }
    socketService.on('RIDE_COMPLETED', onRideCompleted);

    return () => {
      stopTracking();
      socketService.offLocationUpdate(onLocationUpdate);
      socketService.off('RIDE_COMPLETED', onRideCompleted);
      socketService.leaveRide(rideId);
    };
  }, [rideId]);

  const fetchRide = async () => {
    const { data, error } = await ridesApi.getById(rideId);
    if (!mountedRef.current) return;
    if (data) {
      setRide(data.data || data);
    } else {
      showToast(error || 'Failed to load ride', 'error');
      navigation.goBack();
    }
    setLoading(false);
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      showToast('Location permission denied', 'error');
      return;
    }
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 8 },
      (loc) => {
        if (!mountedRef.current) return;
        const { latitude, longitude, heading, speed } = loc.coords;
        setCurrentLocation({ latitude, longitude, heading, speed });
        setCurrentSpeed(Math.round((speed || 0) * 3.6));
        socketService.emitLocation({ rideId, latitude, longitude, heading, speed });
        mapRef.current?.animateCamera({
          center: { latitude, longitude },
          heading: heading || 0,
          pitch: 45,
          zoom: 17,
        }, { duration: 800 });
      }
    );
    locationSub.current = sub;
  };

  const stopTracking = () => {
    locationSub.current?.remove();
    locationSub.current = null;
  };

  const handleCall = (phone?: string) => {
    if (!phone) { showToast('Phone number not available', 'error'); return; }
    Linking.openURL(`tel:${phone}`).catch(() => showToast('Unable to open dialer', 'error'));
  };

  const handleFinishRide = () => {
    showModal({
      type: 'info',
      title: 'Finish Ride?',
      message: `You're about to complete this trip. All ${confirmedBookings.length} passenger(s) will be notified.`,
      confirmText: 'Finish Ride',
      cancelText: 'Not Yet',
      onConfirm: async () => {
        setIsFinishing(true);
        const { error } = await ridesApi.updateStatus(rideId, 'COMPLETED');
        setIsFinishing(false);
        if (error) {
          showToast(error, 'error');
        } else {
          stopTracking();
          showToast('Ride completed!', 'success');
          if (confirmedBookings.length > 0) {
            setRatingIndex(0); // Start rating passengers
          } else {
            navigation.navigate('DriverApp', { screen: 'MyRidesTab' });
          }
        }
      },
    });
  };

  const advanceRating = () => {
    const next = ratingIndex + 1;
    if (next < confirmedBookings.length) {
      setRatingIndex(next);
    } else {
      setRatingIndex(-1);
      navigation.navigate('DriverApp', { screen: 'MyRidesTab' });
    }
  };

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={s.loadingText}>Starting tracking session...</Text>
      </View>
    );
  }

  const confirmedBookings = ride?.bookings?.filter((b: any) => b.status === 'CONFIRMED') || [];
  const myBooking = !driver
    ? ride?.bookings?.find((b: any) => b.passengerId === currentUser?.id)
    : null;
  const driverRating = ride?.driver?.rating ?? null;

  return (
    <View style={s.container}>
      {/* ── Map ──────────────────────────────────────────────────────── */}
      {MapView ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{
            latitude:  currentLocation?.latitude  || 30.3753,
            longitude: currentLocation?.longitude || 69.3451,
            latitudeDelta:  0.06,
            longitudeDelta: 0.06,
          }}
        >
          {/* Driver car marker (for passenger view) */}
          {!driver && currentLocation && (
            <Marker
              coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
              rotation={currentLocation.heading || 0}
              anchor={{ x: 0.5, y: 0.5 }}
              flat
            >
              <View style={s.carMarker}>
                <Ionicons name="navigate" size={22} color={COLORS.primary} />
              </View>
            </Marker>
          )}

          {/* Destination marker */}
          {ride?.toLat && ride?.toLng && (
            <Marker
              coordinate={{ latitude: ride.toLat, longitude: ride.toLng }}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={s.destMarker}>
                <Ionicons name="location" size={28} color={COLORS.danger} />
              </View>
            </Marker>
          )}
        </MapView>
      ) : (
        <View style={[StyleSheet.absoluteFill, s.mapFallback]}>
          <Ionicons name="map-outline" size={48} color="#ccc" />
          <Text style={s.mapFallbackText}>Map not available in Expo Go</Text>
          <Text style={s.mapFallbackSub}>Use a development build to see the live map</Text>
        </View>
      )}

      {/* ── Top Header ───────────────────────────────────────────────── */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerRoute} numberOfLines={1}>
            {ride?.fromCity} → {ride?.toCity}
          </Text>
          <Text style={s.headerSub}>
            {driver ? `${ride?.date} • ${ride?.departureTime}` : 'Live Ride Tracking'}
          </Text>
        </View>
        <View style={s.livePill}>
          <LiveDot active />
          <Text style={s.liveText}>LIVE</Text>
        </View>
      </View>

      {/* ── Bottom Panel ─────────────────────────────────────────────── */}
      <View style={s.panel}>
        <View style={s.handle} />

        {driver ? (
          // ─── DRIVER PANEL ─────────────────────────────────────────────
          <>
            {/* Stats — no earnings */}
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Text style={s.statVal}>{confirmedBookings.length}/{ride?.totalSeats}</Text>
                <Text style={s.statLabel}>Passengers</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statVal}>{elapsed}</Text>
                <Text style={s.statLabel}>Elapsed</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Text style={s.statVal}>{currentSpeed} <Text style={{ fontSize: 11, fontWeight: '600' }}>km/h</Text></Text>
                <Text style={s.statLabel}>Speed</Text>
              </View>
            </View>

            {/* Passenger list */}
            <Text style={s.sectionTitle}>Onboard Passengers</Text>
            <FlatList
              data={confirmedBookings}
              keyExtractor={item => item.id}
              style={s.passengerList}
              scrollEnabled={confirmedBookings.length > 2}
              renderItem={({ item }) => (
                <View style={s.passengerRow}>
                  <Avatar name={item.passenger?.name} size={42} />
                  <View style={s.pInfo}>
                    <Text style={s.pName}>{item.passenger?.name}</Text>
                    <Text style={s.pMeta}>
                      {item.boardingCity || ride?.fromCity}
                      {item.exitCity && item.exitCity !== ride?.toCity ? ` → ${item.exitCity}` : ''}
                      {'  •  '}{item.seats} seat{item.seats !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity style={s.callBtn} onPress={() => handleCall(item.passenger?.phone)}>
                    <Ionicons name="call" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={s.emptyText}>No confirmed passengers yet.</Text>
              }
            />

            {/* Finish button */}
            <View style={s.finishWrap}>
              <TouchableOpacity
                style={s.finishBtn}
                onPress={handleFinishRide}
                disabled={isFinishing}
                activeOpacity={0.85}
              >
                {isFinishing
                  ? <ActivityIndicator color="#fff" />
                  : (
                    <>
                      <Ionicons name="flag" size={20} color="#fff" />
                      <Text style={s.finishBtnText}>Finish Ride</Text>
                    </>
                  )
                }
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // ─── PASSENGER PANEL ──────────────────────────────────────────
          <>
            {/* Driver card */}
            <View style={s.driverCard}>
              <Avatar name={ride?.driver?.name} size={54} />
              <View style={s.driverMeta}>
                <Text style={s.driverName}>{ride?.driver?.name || 'Your Driver'}</Text>
                <Stars rating={driverRating} />
                <Text style={s.vehicleText} numberOfLines={1}>
                  {[ride?.vehicle?.brand, ride?.vehicle?.model].filter(Boolean).join(' ') || ride?.vehicle?.type || 'Vehicle'}
                  {ride?.vehicle?.plateNumber ? ` • ${ride?.vehicle?.plateNumber}` : ''}
                </Text>
              </View>
              <TouchableOpacity style={s.callDriverBtn} onPress={() => handleCall(ride?.driver?.phone)}>
                <Ionicons name="call" size={20} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Route row */}
            <View style={s.routeRow}>
              <View style={[s.routeDot, { backgroundColor: COLORS.primary }]} />
              <Text style={s.routeCity}>{ride?.fromCity}</Text>
              <View style={s.routeLine} />
              <Ionicons name="arrow-forward" size={14} color={COLORS.gray} />
              <View style={s.routeLine} />
              <View style={[s.routeDot, { backgroundColor: COLORS.danger }]} />
              <Text style={s.routeCity}>{ride?.toCity}</Text>
            </View>

            {/* My trip details */}
            {myBooking && (
              <View style={s.tripInfoRow}>
                <View style={s.tripInfoItem}>
                  <Ionicons name="enter-outline" size={14} color={COLORS.teal} />
                  <Text style={s.tripInfoLabel}>Boarding</Text>
                  <Text style={s.tripInfoVal}>{myBooking.boardingCity || ride?.fromCity}</Text>
                </View>
                <View style={s.tripInfoDivider} />
                <View style={s.tripInfoItem}>
                  <Ionicons name="exit-outline" size={14} color={COLORS.secondary} />
                  <Text style={s.tripInfoLabel}>Exit</Text>
                  <Text style={s.tripInfoVal}>{myBooking.exitCity || ride?.toCity}</Text>
                </View>
                <View style={s.tripInfoDivider} />
                <View style={s.tripInfoItem}>
                  <Ionicons name="people-outline" size={14} color={COLORS.gray} />
                  <Text style={s.tripInfoLabel}>Seats</Text>
                  <Text style={s.tripInfoVal}>{myBooking.seats}</Text>
                </View>
              </View>
            )}

            {/* Live status */}
            <View style={s.liveStatus}>
              <LiveDot active={!!currentLocation} />
              <Text style={s.liveStatusText}>
                {currentLocation ? 'Driver location tracking live' : 'Waiting for driver location...'}
              </Text>
            </View>

            {/* Safety buttons */}
            <View style={s.safetyRow}>
              <TouchableOpacity style={[s.safetyBtn, s.sosBtn]} onPress={() => handleCall('1122')}>
                <Ionicons name="warning" size={20} color="#fff" />
                <Text style={s.safetyBtnText}>SOS 1122</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.safetyBtn, s.callBtn2]} onPress={() => handleCall(ride?.driver?.phone)}>
                <Ionicons name="call" size={20} color="#fff" />
                <Text style={s.safetyBtnText}>Call Driver</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* ── Driver Review Modal ───────────────────────────────────────── */}
      {ratingIndex >= 0 && ratingIndex < confirmedBookings.length && (
        <ReviewModal
          visible
          onClose={advanceRating}
          onSubmit={advanceRating}
          rideId={rideId}
          revieweeId={confirmedBookings[ratingIndex].passengerId}
          revieweeName={confirmedBookings[ratingIndex].passenger?.name || 'Passenger'}
          targetRole="PASSENGER"
          routeLabel={`${ride?.fromCity} → ${ride?.toCity}`}
          routeDate={ride?.date}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#000' },
  mapFallback: { backgroundColor: '#e8f0e8', alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapFallbackText: { fontSize: 15, fontWeight: '700', color: '#666' },
  mapFallbackSub:  { fontSize: 12, color: '#999', textAlign: 'center', paddingHorizontal: 40 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d1b4b', gap: 14 },
  loadingText: { fontSize: 14, color: '#fff', fontWeight: '600' },

  // Header
  header: {
    position: 'absolute', top: Platform.OS === 'ios' ? 52 : 22, left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 14, elevation: 12, zIndex: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerRoute:  { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:    { fontSize: 11, color: COLORS.gray, marginTop: 1, fontWeight: '500' },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f0fdf4', borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  liveText: { fontSize: 10, fontWeight: '800', color: '#16a34a', letterSpacing: 1 },

  // Map markers
  carMarker: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  destMarker: { alignItems: 'center' },

  // Panel
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 38 : 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 24,
  },
  handle: {
    width: 40, height: 4, backgroundColor: '#e5e7eb',
    borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 18,
  },

  // Driver — stats
  statsRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#f8faff', borderRadius: 18,
    padding: 14, marginBottom: 20,
    borderWidth: 1, borderColor: '#eef2ff',
  },
  statItem:   { flex: 1, alignItems: 'center' },
  statVal:    { fontSize: 20, fontWeight: '900', color: COLORS.textPrimary },
  statLabel:  { fontSize: 10, color: COLORS.gray, marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 },
  statDivider: { width: 1, height: '70%', backgroundColor: '#dde3f0', alignSelf: 'center' },

  // Driver — passenger list
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginHorizontal: 20, marginBottom: 10 },
  passengerList: { maxHeight: 170, marginHorizontal: 20, marginBottom: 12 },
  passengerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fafbff', borderRadius: 14,
    padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#eef2ff',
  },
  pInfo:    { flex: 1 },
  pName:    { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  pMeta:    { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  callBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', fontSize: 13, color: COLORS.gray, marginVertical: 8 },

  // Driver — finish button
  finishWrap: { paddingHorizontal: 20, marginTop: 4 },
  finishBtn: {
    height: 58, borderRadius: 18,
    backgroundColor: '#ef4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35, shadowRadius: 14, elevation: 8,
  },
  finishBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  // Passenger — driver card
  driverCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16, gap: 14,
  },
  driverMeta:  { flex: 1, gap: 3 },
  driverName:  { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  vehicleText: { fontSize: 12, color: COLORS.gray, fontWeight: '500' },
  callDriverBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },

  // Passenger — route row
  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 14, gap: 6,
  },
  routeDot:  { width: 10, height: 10, borderRadius: 5 },
  routeLine: { flex: 1, height: 1.5, backgroundColor: '#e5e7eb' },
  routeCity: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary },

  // Passenger — trip info
  tripInfoRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#f8faff', borderRadius: 16,
    padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: '#eef2ff',
  },
  tripInfoItem:    { flex: 1, alignItems: 'center', gap: 3 },
  tripInfoLabel:   { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.4 },
  tripInfoVal:     { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  tripInfoDivider: { width: 1, height: '80%', backgroundColor: '#e5e7eb', alignSelf: 'center' },

  // Passenger — live status
  liveStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 16,
    backgroundColor: '#f0fdf4', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#bbf7d0',
  },
  liveStatusText: { fontSize: 13, fontWeight: '600', color: '#166534' },

  // Passenger — safety
  safetyRow: { flexDirection: 'row', marginHorizontal: 20, gap: 12 },
  safetyBtn: {
    flex: 1, height: 52, borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  sosBtn:       { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
  callBtn2:     { backgroundColor: COLORS.primary, shadowColor: COLORS.primary },
  safetyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
