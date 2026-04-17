// Web fallback — simple placeholder (tracking is mobile-only feature)
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const MapView = React.forwardRef(({ children, style }: any, _ref: any) => (
  <View style={[styles.container, style]}>
    <Text style={styles.text}>Live map available on mobile app</Text>
    {children}
  </View>
));

export const Marker = (_props: any) => null;
export const Polyline = (_props: any) => null;
export const PROVIDER_GOOGLE = null;
export const PROVIDER_DEFAULT = null;

export default MapView;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e8f0e8', alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 14, color: '#666', fontWeight: '600' },
});
