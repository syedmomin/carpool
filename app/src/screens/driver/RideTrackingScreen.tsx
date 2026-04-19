import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Dimensions, ActivityIndicator, Animated, FlatList, Linking, StatusBar,
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
const isDriverRole = (role?: string) => role === 'DRIVER';

// ─── Elapsed timer ────────────────────────────────────────────────────────────
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

// ─── Pulsing live dot ─────────────────────────────────────────────────────────
function LiveDot({ active }: { active: boolean }) {
  const scale   = useRef(new Animated.Value(1)).current;
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
  wrap: { width: 18, height: 18, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: '#22c55e', opacity: 0.4 },
  core: { width: 9, height: 9, borderRadius: 5, backgroundColor: '#22c55e' },
});

// ─── Stars ────────────────────────────────────────────────────────────────────
function Stars({ rating }: { rating: number | null }) {
  const r = rating ?? 0;
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Ionicons key={n} name={n <= Math.round(r) ? 'star' : 'star-outline'} size={11} color={COLORS.warning} />
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
  const { showToast }  = useToast();
  const { showModal }  = useGlobalModal();
  const { currentUser } = useApp();
  const driver = isDriverRole(currentUser?.role);

  const [ride, setRide]                       = useState<any>(null);
  const [loading, setLoading]                 = useState(true);
  const [driverLocation, setDriverLocation]   = useState<any>(null);
  const [currentSpeed, setCurrentSpeed]       = useState(0);
  const [isFinishing, setIsFinishing]         = useState(false);
  const [ratingIndex, setRatingIndex]         = useState(-1);
  const [mapReady, setMapReady]               = useState(false);
  const [recentering, setRecentering]         = useState(false);

  const locationSub = useRef<any>(null);
  const mapRef      = useRef<any>(null);
  const mountedRef  = useRef(true);

  const elapsed = useElapsed(driver && !loading);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    fetchRide();
    socketService.connect();
    socketService.joinRide(rideId, driver ? 'driver' : 'rider');

    // Passenger: receive driver's live location from socket
    const onLocationUpdate = (payload: any) => {
      if (!mountedRef.current || payload.rideId !== rideId) return;
      const { latitude, longitude, heading } = payload;
      setDriverLocation({ latitude, longitude, heading });
      mapRef.current?.updateDriverLocation?.(latitude, longitude, heading || 0);
    };

    const onRideCompleted = (data: any) => {
      if (!mountedRef.current || data.rideId !== rideId) return;
      if (driver) {
        navigation.navigate('DriverApp', { screen: 'MyRidesTab' });
      } else {
        navigation.navigate('PassengerApp', { screen: 'PassengerHomeTab' });
      }
    };

    if (driver) {
      // Start GPS after a short delay to let map mount
      setTimeout(() => startTracking(), 800);
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

  // Once map is ready + we have driver location, fit bounds
  useEffect(() => {
    if (!mapReady || !ride) return;
    if (driverLocation) {
      mapRef.current?.updateDriverLocation?.(
        driverLocation.latitude,
        driverLocation.longitude,
        driverLocation.heading || 0
      );
    }
  }, [mapReady]);

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
      showToast('Location permission denied. Please enable in Settings.', 'error');
      return;
    }

    // Get initial position immediately
    try {
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      if (!mountedRef.current) return;
      const { latitude, longitude, heading, speed, accuracy } = initial.coords;
      setDriverLocation({ latitude, longitude, heading });
      setCurrentSpeed(Math.round((speed || 0) * 3.6));
      mapRef.current?.updateDriverLocation?.(latitude, longitude, heading || 0);
      mapRef.current?.updateUserLocation?.(latitude, longitude, accuracy || 20);
      mapRef.current?.animateCamera?.({ center: { latitude, longitude }, zoom: 16 });
      socketService.emitLocation({ rideId, latitude, longitude, heading, speed });
    } catch (_) {}

    // Watch position continuously
    const sub = await Location.watchPositionAsync(
      {
        accuracy:         Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval:     2000,
      },
      (loc) => {
        if (!mountedRef.current) return;
        const { latitude, longitude, heading, speed, accuracy } = loc.coords;
        setDriverLocation({ latitude, longitude, heading });
        setCurrentSpeed(Math.round((speed || 0) * 3.6));
        // Update map driver marker + camera
        mapRef.current?.updateDriverLocation?.(latitude, longitude, heading || 0);
        mapRef.current?.updateUserLocation?.(latitude, longitude, accuracy || 20);
        mapRef.current?.animateCamera?.({ center: { latitude, longitude }, zoom: 16 });
        // Broadcast to passengers via socket
        socketService.emitLocation({ rideId, latitude, longitude, heading, speed });
      }
    );
    locationSub.current = sub;
  };

  const stopTracking = () => {
    locationSub.current?.remove();
    locationSub.current = null;
  };

  const handleRecenter = () => {
    if (!driverLocation) return;
    setRecentering(true);
    mapRef.current?.animateCamera?.({ center: driverLocation, zoom: 17 });
    setTimeout(() => setRecentering(false), 800);
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
          showToast('Ride completed! 🏁', 'success');
          if (confirmedBookings.length > 0) {
            setRatingIndex(0);
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
        <StatusBar barStyle="light-content" backgroundColor="#0d1b4b" />
        <LinearGradient colors={['#0d1b4b', '#1d4ed8']} style={StyleSheet.absoluteFill} />
        <View style={s.loadingInner}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={s.loadingText}>Starting tracking session...</Text>
          <Text style={s.loadingSubText}>Getting GPS signal</Text>
        </View>
      </View>
    );
  }

  const confirmedBookings = ride?.bookings?.filter((b: any) => b.status === 'CONFIRMED') || [];
  const myBooking         = !driver ? ride?.bookings?.find((b: any) => b.passengerId === currentUser?.id) : null;
  const driverRating      = ride?.driver?.rating ?? null;

  const initialRegion = driverLocation
    ? { ...driverLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 }
    : { latitude: 30.3753, longitude: 69.3451, latitudeDelta: 0.02, longitudeDelta: 0.02 };

  return (
    <View style={s.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* ── Full-screen Map ───────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        onLayout={() => setMapReady(true)}
      >
        {/* Driver car marker (used only on initial render — live updates via mapRef) */}
        {driverLocation && (
          <Marker
            coordinate={{ latitude: driverLocation.latitude, longitude: driverLocation.longitude }}
            pinColor="green"
            isDriver
            rotation={driverLocation.heading || 0}
            title={driver ? 'You' : `Driver: ${ride?.driver?.name || ''}`}
          />
        )}

        {/* Destination / drop-off marker */}
        {ride?.toLat && ride?.toLng && (
          <Marker
            coordinate={{ latitude: ride.toLat, longitude: ride.toLng }}
            pinColor="red"
            title={ride?.toCity || 'Destination'}
          />
        )}

        {/* Pickup marker */}
        {ride?.fromLat && ride?.fromLng && (
          <Marker
            coordinate={{ latitude: ride.fromLat, longitude: ride.fromLng }}
            pinColor="blue"
            title={ride?.fromCity || 'Pickup'}
          />
        )}
      </MapView>

      {/* ── Recenter FAB ─────────────────────────────────────────────── */}
      {driverLocation && (
        <TouchableOpacity style={s.recenterFab} onPress={handleRecenter} activeOpacity={0.85}>
          {recentering
            ? <ActivityIndicator size="small" color={COLORS.primary} />
            : <Ionicons name="locate" size={22} color={COLORS.primary} />
          }
        </TouchableOpacity>
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
            {driver ? `${ride?.date} · ${ride?.departureTime}` : 'Live Ride Tracking'}
          </Text>
        </View>
        <View style={s.livePill}>
          <LiveDot active />
          <Text style={s.liveText}>LIVE</Text>
        </View>
      </View>

      {/* ── Bottom Panel ─────────────────────────────────────────────── */}
      <View style={s.panel}>
        {/* Gradient accent line at top of panel */}
        <LinearGradient
          colors={[COLORS.primary, '#7c3aed']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.panelAccent}
        />
        <View style={s.handle} />

        {driver ? (
          /* ─── DRIVER PANEL ──────────────────────────────────────────── */
          <>
            <View style={s.statsRow}>
              <View style={s.statItem}>
                <Ionicons name="people" size={16} color={COLORS.primary} style={{ marginBottom: 4 }} />
                <Text style={s.statVal}>{confirmedBookings.length}/{ride?.totalSeats}</Text>
                <Text style={s.statLabel}>Passengers</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="time" size={16} color="#7c3aed" style={{ marginBottom: 4 }} />
                <Text style={s.statVal}>{elapsed}</Text>
                <Text style={s.statLabel}>Elapsed</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statItem}>
                <Ionicons name="speedometer" size={16} color="#0891b2" style={{ marginBottom: 4 }} />
                <Text style={s.statVal}>
                  {currentSpeed}<Text style={{ fontSize: 11, fontWeight: '600' }}> km/h</Text>
                </Text>
                <Text style={s.statLabel}>Speed</Text>
              </View>
            </View>

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
                      {'  ·  '}{item.seats} seat{item.seats !== 1 ? 's' : ''}
                    </Text>
                  </View>
                  <TouchableOpacity style={s.callBtn} onPress={() => handleCall(item.passenger?.phone)}>
                    <Ionicons name="call" size={18} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={<Text style={s.emptyText}>No confirmed passengers yet.</Text>}
            />

            <View style={s.finishWrap}>
              <TouchableOpacity
                style={s.finishBtn}
                onPress={handleFinishRide}
                disabled={isFinishing}
                activeOpacity={0.85}
              >
                {isFinishing
                  ? <ActivityIndicator color="#fff" />
                  : <><Ionicons name="flag" size={20} color="#fff" /><Text style={s.finishBtnText}>Finish Ride</Text></>
                }
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ─── PASSENGER PANEL ───────────────────────────────────────── */
          <>
            {/* Driver card with gradient background */}
            <LinearGradient
              colors={['#eef2ff', '#f0fdf4']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={s.driverCardGrad}
            >
              <Avatar name={ride?.driver?.name} size={58} />
              <View style={s.driverMeta}>
                <Text style={s.driverName}>{ride?.driver?.name || 'Your Driver'}</Text>
                <Stars rating={driverRating} />
                <View style={s.vehiclePill}>
                  <Ionicons name="car-sport" size={12} color={COLORS.primary} />
                  <Text style={s.vehicleText} numberOfLines={1}>
                    {[ride?.vehicle?.brand, ride?.vehicle?.model].filter(Boolean).join(' ') || ride?.vehicle?.type || 'Vehicle'}
                    {ride?.vehicle?.plateNumber ? ` · ${ride?.vehicle?.plateNumber}` : ''}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={s.callDriverBtn} onPress={() => handleCall(ride?.driver?.phone)}>
                <LinearGradient colors={GRADIENTS.primary as any} style={s.callDriverBtnInner}>
                  <Ionicons name="call" size={20} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            <View style={s.routeRow}>
              <View style={[s.routeDot, { backgroundColor: '#2563eb' }]} />
              <Text style={s.routeCity}>{ride?.fromCity}</Text>
              <View style={s.routeLine} />
              <Ionicons name="arrow-forward" size={14} color={COLORS.gray} />
              <View style={s.routeLine} />
              <View style={[s.routeDot, { backgroundColor: '#ef4444' }]} />
              <Text style={s.routeCity}>{ride?.toCity}</Text>
            </View>

            {myBooking && (
              <View style={s.tripInfoRow}>
                <View style={s.tripInfoItem}>
                  <Ionicons name="enter-outline" size={14} color={COLORS.primary} />
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

            <View style={s.liveStatus}>
              <LiveDot active={!!driverLocation} />
              <Text style={s.liveStatusText}>
                {driverLocation ? 'Driver location live on map' : 'Waiting for driver location...'}
              </Text>
            </View>

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

      {/* ── Driver rating modal after ride finish ─────────────────────── */}
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
  container:       { flex: 1, backgroundColor: '#e8edf2' },
  loadingWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingInner:    { alignItems: 'center', gap: 14 },
  loadingText:     { fontSize: 16, color: '#fff', fontWeight: '700' },
  loadingSubText:  { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },

  // Recenter FAB
  recenterFab: {
    position: 'absolute',
    right: 16,
    bottom: Platform.OS === 'ios' ? 340 : 320,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 10,
    zIndex: 9,
  },

  // Header
  header: {
    position: 'absolute', top: Platform.OS === 'ios' ? 56 : 28,
    left: 16, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 11,
    shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18, shadowRadius: 16, elevation: 14, zIndex: 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.8)',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center',
  },
  headerCenter: { flex: 1 },
  headerRoute:  { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:    { fontSize: 11, color: COLORS.gray, marginTop: 1, fontWeight: '500' },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#f0fdf4', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 5,
    borderWidth: 1, borderColor: '#86efac',
  },
  liveText: { fontSize: 10, fontWeight: '900', color: '#15803d', letterSpacing: 1.5 },

  // Panel
  panel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 32, borderTopRightRadius: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 22,
    shadowColor: '#000', shadowOffset: { width: 0, height: -12 },
    shadowOpacity: 0.14, shadowRadius: 24, elevation: 28,
    overflow: 'hidden',
  },
  panelAccent: {
    height: 4, borderTopLeftRadius: 32, borderTopRightRadius: 32,
  },
  handle: {
    width: 44, height: 4, backgroundColor: '#e2e8f0',
    borderRadius: 2, alignSelf: 'center', marginTop: 14, marginBottom: 18,
  },

  // Driver stats
  statsRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#f8faff', borderRadius: 20,
    padding: 16, marginBottom: 18,
    borderWidth: 1, borderColor: '#e0e7ff',
  },
  statItem:    { flex: 1, alignItems: 'center', gap: 2 },
  statVal:     { fontSize: 19, fontWeight: '900', color: COLORS.textPrimary },
  statLabel:   { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.6 },
  statDivider: { width: 1, height: '75%', backgroundColor: '#dde3f0', alignSelf: 'center' },

  sectionTitle:  { fontSize: 14, fontWeight: '800', color: COLORS.textPrimary, marginHorizontal: 20, marginBottom: 10 },
  passengerList: { maxHeight: 155, marginHorizontal: 20, marginBottom: 12 },
  passengerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fafbff', borderRadius: 16,
    padding: 11, marginBottom: 8,
    borderWidth: 1, borderColor: '#eef2ff',
  },
  pInfo:    { flex: 1 },
  pName:    { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  pMeta:    { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  callBtn:  { width: 38, height: 38, borderRadius: 19, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' },
  emptyText: { textAlign: 'center', fontSize: 13, color: COLORS.gray, marginVertical: 8 },

  finishWrap: { paddingHorizontal: 20, marginTop: 4 },
  finishBtn: {
    height: 58, borderRadius: 20, backgroundColor: '#ef4444',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  finishBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  // Passenger
  driverCardGrad: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 16, gap: 14,
    borderRadius: 20, padding: 14,
    borderWidth: 1, borderColor: '#e0e7ff',
  },
  driverMeta:       { flex: 1, gap: 4 },
  driverName:       { fontSize: 17, fontWeight: '800', color: COLORS.textPrimary },
  vehiclePill:      { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  vehicleText:      { fontSize: 12, color: COLORS.gray, fontWeight: '600', flex: 1 },
  callDriverBtn:    { width: 52, height: 52, borderRadius: 26, overflow: 'hidden',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6 },
  callDriverBtnInner: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  routeRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 14, gap: 6,
  },
  routeDot:  { width: 11, height: 11, borderRadius: 6, borderWidth: 2, borderColor: '#fff',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  routeLine: { flex: 1, height: 2, backgroundColor: '#e2e8f0', borderRadius: 1 },
  routeCity: { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary },

  tripInfoRow: {
    flexDirection: 'row', marginHorizontal: 20,
    backgroundColor: '#f8faff', borderRadius: 18,
    padding: 12, marginBottom: 14,
    borderWidth: 1, borderColor: '#eef2ff',
  },
  tripInfoItem:    { flex: 1, alignItems: 'center', gap: 3 },
  tripInfoLabel:   { fontSize: 10, color: COLORS.gray, textTransform: 'uppercase', letterSpacing: 0.5 },
  tripInfoVal:     { fontSize: 13, fontWeight: '800', color: COLORS.textPrimary, textAlign: 'center' },
  tripInfoDivider: { width: 1, height: '80%', backgroundColor: '#e2e8f0', alignSelf: 'center' },

  liveStatus: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 20, marginBottom: 14,
    backgroundColor: '#f0fdf4', borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: '#86efac',
  },
  liveStatusText: { fontSize: 13, fontWeight: '700', color: '#15803d' },

  safetyRow: { flexDirection: 'row', marginHorizontal: 20, gap: 12 },
  safetyBtn: {
    flex: 1, height: 54, borderRadius: 18,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 10, elevation: 6,
  },
  sosBtn:        { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
  callBtn2:      { backgroundColor: COLORS.primary, shadowColor: COLORS.primary },
  safetyBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
