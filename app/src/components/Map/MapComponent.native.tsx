// Real OpenStreetMap via Leaflet.js in WebView — free, no API key needed
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
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
  isDriver?: boolean;
}

function buildMapHtml(initialRegion?: Region, markers: MarkerData[] = [], polyline: { latitude: number; longitude: number }[] = []) {
  const lat  = initialRegion?.latitude  ?? 30.3753;
  const lng  = initialRegion?.longitude ?? 69.3451;

  // Separate driver marker from static markers
  const driverM  = markers.find(m => m.isDriver || m.pinColor === 'green');
  const staticMs = markers.filter(m => !m.isDriver && m.pinColor !== 'green');

  const staticMarkersJs = staticMs.map(m => {
    const color = m.pinColor === 'blue' ? '#3b82f6' : m.pinColor === 'red' ? '#ef4444' : '#6366f1';
    const svgColor = color.replace('#', '%23');
    return `
      L.marker([${m.coordinate.latitude}, ${m.coordinate.longitude}], {
        icon: L.divIcon({
          html: '<div style="display:flex;align-items:center;justify-content:center;"><svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'32\\' height=\\'40\\' viewBox=\\'0 0 24 30\\'><path fill=\\'${svgColor}\\' d=\\'M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z\\'/></svg></div>',
          className: '', iconSize:[32,40], iconAnchor:[16,40], popupAnchor:[0,-40]
        })
      }).addTo(map)${m.title ? `.bindPopup('<b>${m.title}</b>')` : ''};
    `;
  }).join('\n');

  const initDriverJs = driverM ? `
    var driverLatLng = L.latLng(${driverM.coordinate.latitude}, ${driverM.coordinate.longitude});
    driverMarker = L.marker(driverLatLng, {
      icon: carIcon, rotationAngle: ${driverM.rotation || 0}, rotationOrigin: 'center center', zIndexOffset: 1000
    }).addTo(map);
  ` : '';

  const polylineJs = polyline.length > 1
    ? `L.polyline([${polyline.map(p => `[${p.latitude},${p.longitude}]`).join(',')}],
        { color:'#1d4ed8', weight:5, opacity:0.75, lineCap:'round', lineJoin:'round' }).addTo(map);`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-rotatedmarker@0.2.0/leaflet.rotatedMarker.js"></script>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body,#map { width:100%; height:100%; background:#f2efe9; }
  .leaflet-control-attribution { display:none !important; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
  }).setView([${lat}, ${lng}], 15);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    tileSize: 256,
  }).addTo(map);

  // Car SVG icon for driver
  var carIcon = L.divIcon({
    html: '<div style="width:44px;height:44px;background:#fff;border:2.5px solid #1d4ed8;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.25)"><svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 512 512\\'><path fill=\\'#1d4ed8\\' d=\\'M135.2 117.4L109.1 192H402.9l-26.1-74.6C370.4 104.6 358.4 96 344.8 96H167.2c-13.6 0-25.6 8.6-32 21.4zM39.6 196.8L74.8 96.3C88.1 57.8 124.2 32 162.4 32H349.6c38.2 0 74.3 25.8 87.6 64.3l35.2 100.5c23.2 9.6 39.6 32.5 39.6 59.2V400v48c0 17.7-14.3 32-32 32H448c-17.7 0-32-14.3-32-32V400H96v48c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32V400 256c0-26.7 16.4-49.6 39.6-59.2zM128 288a32 32 0 1 0-64 0 32 32 0 1 0 64 0zm288 32a32 32 0 1 0 0-64 32 32 0 1 0 0 64z\\'/></svg></div>',
    className: '',
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });

  var driverMarker = null;
  var userMarker   = null;
  var accuracyCircle = null;

  ${initDriverJs}
  ${staticMarkersJs}
  ${polylineJs}

  // User (passenger) blue dot
  var userIcon = L.divIcon({
    html: '<div style="width:18px;height:18px;background:#1d4ed8;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 5px rgba(29,78,216,0.2)"></div>',
    className: '', iconSize:[18,18], iconAnchor:[9,9]
  });

  function handleMsg(raw) {
    try {
      var msg = JSON.parse(raw);

      if (msg.type === 'DRIVER_LOCATION') {
        var ll = L.latLng(msg.lat, msg.lng);
        if (driverMarker) {
          driverMarker.setLatLng(ll);
          if (msg.heading != null && typeof driverMarker.setRotationAngle === 'function') {
            driverMarker.setRotationAngle(msg.heading);
          }
        } else {
          driverMarker = L.marker(ll, {
            icon: carIcon, rotationAngle: msg.heading || 0, rotationOrigin: 'center center', zIndexOffset: 1000
          }).addTo(map);
        }
        map.panTo(ll, { animate: true, duration: 0.8, easeLinearity: 0.5 });
      }

      else if (msg.type === 'USER_LOCATION') {
        var ul = L.latLng(msg.lat, msg.lng);
        if (userMarker) {
          userMarker.setLatLng(ul);
        } else {
          userMarker = L.marker(ul, { icon: userIcon, zIndexOffset: 900 }).addTo(map);
        }
        if (accuracyCircle) {
          accuracyCircle.setLatLng(ul).setRadius(msg.accuracy || 20);
        } else {
          accuracyCircle = L.circle(ul, {
            radius: msg.accuracy || 20, color:'#1d4ed8', fillColor:'#1d4ed8',
            fillOpacity:0.12, weight:1
          }).addTo(map);
        }
      }

      else if (msg.type === 'ANIMATE_CAMERA') {
        map.setView([msg.lat, msg.lng], msg.zoom || map.getZoom(), { animate:true, duration:0.8 });
      }

      else if (msg.type === 'FIT_BOUNDS') {
        var bounds = L.latLngBounds(msg.points.map(function(p) { return [p.lat, p.lng]; }));
        map.fitBounds(bounds, { padding:[60,60], animate:true, maxZoom:16 });
      }

    } catch(e) {}
  }

  document.addEventListener('message', function(e) { handleMsg(e.data); });
  window.addEventListener('message',   function(e) { handleMsg(e.data); });
