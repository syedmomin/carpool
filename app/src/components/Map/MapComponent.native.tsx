// OpenStreetMap via WebView — no Google API key needed, completely free
import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
}

interface MarkerData {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  pinColor?: string;
  rotation?: number;
  flat?: boolean;
  anchor?: { x: number; y: number };
  children?: React.ReactNode;
}

// Build the HTML for OpenStreetMap using Leaflet.js (CDN — free)
function buildMapHtml(initialRegion?: Region, markers: MarkerData[] = [], polyline: { latitude: number; longitude: number }[] = []) {
  const lat = initialRegion?.latitude ?? 30.3753;
  const lng = initialRegion?.longitude ?? 69.3451;
  const zoom = 13;

  const markersJs = markers.map((m, i) => {
    const color = m.pinColor === 'green' ? '#22c55e' : m.pinColor === 'blue' ? '#3b82f6' : m.pinColor === 'red' ? '#ef4444' : '#1d4ed8';
    return `
      L.circleMarker([${m.coordinate.latitude}, ${m.coordinate.longitude}], {
        radius: 10, color: '${color}', fillColor: '${color}', fillOpacity: 1, weight: 2
      }).addTo(map)${m.title ? `.bindPopup('${m.title}')` : ''};
    `;
  }).join('\n');

  const polylineJs = polyline.length > 1
    ? `L.polyline([${polyline.map(p => `[${p.latitude},${p.longitude}]`).join(',')}], {color:'#3b82f6',weight:4}).addTo(map);`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100%; height: 100%; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl: false, attributionControl: false })
    .setView([${lat}, ${lng}], ${zoom});
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19
  }).addTo(map);
  var driverMarker = null;
  ${markersJs}
  ${polylineJs}

  // Listen for location updates from React Native
  document.addEventListener('message', function(e) {
    try {
      var msg = JSON.parse(e.data);
      if (msg.type === 'UPDATE_LOCATION') {
        var ll = [msg.lat, msg.lng];
        if (driverMarker) {
          driverMarker.setLatLng(ll);
        } else {
          driverMarker = L.circleMarker(ll, {
            radius: 10, color: '#22c55e', fillColor: '#22c55e', fillOpacity: 1, weight: 2
          }).addTo(map);
        }
        map.panTo(ll);
      } else if (msg.type === 'ANIMATE_CAMERA') {
        map.setView([msg.lat, msg.lng], msg.zoom || map.getZoom());
      }
    } catch(_) {}
  });
  window.addEventListener('message', function(e) {
    document.dispatchEvent(new MessageEvent('message', { data: e.data }));
  });
</script>
</body>
</html>`;
}

// ─── MapView ──────────────────────────────────────────────────────────────────
export const MapView = forwardRef<any, any>(({
  style, initialRegion, children, showsUserLocation, followsUserLocation, provider, ...rest
}, ref) => {
  const webViewRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    animateCamera: ({ center, zoom }: any) => {
      webViewRef.current?.injectJavaScript(`
        map.setView([${center.latitude}, ${center.longitude}], ${zoom || 15});
        true;
      `);
    },
    animateToRegion: (region: Region) => {
      webViewRef.current?.injectJavaScript(`
        map.setView([${region.latitude}, ${region.longitude}], 15);
        true;
      `);
    },
    postMessage: (data: string) => {
      webViewRef.current?.injectJavaScript(`
        document.dispatchEvent(new MessageEvent('message', { data: '${data}' }));
        true;
      `);
    },
  }));

  // Collect Marker children to pass into HTML
  const markers: MarkerData[] = [];
  const polylineCoords: { latitude: number; longitude: number }[] = [];

  React.Children.forEach(children, (child: any) => {
    if (!child) return;
    if (child.type === Marker) markers.push(child.props);
    if (child.type === Polyline && child.props.coordinates) polylineCoords.push(...child.props.coordinates);
  });

  const html = buildMapHtml(initialRegion, markers, polylineCoords);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
      />
    </View>
  );
});

// ─── Marker — rendered inside MapView HTML, not as RN children ───────────────
export const Marker = (_props: any) => null;

// ─── Polyline — rendered inside MapView HTML ──────────────────────────────────
export const Polyline = (_props: any) => null;

export const PROVIDER_GOOGLE = null;
export const PROVIDER_DEFAULT = null;

export default MapView;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
