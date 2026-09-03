import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  KeyboardAvoidingView, Platform, Switch, Modal, FlatList, ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CURVE, AppBar, SectionHeader, PrimaryButton, PickupPinPicker } from '../../components';
import { DatePickerInput, TimePickerInput } from '../../components/DateTimePicker';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { parseApiError } from '../../utils/errorMessages';
import CitySearchModal from '../../components/CitySearchModal';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { vehiclesApi, scheduleRequestsApi } from '../../services/api';
import { haptics } from '../../utils/haptics';
import { generateLocalId } from '../../utils/id';
import { formatLocalDate } from '../../utils/date';

const TEXT_FIELDS = [
  { key: 'pricePerSeat', label: 'Price Per Seat (Rs) *', placeholder: 'e.g. 1500', type: 'numeric' },
  { key: 'pickupPoint', label: 'Pickup Location *', placeholder: 'e.g. Karachi Cantt Station' },
  { key: 'dropPoint', label: 'Drop Location *', placeholder: 'e.g. Larkana Bus Stop' },
];

// Adds N days to a YYYY-MM-DD string, returning the same format.
function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return formatLocalDate(dt);
}

// Parses this app's "h:mm am/pm" time strings (from TimePickerInput) into
// minutes-since-midnight for same-day ordering checks. Returns null for any
// unrecognized format rather than guessing.
function timeToMinutes(t: string): number | null {
  const m = /^(\d{1,2}):(\d{2})\s*(am|pm)$/i.exec((t || '').trim());
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (m[3].toLowerCase() === 'pm' && h !== 12) h += 12;
  if (m[3].toLowerCase() === 'am' && h === 12) h = 0;
  return h * 60 + min;
}

// Boxed text field matching the Vehicle Setup screen's field style — label
// inside the same bordered box as the value, so every form in the app reads
// consistently instead of some fields having the label above the box.
function BoxedField({ label, value, placeholder, onChangeText, keyboardType, multiline, numberOfLines }: any) {
  return (
    <View style={boxedStyles.field}>
      <Text style={boxedStyles.label}>{label}</Text>
      <TextInput
        style={[boxedStyles.input, multiline && boxedStyles.multiline]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.gray}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
      />
    </View>
  );
}
const boxedStyles = StyleSheet.create({
  field: { backgroundColor: COLORS.cardBg, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  label: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 2 },
  input: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, padding: 0, margin: 0 },
  multiline: { minHeight: 60, textAlignVertical: 'top' },
});


