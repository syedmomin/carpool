// Real OpenStreetMap via Leaflet.js in WebView — free, no API key needed
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';

interface MapBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html, body, #map { width:100%; height:100%; }
  .leaflet-control-zoom, .leaflet-control-attribution { display:none; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', { zoomControl:false, attributionControl:false, dragging:false, touchZoom:false, scrollWheelZoom:false })
    .setView([30.3753, 69.3451], 13);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom:19 }).addTo(map);

  var userMarker = null;

  function handleMsg(raw) {
    try {
      var msg = JSON.parse(raw);
      if (msg.type === 'SET_LOCATION') {
        var ll = [msg.lat, msg.lng];
        map.setView(ll, 14, { animate: false });
        if (userMarker) {
          userMarker.setLatLng(ll);
        } else {
          var icon = L.divIcon({
            html: '<div style="width:16px;height:16px;background:#1d4ed8;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(29,78,216,0.25)"></div>',
            className: '', iconSize:[16,16], iconAnchor:[8,8]
          });
          userMarker = L.marker(ll, { icon }).addTo(map);
        }
      }
    } catch(_) {}
  }
  document.addEventListener('message', function(e) { handleMsg(e.data); });
  window.addEventListener('message', function(e) { handleMsg(e.data); });
</script>
</body>
</html>`;

export default function MapBackground({ children, style }: MapBackgroundProps) {
  const webViewRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const msg = JSON.stringify({ type: 'SET_LOCATION', lat: loc.coords.latitude, lng: loc.coords.longitude });
      webViewRef.current?.injectJavaScript(`handleMsg('${msg}'); true;`);
    })();
  }, []);

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={StyleSheet.absoluteFill}
        scrollEnabled={false}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        originWhitelist={['*']}
        startInLoadingState={false}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', overflow: 'hidden' },
});