</script>
</body>
</html>`;
}

// ─── MapView ──────────────────────────────────────────────────────────────────
export const MapView = forwardRef<any, any>(({ style, initialRegion, children }, ref) => {
  const webViewRef = useRef<any>(null);

  const send = (obj: object) => {
    const safe = JSON.stringify(obj).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    webViewRef.current?.injectJavaScript(`handleMsg('${safe}'); true;`);
  };

  useImperativeHandle(ref, () => ({
    animateCamera:        ({ center, zoom }: any) =>
      send({ type: 'ANIMATE_CAMERA', lat: center.latitude, lng: center.longitude, zoom: zoom || 15 }),
    animateToRegion:      (region: Region) =>
      send({ type: 'ANIMATE_CAMERA', lat: region.latitude, lng: region.longitude, zoom: 15 }),
    updateDriverLocation: (lat: number, lng: number, heading: number) =>
      send({ type: 'DRIVER_LOCATION', lat, lng, heading }),
    updateUserLocation:   (lat: number, lng: number, accuracy: number) =>
      send({ type: 'USER_LOCATION', lat, lng, accuracy }),
    fitBounds:            (points: { lat: number; lng: number }[]) =>
      send({ type: 'FIT_BOUNDS', points }),
  }));

  const markers: MarkerData[] = [];
  const polylineCoords: { latitude: number; longitude: number }[] = [];

  React.Children.forEach(children, (child: any) => {
    if (!child) return;
    if (child.type === Marker)   markers.push({ ...child.props });
    if (child.type === Polyline && child.props.coordinates)
      polylineCoords.push(...child.props.coordinates);
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
        startInLoadingState={false}
      />
    </View>
  );
});

export const Marker   = (_props: any) => null;
export const Polyline = (_props: any) => null;
export const PROVIDER_GOOGLE  = null;
export const PROVIDER_DEFAULT = null;
export default MapView;

const styles = StyleSheet.create({
  container: { flex: 1, overflow: 'hidden' },
});
