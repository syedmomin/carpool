import React, { useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { MapView, Marker, Polyline, PROVIDER_GOOGLE } from './Map';


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


  // Convert [[lng, lat]] to { latitude, longitude } for MapView
  const formattedRoute = routePolyline.map((coord) => ({
    latitude: coord[1],
    longitude: coord[0],
  }));

  useEffect(() => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        ...currentLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation]);

  const initialRegion = currentLocation
    ? {
        ...currentLocation,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : pickupLocation
    ? {
        ...pickupLocation,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      }
    : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={role === 'driver'} // Only driver naturally shows user location from device
      >
        {formattedRoute.length > 0 && (
          <Polyline
            coordinates={formattedRoute}
            strokeWidth={4}
            strokeColor="#2196F3"
          />
        )}

        {/* Display moving car marker for rider or if driver wants a custom marker */}
        {currentLocation && role === 'rider' && (
          <Marker
            coordinate={currentLocation}
            title="Driver"
            // You can replace this with an image using `image` prop
            pinColor="green" 
          />
        )}

        {pickupLocation && (
          <Marker coordinate={pickupLocation} title="Pickup" pinColor="blue" />
        )}

        {dropOffLocation && (
          <Marker coordinate={dropOffLocation} title="Drop-off" pinColor="red" />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});