export default function PostRideScreen({ navigation }) {
  const { postRide, currentUser } = useApp();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();
  const insets = useSafeAreaInsets();

  const [driverVehicles, setDriverVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setVehiclesLoading(true);
    vehiclesApi.myVehicles().then(({ data }) => {
      if (!active) return;
      if (data?.data) {
        setDriverVehicles(data.data);
        setSelectedVehicle(prev => prev || data.data.find(v => v.isActive) || data.data[0] || null);
      }
    }).finally(() => { if (active) setVehiclesLoading(false); });
    return () => { active = false; };
  }, []));

  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);
  const maxRideDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

  const [form, setForm] = useState({
    from: '', to: '', date: '', departureTime: '', arrivalTime: '',
    pricePerSeat: '', pickupPoint: '', dropPoint: '', description: '',
    returnDate: '', returnDepartureTime: '',
  });
  const [pickupLat, setPickupLat] = useState<number | undefined>(undefined);
  const [pickupLng, setPickupLng] = useState<number | undefined>(undefined);
  // Tracks the last address we auto-filled into pickupPoint from the map pin,
  // so we keep syncing it as the pin moves but stop the moment the driver
  // types something of their own into the field.
  const lastAutoPickupAddress = useRef('');
  const [rideType, setRideType] = useState<'oneway' | 'roundtrip'>('oneway');
  const [isMultiStop, setIsMultiStop] = useState(false);
  const [stops, setStops] = useState([]); // [{ city, arrivalTime }]
  const [loading, setLoading] = useState(false);

  // City search modal state
  const [cityModal, setCityModal] = useState(null); // 'from' | 'to' | { type:'stop', idx }

  const [matchCount, setMatchCount] = useState(0);
  const [matchLoading, setMatchLoading] = useState(false);

  // Intelligent Matching: Check for passengers when route changes
  useEffect(() => {
    if (form.from && form.to) {
      setMatchLoading(true);
      scheduleRequestsApi.getMatchCount(form.from, form.to, form.date)
        .then(({ data }) => {
          if (data?.data?.count !== undefined) setMatchCount(data.data.count);
        })
        .finally(() => setMatchLoading(false));
    } else {
      setMatchCount(0);
    }
  }, [form.from, form.to, form.date]);

  const vehicleSeats = selectedVehicle?.totalSeats || '-';
  const vehicleAmenities = [
    ...(selectedVehicle?.ac ? ['AC'] : []),
    ...(selectedVehicle?.wifi ? ['WiFi'] : []),
    ...(selectedVehicle?.music ? ['Music'] : []),
    ...(selectedVehicle?.usbCharging ? ['USB Charging'] : []),
  ];

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  // ── Stops helpers ─────────────────────────────────────────────────────────
  const addStop = () => {
    if (stops.length >= 5) {
      showToast('Maximum 5 intermediate stops allowed.', 'warning');
      return;
    }
    setStops(prev => [...prev, { city: '', arrivalTime: '' }]);
  };

  const removeStop = (idx) => setStops(prev => prev.filter((_, i) => i !== idx));

  const updateStop = (idx, key, val) =>
    setStops(prev => prev.map((s, i) => i === idx ? { ...s, [key]: val } : s));

  const handleCitySelect = (city) => {
    if (cityModal === 'from') {
      update('from', city);
    } else if (cityModal === 'to') {
      update('to', city);
    } else if (cityModal?.type === 'stop') {
      updateStop(cityModal.idx, 'city', city);
    }
    setCityModal(null);
  };

  const handlePost = async () => {
    if (!form.from || !form.to || !form.date || !form.departureTime || !form.pricePerSeat) {
      showToast('Please fill From, To, Date, Departure Time, and Price.', 'error');
      return;
    }
    if (form.from.trim().toLowerCase() === form.to.trim().toLowerCase()) {
      showToast('Leaving From and Going To cities cannot be the same.', 'error');
      return;
    }
    if (pickupLat == null || pickupLng == null) {
      showToast('Please set your exact pickup point on the map.', 'error');
      return;
    }
    if (!form.dropPoint.trim()) {
      showToast('Please enter the drop location.', 'error');
      return;
    }
    const price = Number(form.pricePerSeat);
    if (!Number.isFinite(price) || price <= 0) {
      showToast('Please enter a valid price per seat.', 'error');
      return;
    }
    if (isMultiStop) {
      if (stops.some(s => !s.city)) {
        showToast('Each intermediate stop must have a city selected.', 'error');
        return;
      }
      const cityList = [form.from.toLowerCase(), ...stops.map(s => s.city.toLowerCase()), form.to.toLowerCase()];
      const uniqueCities = new Set(cityList);
      if (uniqueCities.size !== cityList.length) {
        showToast('Route cannot have duplicate cities or stops matching departure/destination.', 'error');
        return;
      }
    }

    if (form.arrivalTime && form.departureTime) {
      const toMinutes = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
      let depMins = toMinutes(form.departureTime);
      let arrMins = toMinutes(form.arrivalTime);
      // Handle midnight wraparound: if arrival looks earlier, assume it's next day
      if (arrMins <= depMins) arrMins += 24 * 60;
      if (arrMins - depMins > 12 * 60) {
        showToast('Estimated arrival must be later than departure time.', 'error');
        return;
      }
    }

    if (rideType === 'roundtrip') {
      if (!form.returnDate || !form.returnDepartureTime) {
        showToast('Please set the return date and time.', 'error');
        return;
      }
      if (form.returnDate < form.date) {
        showToast('Return date cannot be before the departure date.', 'error');
        return;
      }
      if (form.returnDate === form.date) {
        const outMins = timeToMinutes(form.departureTime);
        const retMins = timeToMinutes(form.returnDepartureTime);
        if (outMins != null && retMins != null && retMins <= outMins) {
          showToast('Return time must be after the outbound departure time on the same day.', 'error');
          return;
        }
      }
    }

    if (vehiclesLoading) {
      showToast('Loading your vehicles, please wait a moment.', 'info');
      return;
    }
    if (!selectedVehicle) {
      showModal({
        type: 'warning',
        title: 'Vehicle Required',
        message: 'Please register your vehicle before posting a ride.',
        confirmText: 'Add Vehicle',
        cancelText: 'Cancel',
        onConfirm: () => navigation.navigate('VehicleSetup'),
      });
      return;
    }

    if (rideType === 'roundtrip') {
      showModal({
        type: 'primary',
        title: 'Confirm Both Legs',
        message:
          `Outbound: ${form.from} → ${form.to}\n${form.date}, ${form.departureTime}\n\n` +
          `Return: ${form.to} → ${form.from}\n${form.returnDate}, ${form.returnDepartureTime}\n\n` +
          `Rs ${form.pricePerSeat}/seat on both legs.`,
        confirmText: 'Post Both Rides',
        cancelText: 'Edit',
        icon: 'swap-horizontal-outline',
        onConfirm: () => doPost(),
      });
      return;
    }

    doPost();
  };

  const doPost = async () => {
    haptics.impact();
    try {
      setLoading(true);
      const stopsPayload = isMultiStop
        ? stops.map((s, i) => ({ city: s.city, order: i + 1, arrivalTime: s.arrivalTime || '' }))
        : [];

      // returnDate/returnDepartureTime are form-only fields — the Ride model
      // has no such columns, so they must never reach the create payload.
      const { returnDate, returnDepartureTime, ...outboundForm } = form;
      const roundTripGroupId = rideType === 'roundtrip' ? generateLocalId() : undefined;

      const basePayload = {
        driverId: currentUser?.id,
        vehicleId: selectedVehicle.id,
        pricePerSeat: parseInt(form.pricePerSeat),
        totalSeats: selectedVehicle.totalSeats,
        amenities: vehicleAmenities,
      };

      const outboundPayload = {
        ...outboundForm,
        ...basePayload,
        isMultiStop,
        stops: stopsPayload,
        ...(roundTripGroupId ? { roundTripGroupId } : {}),
        // A dropped pin is more precise than the city-center auto-fill, so it
        // overrides fromLat/fromLng when the driver set one.
        ...(pickupLat != null && pickupLng != null ? { fromLat: pickupLat, fromLng: pickupLng } : {}),
      };

      const { data, error } = await postRide(outboundPayload);

      if (error) {
        showToast(parseApiError(error), 'error');
        return;
      }

      if (rideType === 'roundtrip') {
        // Same stops set, reversed order — the return leg passes through the
        // same intermediate cities in the opposite direction.
        const returnStopsPayload = isMultiStop
          ? [...stopsPayload].reverse().map((s, i) => ({ ...s, order: i + 1 }))
          : [];

        const returnPayload = {
          ...basePayload,
          from: form.to,
          to: form.from,
          date: returnDate,
          departureTime: returnDepartureTime,
          arrivalTime: '',
          pickupPoint: form.dropPoint,
          dropPoint: form.pickupPoint,
          description: form.description,
          isMultiStop,
          stops: returnStopsPayload,
          roundTripGroupId,
        };

        const returnResult = await postRide(returnPayload);
        if (returnResult.error) {
          haptics.success();
          showToast(`Outbound ride posted, but the return leg failed: ${parseApiError(returnResult.error)}`, 'warning');
          setForm({ from: '', to: '', date: '', departureTime: '', arrivalTime: '', pricePerSeat: '', pickupPoint: '', dropPoint: '', description: '', returnDate: '', returnDepartureTime: '' }); setRideType('oneway'); setPickupLat(undefined); setPickupLng(undefined); lastAutoPickupAddress.current = '';
          navigation.navigate('DriverApp', { screen: 'MyRidesTab', params: { screen: 'ActiveRides' } });
          return;
        }
      }

      haptics.success();
      showToast(rideType === 'roundtrip' ? 'Both rides posted successfully' : 'Ride posted successfully', 'success');
      setForm({ from: '', to: '', date: '', departureTime: '', arrivalTime: '', pricePerSeat: '', pickupPoint: '', dropPoint: '', description: '', returnDate: '', returnDepartureTime: '' }); setRideType('oneway'); setPickupLat(undefined); setPickupLng(undefined); lastAutoPickupAddress.current = '';
      navigation.navigate('DriverApp', { screen: 'MyRidesTab', params: { screen: 'ActiveRides' } });
    } catch (err) {
      showToast('Something went wrong while posting your ride. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const cityModalTitle =
    cityModal === 'from' ? 'Departure City' :
      cityModal === 'to' ? 'Destination City' :
        cityModal?.type === 'stop' ? `Stop ${cityModal.idx + 1} City` : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <AppBar title="Post a Ride" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 32 }]} keyboardShouldPersistTaps="handled">

          {/* ── Vehicle Selector ─────────────────────────────────────────── */}
          <SectionHeader title="Vehicle" />
          {vehiclesLoading && driverVehicles.length === 0 ? (
            <View style={styles.noVehicleCard}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.noVehicleText}>Loading your vehicles...</Text>
            </View>
          ) : driverVehicles.length === 0 ? (
            <Pressable style={styles.noVehicleCard} onPress={() => navigation.navigate('VehicleSetup')}>
              <Ionicons name="warning-outline" size={20} color={COLORS.accent} />
              <Text style={styles.noVehicleText}>Register your vehicle first {'>'}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.vehicleSelector}
              onPress={() => driverVehicles.length > 1 && setVehiclePickerOpen(true)}

            >
              <View style={styles.vehicleIconBox}>
                <Ionicons name="car-sport" size={20} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{selectedVehicle?.brand || 'No vehicle'}</Text>
                <Text style={styles.vehicleDetail}>
                  {selectedVehicle?.plateNumber} • {vehicleSeats} seats
                  {vehicleAmenities.length > 0 ? ` • ${vehicleAmenities.join(', ')}` : ''}
                </Text>
              </View>
              {driverVehicles.length > 1 && <Ionicons name="chevron-down" size={16} color={COLORS.gray} />}
            </Pressable>
          )}

          {/* ── Route ────────────────────────────────────────────────────── */}
          <SectionHeader title="Route" />
          <View style={styles.routeCard}>
            <View style={styles.routeLeft}>
              <View style={[styles.routeDot, { backgroundColor: COLORS.primary }]} />
              <View style={styles.routeVertLine} />
              <View style={[styles.routeDot, { backgroundColor: COLORS.secondary }]} />
            </View>
            <View style={styles.routeInputs}>
              <Pressable style={styles.routeInputTouch} onPress={() => setCityModal('from')}>
                <Text style={[styles.routeInput, !form.from && styles.placeholder]} numberOfLines={1}>
                  {form.from || 'Leaving From?'}
                </Text>
              </Pressable>
              <View style={styles.routeInputDivider} />
              <Pressable style={styles.routeInputTouch} onPress={() => setCityModal('to')}>
                <Text style={[styles.routeInput, !form.to && styles.placeholder]} numberOfLines={1}>
                  {form.to || 'Going To?'}
                </Text>
              </Pressable>
            </View>
            <Pressable onPress={() => { update('from', form.to); update('to', form.from); }} style={styles.swapBtn}>
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </Pressable>
          </View>

          {/* ── Exact Pickup Point (optional) ───────────────────────────────── */}
          {!!form.from && (
            <>
              <Text style={styles.pinHint}>
                <Ionicons name="information-circle-outline" size={13} color={COLORS.gray} /> Add your exact starting point in {form.from} so passengers can find you easily. Required.
              </Text>
              <View style={{ marginBottom: 16 }}>
                <PickupPinPicker
                  onLocationChange={(lat, lng) => { setPickupLat(lat); setPickupLng(lng); }}
                  onAddressChange={(address) => {
                    if (!address) return;
                    // Auto-fill the Pickup Location field from the pin's resolved
                    // address, but don't clobber it once the driver has typed
                    // their own text there.
                    if (!form.pickupPoint || form.pickupPoint === lastAutoPickupAddress.current) {
                      update('pickupPoint', address);
                      lastAutoPickupAddress.current = address;
                    }
                  }}
                />
              </View>
            </>
          )}

          {/* ── Route Matching Suggestions ────────────────────────────────── */}
          {matchCount > 0 && (
            <Pressable
              style={styles.matchBanner}
              onPress={() => navigation.navigate('DriverApp', {
                screen: 'DriverRequestsTab',
                params: { screen: 'OpenRequestsMain', params: { city: form.from, to: form.to } }
              })}
            >
              <View style={styles.matchIconBox}>
                <Ionicons name="people" size={18} color={COLORS.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.matchTitle}>{matchCount} passengers waiting!</Text>
                <Text style={styles.matchSub}>Found requests matching your route. View & make offers?</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
            </Pressable>
          )}

          {/* ── Multi-Stop Toggle ──────────────────────────────────────────── */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleLeft}>
              <Ionicons name="git-branch-outline" size={18} color={isMultiStop ? COLORS.primary : COLORS.gray} />
              <View>
                <Text style={[styles.toggleLabel, isMultiStop && { color: COLORS.primary }]}>Multi-Stop Route</Text>
                <Text style={styles.toggleSub}>Add intermediate stops for partial bookings</Text>
              </View>
            </View>
            <Switch
              value={isMultiStop}
              onValueChange={(val) => { setIsMultiStop(val); if (!val) setStops([]); }}
              trackColor={{ false: COLORS.border, true: COLORS.primary + '60' }}
              thumbColor={isMultiStop ? COLORS.primary : '#f4f3f4'}
            />
          </View>

          {/* ── Intermediate Stops ─────────────────────────────────────────── */}
          {isMultiStop && (
            <View style={styles.stopsContainer}>
              <Text style={styles.stopsHint}>
                <Ionicons name="information-circle-outline" size={13} color={COLORS.gray} /> Passengers can book any segment (e.g. Hyderabad {'>'} Multan)
              </Text>

              {stops.map((stop, idx) => (
                <View key={idx} style={styles.stopRow}>
                  <View style={styles.stopNumCol}>
                    <View style={styles.stopLine} />
                    <View style={styles.stopNum}>
                      <Text style={styles.stopNumText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.stopLine} />
                  </View>
                  <View style={styles.stopFields}>
                    <Pressable
                      style={styles.stopCityBtn}
                      onPress={() => setCityModal({ type: 'stop', idx })}
                    >
                      <Ionicons name="location-outline" size={16} color={COLORS.gray} />
                      <Text style={[styles.stopCityText, !stop.city && styles.placeholder]}>
                        {stop.city || 'Select stop city'}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={COLORS.gray} />
                    </Pressable>
                    <TimePickerInput
                      label="Arrival Time at Stop"
                      value={stop.arrivalTime}
                      onChange={(v) => updateStop(idx, 'arrivalTime', v)}
                    />
                  </View>
                  <Pressable style={styles.stopRemoveBtn} onPress={() => removeStop(idx)}>
                    <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                  </Pressable>
                </View>
              ))}

              <Pressable style={styles.addStopBtn} onPress={addStop}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addStopText}>Add Intermediate Stop</Text>
              </Pressable>
            </View>
          )}

          {/* ── Schedule ─────────────────────────────────────────────────── */}
          <SectionHeader title="Schedule" />
          <DatePickerInput
            label="Travel Date *"
            value={form.date}
            onChange={v => update('date', v)}
            minDate={new Date()}
            maxDate={maxRideDate}
          />
          <TimePickerInput
            label="Departure Time *"
            value={form.departureTime}
            onChange={v => update('departureTime', v)}
          />
          <TimePickerInput
            label="Estimated Arrival"
            value={form.arrivalTime}
            onChange={v => update('arrivalTime', v)}
          />

          {/* ── Fare & Locations ─────────────────────────────────────────── */}
          <SectionHeader title="Fare & Pickup" />
          {TEXT_FIELDS.map(field => (
            <BoxedField
              key={field.key}
              label={field.label}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChangeText={v => update(field.key, v)}
              keyboardType={field.type || 'default'}
            />
          ))}

          {/* ── Ride Type ────────────────────────────────────────────────── */}
          <SectionHeader title="Ride Type" />
          <View style={styles.rideTypeRow}>
            <Pressable
              style={[styles.rideTypeBtn, rideType === 'oneway' && styles.rideTypeBtnActive]}
              onPress={() => setRideType('oneway')}
            >
              <Ionicons name="arrow-forward-circle-outline" size={16} color={rideType === 'oneway' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.rideTypeText, rideType === 'oneway' && styles.rideTypeTextActive]}>One Way</Text>
            </Pressable>
            <Pressable
              style={[styles.rideTypeBtn, rideType === 'roundtrip' && styles.rideTypeBtnActive]}
              onPress={() => setRideType('roundtrip')}
            >
              <Ionicons name="swap-horizontal-outline" size={16} color={rideType === 'roundtrip' ? COLORS.primary : COLORS.textSecondary} />
              <Text style={[styles.rideTypeText, rideType === 'roundtrip' && styles.rideTypeTextActive]}>Round Trip</Text>
            </Pressable>
          </View>

          {rideType === 'roundtrip' && (
            <View style={styles.returnLegBox}>
              <Text style={styles.returnLegHint}>
                <Ionicons name="information-circle-outline" size={13} color={COLORS.gray} /> This posts a second ride for the return leg ({form.to || 'destination'} → {form.from || 'origin'}).
              </Text>

              {!!form.date && (
                <View style={styles.quickChipsRow}>
                  <Pressable style={styles.quickChip} onPress={() => update('returnDate', form.date)}>
                    <Text style={styles.quickChipText}>Same day</Text>
                  </Pressable>
                  <Pressable style={styles.quickChip} onPress={() => update('returnDate', addDays(form.date, 1))}>
                    <Text style={styles.quickChipText}>Next day</Text>
                  </Pressable>
                  <Pressable style={styles.quickChip} onPress={() => update('returnDate', addDays(form.date, 7))}>
                    <Text style={styles.quickChipText}>In a week</Text>
                  </Pressable>
                </View>
              )}

              <DatePickerInput
                label="Return Date *"
                value={form.returnDate}
                onChange={v => update('returnDate', v)}
                minDate={form.date ? new Date(form.date) : new Date()}
                maxDate={maxRideDate}
              />
              <TimePickerInput
                label="Return Departure Time *"
                value={form.returnDepartureTime}
                onChange={v => update('returnDepartureTime', v)}
              />
            </View>
          )}

          <BoxedField
            label="Note / Description"
            placeholder="e.g. 1 stop in Hyderabad, AC will be on..."
            value={form.description}
            onChangeText={v => update('description', v)}
            multiline
            numberOfLines={3}
          />

          <PrimaryButton title="Post Ride" onPress={handlePost} loading={loading} style={styles.postBtn} />
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── City Search Modal ──────────────────────────────────────────── */}
        <CitySearchModal
          visible={!!cityModal}
          title={cityModalTitle}
          onSelect={handleCitySelect}
          onClose={() => setCityModal(null)}
        />

        {/* ── Vehicle Picker Modal ───────────────────────────────────────── */}
        <Modal visible={vehiclePickerOpen} animationType="slide" onRequestClose={() => setVehiclePickerOpen(false)}>
          <View style={styles.modal}>
            <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.modalTitle}>Select Vehicle</Text>
              <Pressable onPress={() => setVehiclePickerOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            <FlatList
              data={driverVehicles}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <Pressable
                  style={[styles.vehiclePickerItem, selectedVehicle?.id === item.id && styles.vehiclePickerItemActive]}
                  onPress={() => { setSelectedVehicle(item); setVehiclePickerOpen(false); }}
                >
                  <Ionicons name="car-sport-outline" size={22} color={selectedVehicle?.id === item.id ? COLORS.primary : COLORS.gray} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehiclePickerName, selectedVehicle?.id === item.id && { color: COLORS.primary }]}>{item.brand}</Text>
                    <Text style={styles.vehiclePickerDetail}>{item.plateNumber} • {item.totalSeats} seats</Text>
                  </View>
                  {selectedVehicle?.id === item.id && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                </Pressable>
              )}
            />
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  body: { padding: 20, paddingBottom: 40 },

  // Vehicle selector
  vehicleSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: 14, padding: 14, gap: 12, marginBottom: 4, borderWidth: 1.5, borderColor: COLORS.border },
  vehicleIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primaryLight },
  vehicleName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  vehicleDetail: { fontSize: 12.5, color: COLORS.gray, marginTop: 2 },
  noVehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, marginBottom: 4, gap: 10 },
  noVehicleText: { flex: 1, fontSize: 14, fontWeight: '400', color: COLORS.accent },

  // Route card (matches HomeScreen / SearchScreen)
  routeCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBg,
    borderRadius: 16, padding: 14, marginBottom: 12, gap: 12,
    borderWidth: 1, borderColor: COLORS.border,
    ...CURVE,
  },
  routeLeft: { alignItems: 'center', gap: 3 },
  routeDot: { width: 8, height: 8, borderRadius: 4 },
  routeVertLine: { width: 2, height: 22, backgroundColor: COLORS.border },
  routeInputs: { flex: 1 },
  routeInputTouch: { paddingVertical: 6 },
  routeInput: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  placeholder: { color: COLORS.gray, fontWeight: '400' },
  routeInputDivider: { height: 1, borderTopWidth: 1, borderTopColor: COLORS.border },
  swapBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center',
    ...CURVE,
  },
  pinHint: { fontSize: 11.5, color: COLORS.gray, marginBottom: 8, lineHeight: 16 },

  // Multi-stop toggle
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: COLORS.border, marginBottom: 4 },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  toggleSub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },

  // Stops
  stopsContainer: { backgroundColor: '#f8faff', borderRadius: 16, padding: 16, marginVertical: 8, borderWidth: 1, borderColor: COLORS.border },
  stopsHint: { fontSize: 12, color: COLORS.gray, marginBottom: 16, lineHeight: 18 },
  stopRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12, gap: 8 },
  stopNumCol: { alignItems: 'center', width: 28, paddingTop: 4 },
  stopLine: { width: 2, height: 14, backgroundColor: COLORS.border },
  stopNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginVertical: 2 },
  stopNumText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  stopFields: { flex: 1, gap: 8 },
  stopCityBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 11, gap: 8 },
  stopCityText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  stopRemoveBtn: { paddingTop: 8 },
  addStopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.primary, borderStyle: 'dashed', marginTop: 4 },
  addStopText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },

  // Modals
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },

  // Vehicle picker items
  vehiclePickerItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.border, gap: 12 },
  vehiclePickerItemActive: { borderColor: COLORS.primary, backgroundColor: '#eff6ff' },
  vehiclePickerName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary },
  vehiclePickerDetail: { fontSize: 12.5, color: COLORS.gray, marginTop: 2 },

  // Match Banner
  matchBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderRadius: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.secondary + '30', backgroundColor: '#f0fdf4' },
  matchIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary + '15', alignItems: 'center', justifyContent: 'center' },
  matchTitle: { fontSize: 13, fontWeight: '700', color: COLORS.secondary },
  matchSub: { fontSize: 11, color: COLORS.secondary + 'CC', marginTop: 1 },

  // Ride Type
  rideTypeRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  rideTypeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, paddingVertical: 12, backgroundColor: COLORS.cardBg },
  rideTypeBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  rideTypeText: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary },
  rideTypeTextActive: { color: COLORS.primary, fontWeight: '700' },

  returnLegBox: { backgroundColor: '#f8faff', borderRadius: 14, padding: 14, marginTop: 10, marginBottom: 4, borderWidth: 1, borderColor: COLORS.border },
  returnLegHint: { fontSize: 12, color: COLORS.gray, marginBottom: 12, lineHeight: 18 },
  quickChipsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  quickChip: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: '#fff', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  quickChipText: { fontSize: 11.5, fontWeight: '700', color: COLORS.primary },

  postBtn: { marginTop: 24 },
});
