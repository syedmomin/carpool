import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapView, Marker, Polyline } from './Map';

interface LocationCoordinate {
  latitude: number;
  longitude: number;
}

interface MapTrackerProps {
  currentLocation: LocationCoordinate | null;
  routePolyline?: number[][]; // [[lng, lat]]
  pickupLocation?: LocationCoordinate;
  dropOffLocation?: LocationCoordinate;
  role: 'driver' | 'rider';
}

export const MapTracker: React.FC<MapTrackerProps> = ({
  currentLocation,
  routePolyline = [],
  pickupLocation,
  dropOffLocation,
  role,
}) => {
  const mapRef = useRef<any>(null);

  // Convert [[lng, lat]] → { latitude, longitude }
  const formattedRoute = routePolyline.map(coord => ({
    latitude: coord[1],
    longitude: coord[0],
  }));

  // When driver location updates, push to WebView map
  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera({
        center: { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        zoom: 15,
      });
    }
  }, [currentLocation]);

  const initialRegion = currentLocation
    ? { ...currentLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
    : pickupLocation
    ? { ...pickupLocation, latitudeDelta: 0.1, longitudeDelta: 0.1 }
    : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={initialRegion}
      >
        {/* Driver/current location marker */}
        {currentLocation && (
          <Marker
            coordinate={currentLocation}
            title={role === 'driver' ? 'You' : 'Driver'}
            pinColor="green"
          />
        )}
        {/* Route polyline */}
        {formattedRoute.length > 1 && (
          <Polyline coordinates={formattedRoute} />
        )}
        {/* Pickup & dropoff */}
        {pickupLocation && <Marker coordinate={pickupLocation} title="Pickup" pinColor="blue" />}
        {dropOffLocation && <Marker coordinate={dropOffLocation} title="Drop-off" pinColor="red" />}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject },
  map: { ...StyleSheet.absoluteFillObject },
});
