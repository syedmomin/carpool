import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, PrimaryButton, FormInput, SearchInput, GradientHeader, Chip } from '../../components';
import { useApp } from '../../context/AppContext';
import { useToast } from '../../context/ToastContext';
import { CITIES } from '../../data/mockData';

const AMENITY_OPTIONS = ['AC', 'WiFi', 'Music', 'Water Bottle', 'Snacks', 'Blanket', 'Charging Port'];

const FIELDS = [
  { key: 'date',          label: 'Travel Date *',         icon: 'calendar-outline', placeholder: '2026-03-30' },
  { key: 'departureTime', label: 'Departure Time *',       icon: 'time-outline',     placeholder: 'e.g. 08:00 AM' },
  { key: 'arrivalTime',   label: 'Estimated Arrival',      icon: 'time-outline',     placeholder: 'e.g. 02:00 PM' },
  { key: 'pricePerSeat',  label: 'Price Per Seat (Rs) *',  icon: 'cash-outline',     placeholder: 'e.g. 1500', type: 'numeric' },
  { key: 'seats',         label: 'Available Seats *',      icon: 'people-outline',   placeholder: 'e.g. 3', type: 'numeric' },
  { key: 'pickupPoint',   label: 'Pickup Location',        icon: 'location-outline', placeholder: 'e.g. Karachi Cantt Station' },
  { key: 'dropPoint',     label: 'Drop Location',          icon: 'flag-outline',     placeholder: 'e.g. Larkana Bus Stop' },
];

export default function PostRideScreen({ navigation }) {
  const { postRide, currentUser, getVehicleByDriver } = useApp();
  const { showToast } = useToast();
  const vehicle = getVehicleByDriver(currentUser?.id);

  const [form, setForm] = useState({ from: '', to: '', date: '', departureTime: '', arrivalTime: '', pricePerSeat: '', seats: '', pickupPoint: '', dropPoint: '', description: '' });
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityModal, setCityModal] = useState(null);
  const [citySearch, setCitySearch] = useState('');

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const toggleAmenity = (a) => setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const handlePost = () => {
    if (!form.from || !form.to || !form.date || !form.departureTime || !form.pricePerSeat || !form.seats) {
      Alert.alert('Error', 'Please fill all required fields!');
      return;
    }
    if (!vehicle) {
      Alert.alert('Vehicle Required', 'Please register your vehicle first.', [
        { text: 'Add Vehicle', onPress: () => navigation.navigate('VehicleSetup') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    setLoading(true);
    setTimeout(() => {
      postRide({
        ...form,
        driverId: currentUser?.id,
        vehicleId: vehicle?.id,
        pricePerSeat: parseInt(form.pricePerSeat),
        totalSeats: parseInt(form.seats),
        amenities,
      });
      setLoading(false);
      showToast('Ride posted successfully! Passengers have been notified.', 'success');
      setTimeout(() => navigation.navigate('MyRides'), 800);
    }, 1200);
  };

  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <GradientHeader
          colors={GRADIENTS.teal}
          title="Post a Ride"
          subtitle="Share your route and find passengers"
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Vehicle Info */}
          {vehicle ? (
            <View style={styles.vehicleBanner}>
              <Ionicons name="car-sport" size={22} color={COLORS.primary} />
              <Text style={styles.vehicleBannerText}>{vehicle.brand} • {vehicle.plateNumber}</Text>
              <View style={styles.activeDot} />
            </View>
          ) : (
            <TouchableOpacity style={styles.noVehicleCard} onPress={() => navigation.navigate('VehicleSetup')}>
              <Ionicons name="warning-outline" size={20} color={COLORS.accent} />
              <Text style={styles.noVehicleText}>Please register your vehicle first →</Text>
            </TouchableOpacity>
          )}

          {/* Route */}
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeRow}>
            <TouchableOpacity style={styles.cityBtn} onPress={() => { setCityModal('from'); setCitySearch(''); }}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.primary }]} />
              <Text style={[styles.cityBtnText, !form.from && styles.placeholder]}>{form.from || 'Leaving From?'}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { update('from', form.to); update('to', form.from); }} style={styles.swapBtn}>
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cityBtn} onPress={() => { setCityModal('to'); setCitySearch(''); }}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={[styles.cityBtnText, !form.to && styles.placeholder]}>{form.to || 'Going To?'}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <Text style={styles.sectionTitle}>Details</Text>
          {FIELDS.map(field => (
            <FormInput
              key={field.key}
              label={field.label}
              icon={field.icon}
              placeholder={field.placeholder}
              value={form[field.key]}
              onChangeText={v => update(field.key, v)}
              keyboardType={field.type || 'default'}
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

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITY_OPTIONS.map(a => (
              <Chip
                key={a}
                label={a}
                active={amenities.includes(a)}
                onPress={() => toggleAmenity(a)}
                color={COLORS.teal}
              />
            ))}
          </View>

          <PrimaryButton
            title="Post Ride"
            onPress={handlePost}
            loading={loading}
            icon="rocket-outline"
            colors={GRADIENTS.teal}
            style={{ marginTop: 24 }}
          />
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* City Modal */}
        <Modal visible={!!cityModal} animationType="slide" onRequestClose={() => setCityModal(null)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{cityModal === 'from' ? 'Departure City' : 'Destination City'}</Text>
              <TouchableOpacity onPress={() => setCityModal(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <SearchInput
              placeholder="Search city..."
              value={citySearch}
              onChangeText={setCitySearch}
              onClear={() => setCitySearch('')}
              style={styles.citySearch}
            />
            <FlatList
              data={filteredCities}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.cityItem} onPress={() => { update(cityModal, item); setCityModal(null); }}>
                  <Ionicons name="location-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.cityItemText}>{item}</Text>
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
  vehicleBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
  vehicleBannerText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.primary },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.secondary },
  noVehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
  noVehicleText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.accent },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 8, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 13, gap: 8 },
  cityDot: { width: 8, height: 8, borderRadius: 4 },
  cityBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  placeholder: { color: COLORS.gray, fontWeight: '400' },
  swapBtn: { padding: 8, backgroundColor: COLORS.lightGray, borderRadius: 10 },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  citySearch: { margin: 16 },
  cityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  cityItemText: { fontSize: 16, color: COLORS.textPrimary },
});
