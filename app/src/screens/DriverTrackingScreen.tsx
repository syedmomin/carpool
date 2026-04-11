import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_BASE_URL } from '../config/network';
import { MapTracker } from '../components/MapTracker';
import { socketService } from '../services/socket.service';
import { locationService } from '../services/location.service';

export const DriverTrackingScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId } = route.params as { rideId: string };

  const [isTracking, setIsTracking] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routePolyline, setRoutePolyline] = useState<number[][]>([]);

  useEffect(() => {
    // 1. Fetch Route Data
    fetchRoute();

    // 2. Connect to Socket.IO
    socketService.connect();
    socketService.joinRide(rideId, 'driver');

    return () => {
      stopTracking();
      socketService.leaveRide(rideId);
      socketService.disconnect();
    };
  }, []);

  const fetchRoute = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/tracking/route/${rideId}`);
      if (response.data.success) {
        setRoutePolyline(response.data.data.polyline);
      }
    } catch (err) {
      console.warn('Failed to fetch route', err);
    }
  };

  const startTracking = async () => {
    const hasPermission = await locationService.requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Please enable location permissions to start tracking.');
      return;
    }

    setIsTracking(true);

    // Start background tracking for robust operation
    await locationService.startBackgroundTracking();

    // Start foreground tracking to get real-time quick updates for the UX
    await locationService.startForegroundTracking((location) => {
      const { latitude, longitude, speed, heading } = location.coords;
      setCurrentLocation({ latitude, longitude });
      
      // Emit to server
      socketService.emitLocation({ rideId, latitude, longitude, speed, heading });
      console.log('📍 Location emitted:', latitude, longitude);
    });
    
    // In production, we'd also register TaskManager in App.ts for background updates to hit an API fallback
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
        <Text style={styles.title}>Driver Controls</Text>
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
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonStart: { backgroundColor: '#4CAF50' },
  buttonStop: { backgroundColor: '#F44336' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
