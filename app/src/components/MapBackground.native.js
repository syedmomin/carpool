// Native (Android/iOS) — real map
import React from 'react';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from './theme';

export default function MapBackground({ markers = [], children, style }) {
  return (
    <View style={[styles.container, style]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_DEFAULT}
        initialRegion={{
          latitude: 24.8607,
          longitude: 67.0011,
          latitudeDelta: 0.12,
          longitudeDelta: 0.12,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {markers.map(m => (
          <Marker key={m.id} coordinate={{ latitude: m.latitude, longitude: m.longitude }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.carMarker}>
              <Ionicons name="car" size={14} color={COLORS.primary} />
            </View>
          </Marker>
        ))}
      </MapView>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
  carMarker: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
});
