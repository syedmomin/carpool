import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const MapView = ({ children, style }: any) => (
  <View style={[styles.container, style]}>
    <View style={styles.gridContainer}>
      <View style={styles.grid} />
    </View>
    <View style={styles.overlay}>
      <Text style={styles.text}>Map View (Mobile Only)</Text>
      <Text style={styles.desc}>This premium tracking feature is available on our Android/iOS apps.</Text>
    </View>
    {children}
  </View>
);

const Marker = ({ children, coordinate }: any) => (
  <View style={[styles.marker, { position: 'absolute', top: '50%', left: '50%', transform: [{ translateX: -10 }, { translateY: -10 }] }]}>
    {children}
  </View>
);

const Polyline = () => null;
const PROVIDER_GOOGLE = 'google';

export { MapView, Marker, Polyline, PROVIDER_GOOGLE };
export default MapView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4ff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  gridContainer: { ...StyleSheet.absoluteFillObject, opacity: 0.1 },
  grid: { 
    flex: 1, 
    borderWidth: 1, 
    borderColor: '#0d1b4b',
    borderStyle: 'dashed'
  },
  overlay: { alignItems: 'center', padding: 20 },
  text: { fontSize: 18, fontWeight: '800', color: '#0d1b4b', marginBottom: 8 },
  desc: { fontSize: 13, color: '#555', textAlign: 'center' },
  marker: { zIndex: 100 },
});
