import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MapTracker } from '../components/MapTracker';
import { socketService } from '../services/socket.service';
import { trackingApi } from '../services/api';

export const RiderTrackingScreen = () => {
  const route = useRoute();
  const { rideId } = route.params as { rideId: string };

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<number[][]>([]);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const onLocationUpdate = (data: { rideId: string; latitude: number; longitude: number }) => {
      if (!mountedRef.current || data.rideId !== rideId) return;
      setCurrentLocation({ latitude: data.latitude, longitude: data.longitude });
    };

    const init = async () => {
      // Fetch route polyline
      try {
        const { data } = await trackingApi.getRoute(rideId);
        if (mountedRef.current && data?.data?.polyline) {
          setRoutePolyline(data.data.polyline);
        }
      } catch (err) {
        if (__DEV__) console.warn('[RiderTracking] Failed to fetch route', err);
      }

      // Fetch latest driver location (fallback before socket fires)
      try {
        const { data } = await trackingApi.getLatestLocation(rideId);
        if (mountedRef.current && data?.data) {
          setCurrentLocation({ latitude: data.data.latitude, longitude: data.data.longitude });
        }
      } catch (_) {
        // Normal if driver hasn't started yet
      }

      if (mountedRef.current) setLoading(false);
    };

    socketService.connect();
    socketService.joinRide(rideId, 'rider');
    socketService.onLocationUpdate(onLocationUpdate);
    init();

    return () => {
      mountedRef.current = false;
      socketService.offLocationUpdate(onLocationUpdate);
      socketService.leaveRide(rideId);
      // Do NOT call socketService.disconnect() — socket is a shared singleton
    };
  }, [rideId]);

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
  overlayText: { color: 'white', fontWeight: '500' },
});
