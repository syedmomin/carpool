import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../config/network';
import { MapTracker } from '../components/MapTracker';
import { socketService } from '../services/socket.service';
import { locationService } from '../services/location.service';
import { ridesApi } from '../services/api';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../components';

export const DriverTrackingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId } = route.params as { rideId: string };

  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<number[][]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [rideData, setRideData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Route & Ride Data
    fetchData();

    // 2. Connect to Socket.IO
    socketService.connect();
    socketService.joinRide(rideId, 'driver');

    return () => {
      stopTracking();
      socketService.leaveRide(rideId);
    };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [routeRes, rideRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/tracking/route/${rideId}`),
        ridesApi.getById(rideId)
      ]);

      if (routeRes.data.success) {
        setRoutePolyline(routeRes.data.data.polyline);
      }
      
      const ride = rideRes.data?.data || rideRes.data;
      if (ride) {
        setRideData(ride);
        // Only show confirmed bookings as passengers
        const confirmed = ride.bookings?.filter((b: any) => b.status === 'CONFIRMED') || [];
        setPassengers(confirmed);
      }
    } catch (err) {
      console.warn('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  const startTracking = async () => {
    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please enable location permissions to start tracking.');
      return;
    }

    // FIX: Get current location IMMEDIATELY for instant map centering
    try {
      const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCurrentLocation({ latitude: initial.coords.latitude, longitude: initial.coords.longitude });
    } catch (e) { console.warn('Fast GPS fix failed:', e); }

    setIsTracking(true);

    // Start background tracking for robust operation
    await locationService.startBackgroundTracking();

    // Start foreground tracking to get real-time quick updates for the UX
    await locationService.startForegroundTracking((location) => {
      const { latitude, longitude, speed, heading } = location.coords;
      setCurrentLocation({ latitude, longitude });
      
      // Emit to server
      socketService.emitLocation({ rideId, latitude, longitude, speed, heading });
    });
  };

  const stopTracking = async () => {
    setIsTracking(false);
    await locationService.stopBackgroundTracking();
  };

  return (
    <View style={styles.container}>
      <MapTracker
        currentLocation={currentLocation}
        routePolyline={routePolyline}
        role="driver"
      />

      <View style={styles.footer}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Ride Controls</Text>
          {passengers.length > 0 && (
             <View style={styles.passCountPill}>
                <Ionicons name="people" size={12} color={COLORS.primary} />
                <Text style={styles.passCountText}>{passengers.length} Passenger(s)</Text>
             </View>
          )}
        </View>

        {passengers.map((p, idx) => (
          <View key={p.id} style={styles.passengerItem}>
            <View style={styles.passInfo}>
              <Text style={styles.passName}>{p.passenger?.name || 'Passenger'}</Text>
              <Text style={styles.passSeats}>{p.seats} Seat(s) • {p.ride?.fromCity || rideData?.fromCity} → {p.ride?.toCity || rideData?.toCity}</Text>
            </View>
            <TouchableOpacity 
               style={styles.callIcon} 
               onPress={() => Alert.alert('Call', `Call ${p.passenger?.name} at ${p.passenger?.phone}?`)}
            >
              <Ionicons name="call" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={[styles.button, isTracking ? styles.buttonStop : styles.buttonStart]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Text style={styles.buttonText}>{isTracking ? 'Stop Tracking' : 'Start Ride'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  footer: {
    padding: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  passCountPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  passCountText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  passengerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: COLORS.primary },
  passInfo: { flex: 1 },
  passName: { fontSize: 14, fontWeight: '700', color: '#333' },
  passSeats: { fontSize: 11, color: '#666', marginTop: 2 },
  callIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center' },
  button: {
    padding: 15,
    marginTop: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonStart: { backgroundColor: '#4CAF50' },
  buttonStop: { backgroundColor: '#F44336' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
