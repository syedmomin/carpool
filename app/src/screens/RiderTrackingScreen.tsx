import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import axios from 'axios';
import { MapTracker } from '../components/MapTracker';
import { socketService } from '../services/socket.service';

export const RiderTrackingScreen = () => {
  const route = useRoute();
  const { rideId } = route.params as { rideId: string };

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Fetch Route
    fetchRoute();

    // 2. Initial Location Fetch (in case Socket hasn't updated yet)
    fetchLatestLocation();

    // 3. Connect to Socket.IO & Listen for updates
    socketService.connect();
    socketService.joinRide(rideId, 'rider');

    socketService.onLocationUpdate((data) => {
      console.log('📍 Rider received update:', data.latitude, data.longitude);
      setCurrentLocation({ latitude: data.latitude, longitude: data.longitude });
    });

    return () => {
      socketService.leaveRide(rideId);
      socketService.offLocationUpdate();
      socketService.disconnect();
    };
  }, []);

  const fetchRoute = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tracking/route/${rideId}`);
      if (response.data.success) {
        setRoutePolyline(response.data.data.polyline);
      }
    } catch (err) {
      console.warn('Failed to fetch route', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestLocation = async () => {
    try {
      const response = await axios.get(`${process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000'}/api/v1/tracking/location/${rideId}`);
      if (response.data.success && response.data.data) {
        setCurrentLocation({
          latitude: response.data.data.latitude,
          longitude: response.data.data.longitude,
        });
      }
    } catch (err) {
      // It's normal if no location exists yet
      console.log('No initial location found or error fetching.');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading Map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapTracker
        currentLocation={currentLocation}
        routePolyline={routePolyline}
        role="rider"
      />
      
      {!currentLocation && (
        <View style={styles.overlay}>
          <Text style={styles.overlayText}>Waiting for driver to start tracking...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#333' },
  overlay: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  overlayText: { color: 'white', fontWeight: '500' }
});
