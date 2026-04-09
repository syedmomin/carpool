import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Platform,
  Dimensions, ActivityIndicator, Alert, SafeAreaView, FlatList, Linking
} from 'react-native';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from '../../components/Map';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, Avatar, StatusBadge } from '../../components';
import { ridesApi } from '../../services/api';
import { socketService } from '../../services/socket.service';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import ReviewModal from '../../components/ReviewModal';

const { width, height } = Dimensions.get('window');

export default function RideTrackingScreen({ route, navigation }) {
  const { rideId } = route.params;
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const { currentUser } = useApp();

  const [ride, setRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [ratingTargetIndex, setRatingTargetIndex] = useState(-1);


  const mapRef = useRef(null);

  useEffect(() => {
    fetchRideData();
    socketService.connect();
    
    const role = currentUser?.role === 'DRIVER' ? 'driver' : 'rider';
    socketService.joinRide(rideId, role);

    if (role === 'driver') {
      startTracking();
    } else {
      // Listen for driver location updates
      socketService.onLocationUpdate((payload) => {
        if (payload.rideId === rideId) {
          setCurrentLocation({ 
            latitude: payload.latitude, 
            longitude: payload.longitude,
            heading: payload.heading,
            speed: payload.speed
          });
          
          // Smoothly move map to driver location
          mapRef.current?.animateToRegion({
            latitude: payload.latitude,
            longitude: payload.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }, 1000);
        }
      });
    }

    // 5. Listen for Ride Completion (if someone else ends it)
    socketService.on('RIDE_COMPLETED', (data: any) => {
      if (data.rideId === rideId) {
        showModal({
          type: 'success',
          title: 'Ride Completed! ⭐',
          message: 'The driver has completed the trip. Hope you had a safe journey!',
          confirmText: 'Go Back',
          onConfirm: () => navigation.replace(currentUser?.role === 'DRIVER' ? 'MyRides' : 'BookingHistory'),
        });
      }
    });

    return () => {
      stopTracking();
      socketService.offLocationUpdate();
      socketService.off('RIDE_COMPLETED');
      socketService.leaveRide(rideId);
    };
  }, [rideId]);

  const fetchRideData = async () => {
    try {
      const { data, error } = await ridesApi.getById(rideId);
      if (data) {
        setRide(data);
      } else {
        showToast(error || 'Failed to load ride details', 'error');
        navigation.goBack();
      }
    } catch (err) {
      showToast('Error loading ride data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      showToast('Permission to access location was denied', 'error');
      return;
    }

    const sub = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        const { latitude, longitude, heading, speed } = location.coords;
        const coords = { latitude, longitude };
        setCurrentLocation(coords);

        // Emit to socket for passengers
        socketService.emitLocation({
          rideId,
          latitude,
          longitude,
          heading,
          speed
        });

        // Center map if needed (can be optional for better UX)
        // mapRef.current?.animateToRegion({
        //   ...coords,
        //   latitudeDelta: 0.01,
        //   longitudeDelta: 0.01,
        // });
      }
    );
    setLocationSubscription(sub);
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
  };

  const handleCall = (phone: string) => {
    if (!phone) {
      showToast('Phone number not available', 'error');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      showToast('Unable to open dialer', 'error');
    });
  };

  const handleFinishRide = () => {
    showModal({
      type: 'info',
      title: 'Finish Ride?',
      message: 'Are you sure you want to end this ride? All passengers will be notified.',
      confirmText: 'Finish Ride',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setIsFinishing(true);
          const { error } = await ridesApi.updateStatus(rideId, 'COMPLETED');
          if (error) {
            showToast(error, 'error');
          } else {
            showToast('Ride completed successfully!', 'success');
            
            // Initiate rating flow for passengers
            if (confirmedBookings.length > 0) {
              setRatingTargetIndex(0);
            } else {
              navigation.replace('MyRides');
            }
          }

        } catch (err) {
          showToast('Failed to complete ride', 'error');
        } finally {
          setIsFinishing(false);
        }
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Initializing tracking...</Text>
      </View>
    );
  }

  const confirmedBookings = ride?.bookings?.filter(b => b.status === 'CONFIRMED') || [];

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        showsUserLocation={true}
        followsUserLocation={true}
        initialRegion={{
          latitude: currentLocation?.latitude || 24.8607,
          longitude: currentLocation?.longitude || 67.0011,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {/* Pulse Marker for Destination */}
        {ride?.toLat && ride?.toLng && (
          <Marker
            coordinate={{ latitude: ride.toLat, longitude: ride.toLng }}
            title="Destination"
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.pulseContainer}>
              <View style={styles.pulse} />
              <View style={styles.pulseInner} />
            </View>
          </Marker>
        )}

        {/* Car Marker for Driver */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            rotation={currentLocation.heading || 0}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
          >
            <View style={styles.carMarker}>
              <Ionicons name="navigate" size={26} color={COLORS.primary} />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Header Overlay — Conditional content based on role */}
      <View style={styles.headerOverlay}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="chevron-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            {currentUser?.role === 'DRIVER' ? (
              <>
                <Text style={styles.headerRoute} numberOfLines={1}>
                  Heading to {ride?.toCity}
                </Text>
                <Text style={styles.headerSub}>Destination • {ride?.departureTime}</Text>
              </>
            ) : (
              <>
                <Text style={styles.headerRoute} numberOfLines={1}>
                  Trip to {ride?.toCity}
                </Text>
                <Text style={styles.headerSub}>Active Trip • Tracking Driver</Text>
              </>
            )}
          </View>
          <StatusBadge status="in_progress" label="Ongoing" />
        </View>
      </View>


      {/* Role-Based Bottom Panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.handle} />
        
        {currentUser?.role === 'DRIVER' ? (
          // ─── DRIVER VIEW ───
          <>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Passengers</Text>
                <Text style={styles.statValue}>{confirmedBookings.length}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Earned</Text>
                <Text style={styles.statValue}>Rs {ride?.bookedSeats * ride?.pricePerSeat}</Text>
              </View>
            </View>

            <Text style={styles.passengerHeader}>Onboard Passengers ({confirmedBookings.length})</Text>
            
            <FlatList
              data={confirmedBookings}
              keyExtractor={item => item.id}
              style={styles.passengerList}
              renderItem={({ item }) => (
                <View style={styles.passengerItem}>
                  <Avatar name={item.passenger?.name} size={40} />
                  <View style={styles.passengerInfo}>
                    <Text style={styles.passengerName}>{item.passenger?.name}</Text>
                    <Text style={styles.passengerDetail}>
                      {item.seats} seat(s) • {item.boardingCity || ride.fromCity}
                    </Text>
                  </View>
                  <TouchableOpacity 
                    style={styles.callBtn}
                    onPress={() => handleCall(item.passenger?.phone)}
                  >
                    <Ionicons name="call" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyPassengers}>No confirmed passengers yet.</Text>
              }
            />

            <View style={styles.finishBtnContainer}>
              <TouchableOpacity 
                style={styles.finishBtn} 
                onPress={handleFinishRide}
                disabled={isFinishing}
                activeOpacity={0.8}
              >
                {isFinishing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="flag-outline" size={22} color="#fff" />
                    <Text style={styles.finishBtnText}>Finish Ride Session</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : (
          // ─── PASSENGER VIEW (No Earnings) ───
          <>
            <View style={styles.driverCard}>
              <Avatar name={ride?.driver?.name} size={60} />
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{ride?.driver?.name}</Text>
                <View style={styles.driverSubRow}>
                  <Text style={styles.carDetail}>
                    {ride?.vehicle?.type || 'Vehicle'} • {ride?.vehicle?.plateNumber || 'TBD'}
                  </Text>
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.ratingText}>4.9</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.safetyRow}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.sosBtn]}
                onPress={() => handleCall('1122')}
              >
                <Ionicons name="warning" size={24} color="#fff" />
                <Text style={styles.actionBtnText}>SOS</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionBtn, styles.callDriverBtn]}
                onPress={() => handleCall(ride?.driver?.phone)}
              >
                <Ionicons name="call" size={24} color="#fff" />
                <Text style={styles.actionBtnText}>Call Driver</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.gray} />
              <Text style={styles.infoBoxText}>
                The driver is currently navigating towards the destination. Your location is being shared for safety.
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Rating Flow for Driver */}
      {ratingTargetIndex >= 0 && ratingTargetIndex < confirmedBookings.length && (
        <ReviewModal
          visible={true}
          onClose={() => {
            if (ratingTargetIndex === confirmedBookings.length - 1) {
              setRatingTargetIndex(-1);
              navigation.replace('MyRides');
            } else {
              setRatingTargetIndex(ratingTargetIndex + 1);
            }
          }}
          onSubmit={() => {
            if (ratingTargetIndex === confirmedBookings.length - 1) {
              setRatingTargetIndex(-1);
              navigation.replace('MyRides');
            } else {
              setRatingTargetIndex(ratingTargetIndex + 1);
            }
          }}
          rideId={rideId}
          revieweeId={confirmedBookings[ratingTargetIndex].passengerId}
          revieweeName={confirmedBookings[ratingTargetIndex].passenger?.name || 'Passenger'}
          targetRole="PASSENGER"
          routeLabel={`${ride?.fromCity} → ${ride?.toCity}`}
          routeDate={ride?.date}
        />
      )}
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0d1b4b' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#fff', fontWeight: '600' },
  map: { ...StyleSheet.absoluteFillObject },
  
  headerOverlay: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 20, 
    left: 20, 
    right: 20, 
    zIndex: 10 
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  backBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: '#fff', 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  headerInfo: { flex: 1, marginLeft: 15 },
  headerRoute: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: 11, color: COLORS.gray, marginTop: 2, fontWeight: '600' },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -15 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 25,
  },
  handle: { 
    width: 45, 
    height: 5, 
    backgroundColor: '#e0e0e0', 
    borderRadius: 3, 
    alignSelf: 'center', 
    marginTop: 12, 
    marginBottom: 20 
  },
  statsRow: { 
    flexDirection: 'row', 
    marginHorizontal: 25, 
    backgroundColor: '#f8faff', 
    borderRadius: 20, 
    padding: 15, 
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#eef2f8'
  },
  statItem: { flex: 1, alignItems: 'center' },
  statLabel: { fontSize: 11, color: COLORS.gray, marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 19, fontWeight: '900', color: COLORS.textPrimary },
  statDivider: { width: 1, height: '70%', backgroundColor: '#d0d8e2', alignSelf: 'center' },

  passengerHeader: { 
    fontSize: 15, 
    fontWeight: '800', 
    color: '#1a1a1a', 
    marginHorizontal: 25, 
    marginBottom: 15 
  },
  passengerList: { 
    paddingHorizontal: 25, 
    maxHeight: 180,
    marginBottom: 15 
  },
  passengerItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0'
  },
  passengerInfo: { flex: 1, marginLeft: 12 },
  passengerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  passengerDetail: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  callBtn: { 
    width: 42, 
    height: 42, 
    borderRadius: 21, 
    backgroundColor: '#f0f4ff', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  emptyPassengers: { textAlign: 'center', fontSize: 13, color: COLORS.gray, marginVertical: 10 },
  
  finishBtnContainer: {
    paddingHorizontal: 25,
    marginTop: 5,
  },
  finishBtn: {
    backgroundColor: '#ff4b5c', // Uber Danger Red
    height: 60,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ff4b5c',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    gap: 10,
  },
  finishBtnText: { color: '#fff', fontSize: 17, fontWeight: '900', letterSpacing: 0.3 },

  // Pulse & Car Marker Styles
  pulseContainer: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  pulse: { 
    position: 'absolute', 
    width: 30, height: 30, borderRadius: 15, 
    backgroundColor: COLORS.secondary, opacity: 0.3 
  },
  pulseInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.secondary },
  carMarker: {
    backgroundColor: '#fff',
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 5
  },
  
  // Passenger Specific Styles
  driverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    marginBottom: 20
  },
  driverInfo: { flex: 1, marginLeft: 15 },
  driverName: { fontSize: 18, fontWeight: '800', color: COLORS.textPrimary },
  driverSubRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 },
  carDetail: { fontSize: 13, color: COLORS.gray, fontWeight: '500' },
  ratingBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fffbeb', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 8,
    gap: 4
  },
  ratingText: { fontSize: 12, fontWeight: '700', color: '#d97706' },
  
  safetyRow: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    gap: 15,
    marginBottom: 20
  },
  actionBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8
  },
  sosBtn: { backgroundColor: '#ff4b5c', shadowColor: '#ff4b5c' },
  callDriverBtn: { backgroundColor: COLORS.primary, shadowColor: COLORS.primary },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#f8faff',
    marginHorizontal: 25,
    padding: 15,
    borderRadius: 15,
    gap: 10,
    borderWidth: 1,
    borderColor: '#eef2f8'
  },
  infoBoxText: { flex: 1, fontSize: 12, color: COLORS.gray, lineHeight: 18, fontWeight: '500' }
});

