import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, Modal, TextInput, FlatList, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { MapView } from './Map';
import { COLORS, RADIUS, CURVE } from './theme';
import { PrimaryButton } from './Button';

// Free address search (no API key) via OpenStreetMap's Nominatim, biased to
// the selected city's coordinates via a bounding box — so typing "school"
// in Karachi doesn't surface a result in Lahore. `bounded=1` makes the
// viewbox a hard limit rather than just a preference.
const CITY_SEARCH_RADIUS_DEG = 0.35; // ~35-40km around the city center
interface NominatimResult { display_name: string; lat: string; lon: string }

async function searchPlaces(query: string, biasLat?: number, biasLng?: number): Promise<NominatimResult[]> {
  const params = new URLSearchParams({
    format: 'json', q: query, limit: '6', countrycodes: 'pk', addressdetails: '0',
  });
  if (biasLat != null && biasLng != null) {
    params.set('viewbox', [
      biasLng - CITY_SEARCH_RADIUS_DEG, biasLat + CITY_SEARCH_RADIUS_DEG,
      biasLng + CITY_SEARCH_RADIUS_DEG, biasLat - CITY_SEARCH_RADIUS_DEG,
    ].join(','));
    params.set('bounded', '1');
  }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'ChalParo/1.0', Accept: 'application/json' },
  });
  if (!res.ok) return [];
  return res.json();
}

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
  // Fired whenever the pin's reverse-geocoded address resolves (or fails to,
  // with an empty string) — lets callers auto-fill a "pickup point" text
  // field instead of the address being computed here and thrown away.
  onAddressChange?: (address: string) => void;
  height?: number;
  // Reused as-is for a drop-off pin (BookingConfirmScreen) — these default to
  // the pickup wording so every existing caller is unaffected.
  summaryLabel?: string;
  modalTitle?: string;
  mapHint?: string;
  confirmLabel?: string;
  // Selected city's coordinates — biases the address search below to that
  // city instead of all of Pakistan. Omit to search unrestricted.
  biasLat?: number;
  biasLng?: number;
  searchPlaceholder?: string;
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
  initialLat, initialLng, onLocationChange, onAddressChange, height = 150,
  summaryLabel = 'Exact pickup point',
  modalTitle = 'Set Pickup Location',
  mapHint = 'Drag the map so the pin sits on your exact pickup spot',
  confirmLabel = 'Confirm Pickup Point',
  biasLat, biasLng,
  searchPlaceholder = 'Search for a place or address',
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

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The debounce timer alone only guards against a *pending* request being
  // superseded — if a slow fetch is already in flight when the next
  // keystroke's debounce fires, two requests end up racing and an older,
  // slower response could overwrite a newer one. This id makes only the
  // most recently *started* request allowed to commit its result.
  const searchRequestId = useRef(0);

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!text.trim()) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const requestId = ++searchRequestId.current;
      const results = await searchPlaces(text.trim(), biasLat, biasLng);
      if (requestId !== searchRequestId.current) return; // a newer search superseded this one
      setSearchResults(results);
      setSearching(false);
    }, 450);
  };

  const handleSearchResultPress = (result: NominatimResult) => {
    Keyboard.dismiss();
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const next = { latitude: lat, longitude: lng };
    setRegion(next);
    mapRef.current?.animateToRegion?.(next);
    setAddress(result.display_name);
    onAddressChange?.(result.display_name);
    onLocationChange(lat, lng);
    setSearchQuery('');
    setSearchResults([]);
  };

  const lookupAddress = useCallback((lat: number, lng: number) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    setAddressLoading(true);
    geocodeTimer.current = setTimeout(async () => {
      try {
        const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
        const formatted = formatAddress(results?.[0] || null);
        setAddress(formatted);
        onAddressChange?.(formatted);
      } catch {
        setAddress('');
        onAddressChange?.('');
      } finally {
        setAddressLoading(false);
      }
    }, 500);
  }, [onAddressChange]);

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
          <Text style={styles.summaryLabel}>{summaryLabel}</Text>
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
            <Text style={styles.modalTitle}>{modalTitle}</Text>
            <View style={{ width: 34 }} />
          </View>

          <View style={styles.searchWrap}>
            <View style={styles.searchInputRow}>
              <Ionicons name="search" size={16} color={COLORS.gray} />
              <TextInput
                style={styles.searchInput}
                placeholder={searchPlaceholder}
                placeholderTextColor={COLORS.gray}
                value={searchQuery}
                onChangeText={handleSearchChange}
                returnKeyType="search"
              />
              {searching && <ActivityIndicator size="small" color={COLORS.primary} />}
              {!!searchQuery && !searching && (
                <Pressable onPress={() => handleSearchChange('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={COLORS.gray} />
                </Pressable>
              )}
            </View>
            {searchResults.length > 0 && (
              <FlatList
                style={styles.searchResultsList}
                data={searchResults}
                keyExtractor={(item, idx) => `${item.lat},${item.lon},${idx}`}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <Pressable style={styles.searchResultRow} onPress={() => handleSearchResultPress(item)}>
                    <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.searchResultText} numberOfLines={2}>{item.display_name}</Text>
                  </Pressable>
                )}
              />
            )}
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
              <Text style={styles.hintText}>{mapHint}</Text>
            </View>
          </View>

          <View style={[styles.confirmSheet, { paddingBottom: insets.bottom + 18 }]}>
            <View style={styles.addressRow}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <Text style={styles.addressText} numberOfLines={2}>
                {addressLoading ? 'Finding address…' : (address || 'Unnamed location')}
              </Text>
            </View>
            <PrimaryButton title={confirmLabel} onPress={() => setModalVisible(false)} />
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
  searchWrap: { paddingHorizontal: 12, marginBottom: 8, zIndex: 5 },
  searchInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary, padding: 0 },
  searchResultsList: {
    maxHeight: 220, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.border, marginTop: 6,
  },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    paddingHorizontal: 12, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchResultText: { flex: 1, fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, lineHeight: 18 },
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
    ...StyleSheet.absoluteFill,
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
