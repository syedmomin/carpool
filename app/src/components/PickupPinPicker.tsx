import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { MapView } from './Map';
import { COLORS, RADIUS, CURVE } from './theme';
import { PrimaryButton } from './Button';

// Full-screen "confirm pickup location" picker — the same UX pattern
// Uber/InDrive/Careem use: a collapsed summary row that opens a large
// map with a fixed center pin, a live reverse-geocoded address readout,
// and an explicit Confirm button. Zero paid APIs — map tiles are plain
// OpenStreetMap (already used elsewhere in the app) and the address
// readout uses Expo's on-device/free reverseGeocodeAsync.
interface PickupPinPickerProps {
  initialLat?: number;
  initialLng?: number;
  onLocationChange: (lat: number, lng: number) => void;
  height?: number;
}

const PAKISTAN_CENTER = { latitude: 30.3753, longitude: 69.3451 };

function formatAddress(result: Location.LocationGeocodedAddress | null): string {
  if (!result) return '';
  const parts = [result.name, result.street, result.district || result.city, result.region].filter(Boolean);
  // dedupe consecutive repeats (e.g. name === street on some devices)
  const seen = new Set<string>();
  const unique = parts.filter(p => {
    const key = (p as string).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return unique.slice(0, 3).join(', ');
}

export const PickupPinPicker: React.FC<PickupPinPickerProps> = ({
  initialLat, initialLng, onLocationChange, height = 150,
}) => {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState<{ latitude: number; longitude: number } | null>(
    initialLat != null && initialLng != null ? { latitude: initialLat, longitude: initialLng } : null
  );
  const [locating, setLocating] = useState(!region);
  const [address, setAddress] = useState('');
  const [addressLoading, setAddressLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const mapRef = useRef<any>(null);
  const hasReportedInitial = useRef(false);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lookupAddress = useCallback((lat: number, lng: number) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    setAddressLoading(true);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        setAddress(formatAddress(results?.[0] || null));
      } catch {
        setAddress('');
      } finally {
        setAddressLoading(false);
      }
    }, 500);
  }, []);

  useEffect(() => {
    if (region) return; // already have a starting point (e.g. ride's boarding city)
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setRegion({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        } else {
          setRegion(PAKISTAN_CENTER);
        }
      } catch {
        setRegion(PAKISTAN_CENTER);
      } finally {
        setLocating(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (region && !hasReportedInitial.current) {
      hasReportedInitial.current = true;
      onLocationChange(region.latitude, region.longitude);
      lookupAddress(region.latitude, region.longitude);
    }
  }, [region]);

  const handleUseMyLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') { setLocating(false); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setRegion(next);
      mapRef.current?.animateToRegion?.(next);
      onLocationChange(next.latitude, next.longitude);
      lookupAddress(next.latitude, next.longitude);
    } catch {
      // no-op — keep whatever pin position was already set
    } finally {
      setLocating(false);
    }
  };

  const handleCenterChange = (lat: number, lng: number) => {
    onLocationChange(lat, lng);
    lookupAddress(lat, lng);
  };

  return (
    <>
      {/* Collapsed summary row — tap to open the full-screen picker */}
      <Pressable style={styles.summaryRow} onPress={() => setModalVisible(true)}>
        <View style={styles.summaryIconWrap}>
          <Ionicons name="location" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryLabel}>Exact pickup point</Text>
          <Text style={styles.summaryValue} numberOfLines={1}>
            {addressLoading ? 'Locating…' : (address || 'Tap to set on map')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
      </Pressable>

      <Modal visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalWrap}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 12 }]}>
            <Pressable onPress={() => setModalVisible(false)} hitSlop={10} style={styles.modalBackBtn}>
              <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
            </Pressable>
            <Text style={styles.modalTitle}>Set Pickup Location</Text>
            <View style={{ width: 34 }} />
          </View>

          <View style={styles.mapArea}>
            {region && (
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={{ ...region, latitudeDelta: 0.01, longitudeDelta: 0.01 }}
                onCenterChange={handleCenterChange}
              />
            )}

            {/* Fixed center pin — the map moves under it, not the other way around */}
            <View pointerEvents="none" style={styles.centerPinWrap}>
              <Ionicons name="location" size={44} color={COLORS.primary} />
              <View style={styles.centerPinShadow} />
            </View>

            {locating && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color={COLORS.primary} />
              </View>
            )}

            <Pressable style={styles.myLocationBtn} onPress={handleUseMyLocation}>
              <Ionicons name="navigate" size={18} color={COLORS.primary} />
            </Pressable>

            <View style={styles.hintBadge}>
              <Text style={styles.hintText}>Drag the map so the pin sits on your exact pickup spot</Text>
            </View>
          </View>

          <View style={[styles.confirmSheet, { paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <Text style={styles.addressText} numberOfLines={2}>
                {addressLoading ? 'Finding address…' : (address || 'Unnamed location')}
              </Text>
            </View>
            <PrimaryButton title="Confirm Pickup Point" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ── Collapsed summary row ──
  summaryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingVertical: 12, paddingHorizontal: 14,
    ...CURVE,
  },
  summaryIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  summaryTextWrap: { flex: 1 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
  summaryValue: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },

  // ── Full-screen modal ──
  modalWrap: { flex: 1, backgroundColor: COLORS.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingBottom: 12,
  },
  modalBackBtn: {
    width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: { fontSize: 16, fontWeight: '800', color: COLORS.textPrimary },
  mapArea: { flex: 1 },
  centerPinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -22,
    marginTop: -44, // pin tip lands on the exact center point
    alignItems: 'center',
  },
  centerPinShadow: {
    width: 8, height: 4, borderRadius: 4, marginTop: -4,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  myLocationBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.white,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4,
    elevation: 3,
  },
  hintBadge: {
    position: 'absolute',
    top: 12, left: 12, right: 12,
    backgroundColor: 'rgba(17,24,39,0.75)',
    borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  hintText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  confirmSheet: {
    backgroundColor: COLORS.cardBg,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 18,
    borderTopWidth: 1, borderColor: COLORS.border,
    gap: 14,
  },
  addressRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  addressText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 19 },
});
