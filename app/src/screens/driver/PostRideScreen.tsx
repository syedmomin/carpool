import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Switch, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, PrimaryButton, FormInput, SearchInput, GradientHeader } from '../../components';
import { DatePickerInput, TimePickerInput } from '../../components/DateTimePicker';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { useGlobalModal } from '../../context/GlobalModalContext';
import { parseApiError } from '../../utils/errorMessages';
import CitySearchModal from '../../components/CitySearchModal';
import { useFocusEffect } from '@react-navigation/native';
import { vehiclesApi, scheduleRequestsApi } from '../../services/api';
import { haptics } from '../../utils/haptics';

const TEXT_FIELDS = [
  { key: 'pricePerSeat', label: 'Price Per Seat (Rs) *', icon: 'cash-outline', placeholder: 'e.g. 1500', type: 'numeric' },
  { key: 'pickupPoint', label: 'Pickup Location', icon: 'location-outline', placeholder: 'e.g. Karachi Cantt Station' },
  { key: 'dropPoint', label: 'Drop Location', icon: 'flag-outline', placeholder: 'e.g. Larkana Bus Stop' },
];


export default function PostRideScreen({ navigation }) {
  const { postRide, currentUser } = useApp();
  const { showToast } = useToast();
  const { showModal } = useGlobalModal();

  const [driverVehicles, setDriverVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useFocusEffect(useCallback(() => {
    vehiclesApi.myVehicles().then(({ data }) => {
      if (data?.data) {
        setDriverVehicles(data.data);
        setSelectedVehicle(prev => prev || data.data.find(v => v.isActive) || data.data[0] || null);
      }
    });
  }, []));

  const [vehiclePickerOpen, setVehiclePickerOpen] = useState(false);

  const [form, setForm] = useState({
    from: '', to: '', date: '', departureTime: '', arrivalTime: '',
    pricePerSeat: '', pickupPoint: '', dropPoint: '', description: '',
  });
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

  const vehicleSeats = selectedVehicle?.totalSeats || '—';
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
    haptics.impact();
    try {
      setLoading(true);
      const stopsPayload = isMultiStop
        ? stops.map((s, i) => ({ city: s.city, order: i + 1, arrivalTime: s.arrivalTime || '' }))
        : [];

      const payload = {
        ...form,
        driverId: currentUser?.id,
        vehicleId: selectedVehicle.id,
        pricePerSeat: parseInt(form.pricePerSeat),
        totalSeats: selectedVehicle.totalSeats,
        amenities: vehicleAmenities,
        isMultiStop,
        stops: stopsPayload,
      };

      const { data, error } = await postRide(payload);

      if (error) {
        showToast(parseApiError(error), 'error');
      } else {
        haptics.success();
        showToast('Ride posted successfully!', 'success');
        // Reset form
        setForm({ from: '', to: '', date: '', departureTime: '', arrivalTime: '', pricePerSeat: '', pickupPoint: '', dropPoint: '', description: '' });
        navigation.navigate('MyRides');
      }
    } catch (err) {
      showToast('An unexpected error occurred. Please try again.', 'error');
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
        <GradientHeader
          colors={GRADIENTS.teal as any}
          title="Post a Ride"
          subtitle="Share your route and find passengers"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={[styles.body, { paddingBottom: 100 }]} keyboardShouldPersistTaps="handled">

          {/* ── Vehicle Selector ─────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Vehicle</Text>
          {driverVehicles.length === 0 ? (
            <TouchableOpacity style={styles.noVehicleCard} onPress={() => navigation.navigate('VehicleSetup')}>
              <Ionicons name="warning-outline" size={20} color={COLORS.accent} />
              <Text style={styles.noVehicleText}>Register your vehicle first →</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.vehicleSelector}
              onPress={() => driverVehicles.length > 1 && setVehiclePickerOpen(true)}
              activeOpacity={driverVehicles.length > 1 ? 0.7 : 1}
            >
              <LinearGradient colors={GRADIENTS.teal as any} style={styles.vehicleIconBox}>
                <Ionicons name="car-sport" size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{selectedVehicle?.brand || 'No vehicle'}</Text>
                <Text style={styles.vehicleDetail}>
                  {selectedVehicle?.plateNumber} • {vehicleSeats} seats
                  {vehicleAmenities.length > 0 ? ` • ${vehicleAmenities.join(', ')}` : ''}
                </Text>
              </View>
              {driverVehicles.length > 1 && <Ionicons name="chevron-down" size={16} color={COLORS.gray} />}
            </TouchableOpacity>
          )}

          {/* ── Route ────────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeRow}>
            <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal('from')}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.primary }]} />
              <Text style={[styles.cityBtnText, !form.from && styles.placeholder]}>{form.from || 'Leaving From?'}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { update('from', form.to); update('to', form.from); }} style={styles.swapBtn}>
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cityBtn} onPress={() => setCityModal('to')}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={[styles.cityBtnText, !form.to && styles.placeholder]}>{form.to || 'Going To?'}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* ── Route Matching Suggestions ────────────────────────────────── */}
          {matchCount > 0 && (
            <TouchableOpacity 
              style={styles.matchBanner} 
              onPress={() => navigation.navigate('DriverApp', { 
                screen: 'OpenRequests', 
                params: { city: form.from, to: form.to } 
              })}
            >
              <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.matchGrad}>
                <View style={styles.matchIconBox}>
                  <Ionicons name="people" size={18} color={COLORS.secondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.matchTitle}>{matchCount} passengers waiting!</Text>
                  <Text style={styles.matchSub}>Found requests matching your route. View & bid now?</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.secondary} />
              </LinearGradient>
            </TouchableOpacity>
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
                <Ionicons name="information-circle-outline" size={13} color={COLORS.gray} /> Passengers can book any segment (e.g. Hyderabad → Multan)
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
                    <TouchableOpacity
                      style={styles.stopCityBtn}
                      onPress={() => setCityModal({ type: 'stop', idx })}
                    >
                      <Ionicons name="location-outline" size={16} color={COLORS.gray} />
                      <Text style={[styles.stopCityText, !stop.city && styles.placeholder]}>
                        {stop.city || 'Select stop city'}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color={COLORS.gray} />
                    </TouchableOpacity>
                    <TimePickerInput
                      label="Arrival Time at Stop"
                      value={stop.arrivalTime}
                      onChange={(v) => updateStop(idx, 'arrivalTime', v)}
                    />
                  </View>
                  <TouchableOpacity style={styles.stopRemoveBtn} onPress={() => removeStop(idx)}>
                    <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity style={styles.addStopBtn} onPress={addStop}>
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addStopText}>Add Intermediate Stop</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Schedule ─────────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Schedule</Text>
          <DatePickerInput
            label="Travel Date *"
            value={form.date}
            onChange={v => update('date', v)}
            minDate={new Date()}
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
          <Text style={styles.sectionTitle}>Fare & Pickup</Text>
          {TEXT_FIELDS.map(field => (
            <FormInput
              key={field.key}
              label={field.label}
              icon={field.icon as any}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChangeText={v => update(field.key, v)}
              keyboardType={(field.type || 'default') as any}
            />
          ))}

          <FormInput
            label="Note / Description"
            icon="document-text-outline"
            placeholder="e.g. 1 stop in Hyderabad, AC will be on..."
            value={form.description}
            onChangeText={v => update('description', v)}
            multiline
            numberOfLines={3}
          />

          <PrimaryButton
            title="Post Ride"
            onPress={handlePost}
            loading={loading}
            icon="rocket-outline"
            colors={GRADIENTS.teal as any}
            style={{ marginTop: 24 }}
          />
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity onPress={() => setVehiclePickerOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={driverVehicles}
              keyExtractor={item => item.id}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.vehiclePickerItem, selectedVehicle?.id === item.id && styles.vehiclePickerItemActive]}
                  onPress={() => { setSelectedVehicle(item); setVehiclePickerOpen(false); }}
                >
                  <Ionicons name="car-sport-outline" size={22} color={selectedVehicle?.id === item.id ? COLORS.primary : COLORS.gray} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.vehiclePickerName, selectedVehicle?.id === item.id && { color: COLORS.primary }]}>{item.brand}</Text>
                    <Text style={styles.vehiclePickerDetail}>{item.plateNumber} • {item.totalSeats} seats</Text>
                  </View>
                  {selectedVehicle?.id === item.id && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
                </TouchableOpacity>
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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 16, marginBottom: 12 },

  // Vehicle selector
  vehicleSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 12, marginBottom: 4, borderWidth: 1.5, borderColor: COLORS.border, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  vehicleIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  vehicleName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  vehicleDetail: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  noVehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, marginBottom: 4, gap: 10 },
  noVehicleText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.accent },

  // Route
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 13, gap: 8 },
  cityDot: { width: 8, height: 8, borderRadius: 4 },
  cityBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  placeholder: { color: COLORS.gray, fontWeight: '400' },
  swapBtn: { padding: 8, backgroundColor: COLORS.lightGray, borderRadius: 10 },

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
  vehiclePickerName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  vehiclePickerDetail: { fontSize: 12, color: COLORS.gray, marginTop: 2 },

  // Match Banner
  matchBanner: { borderRadius: 14, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: COLORS.secondary + '30' },
  matchGrad: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  matchIconBox: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.secondary + '15', alignItems: 'center', justifyContent: 'center' },
  matchTitle: { fontSize: 13, fontWeight: '800', color: COLORS.secondary },
  matchSub: { fontSize: 11, color: COLORS.secondary + 'CC', marginTop: 1 },
});
