import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Modal, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { CITIES } from '../../data/mockData';

const AMENITY_OPTIONS = ['AC', 'WiFi', 'Music', 'Water Bottle', 'Snacks', 'Blanket', 'Charging Port'];

export default function PostRideScreen({ navigation }) {
  const { postRide, currentUser, getVehicleByDriver } = useApp();
  const vehicle = getVehicleByDriver(currentUser?.id);

  const [form, setForm] = useState({
    from: '', to: '', date: '', departureTime: '',
    arrivalTime: '', pricePerSeat: '', seats: '',
    pickupPoint: '', dropPoint: '', description: '',
  });
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cityModal, setCityModal] = useState(null);
  const [citySearch, setCitySearch] = useState('');

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const toggleAmenity = (a) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);
  };

  const handlePost = () => {
    if (!form.from || !form.to || !form.date || !form.departureTime || !form.pricePerSeat || !form.seats) {
      Alert.alert('Error', 'Sab zaruri fields bharen!');
      return;
    }
    if (!vehicle) {
      Alert.alert('Vehicle Chahiye', 'Pehle apna vehicle register karen.', [
        { text: 'Vehicle Add Karo', onPress: () => navigation.navigate('VehicleSetup') },
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
      Alert.alert('Mubarak!', 'Aapki ride successfully post ho gayi! Passengers ab book kar sakte hain.', [
        { text: 'My Rides Dekho', onPress: () => navigation.navigate('MyRides') },
      ]);
    }, 1200);
  };

  const filteredCities = CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase()));

  const fields = [
    { key: 'date', label: 'Safar Ki Tarikh *', icon: 'calendar-outline', placeholder: '2026-03-30', type: 'default' },
    { key: 'departureTime', label: 'Rawangi Ka Waqt *', icon: 'time-outline', placeholder: 'e.g. 08:00 AM' },
    { key: 'arrivalTime', label: 'Pahunchne Ka Waqt', icon: 'time-outline', placeholder: 'e.g. 02:00 PM' },
    { key: 'pricePerSeat', label: 'Har Seat Ka Kiraaya (Rs) *', icon: 'cash-outline', placeholder: 'e.g. 1500', type: 'numeric' },
    { key: 'seats', label: 'Available Seats *', icon: 'people-outline', placeholder: 'e.g. 3', type: 'numeric' },
    { key: 'pickupPoint', label: 'Pickup Location', icon: 'location-outline', placeholder: 'e.g. Karachi Cantt Station' },
    { key: 'dropPoint', label: 'Drop Location', icon: 'flag-outline', placeholder: 'e.g. Larkana Adda' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <LinearGradient colors={['#00897b', '#00695c']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Ride Post Karen</Text>
          <Text style={styles.headerSub}>Apna route share karen, passengers milenge</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Vehicle Info */}
          {vehicle ? (
            <View style={styles.vehicleBanner}>
              <Ionicons name="car-sport" size={22} color={COLORS.primary} />
              <Text style={styles.vehicleBannerText}>{vehicle.brand} • {vehicle.plateNumber}</Text>
              <View style={[styles.dot, { backgroundColor: COLORS.secondary, width: 8, height: 8, borderRadius: 4 }]} />
            </View>
          ) : (
            <TouchableOpacity style={styles.noVehicleCard} onPress={() => navigation.navigate('VehicleSetup')}>
              <Ionicons name="warning-outline" size={20} color={COLORS.accent} />
              <Text style={styles.noVehicleText}>Vehicle register karein pehle →</Text>
            </TouchableOpacity>
          )}

          {/* Route */}
          <Text style={styles.sectionTitle}>Route</Text>
          <View style={styles.routeRow}>
            <TouchableOpacity style={styles.cityBtn} onPress={() => { setCityModal('from'); setCitySearch(''); }}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.primary }]} />
              <Text style={[styles.cityBtnText, !form.from && styles.placeholder]}>{form.from || 'Kahan Se?'}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { update('from', form.to); update('to', form.from); }}
              style={styles.swapBtn}
            >
              <Ionicons name="swap-vertical" size={18} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cityBtn} onPress={() => { setCityModal('to'); setCitySearch(''); }}>
              <View style={[styles.cityDot, { backgroundColor: COLORS.secondary }]} />
              <Text style={[styles.cityBtnText, !form.to && styles.placeholder]}>{form.to || 'Kahan Tak?'}</Text>
              <Ionicons name="chevron-down" size={16} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <Text style={styles.sectionTitle}>Details</Text>
          {fields.map(field => (
            <View key={field.key} style={styles.fieldBlock}>
              <Text style={styles.label}>{field.label}</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name={field.icon} size={18} color={COLORS.gray} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChangeText={v => update(field.key, v)}
                  keyboardType={field.type || 'default'}
                  placeholderTextColor={COLORS.gray}
                />
              </View>
            </View>
          ))}

          {/* Description */}
          <Text style={styles.label}>Note / Description</Text>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start' }]}>
            <Ionicons name="document-text-outline" size={18} color={COLORS.gray} style={[styles.inputIcon, { marginTop: 14 }]} />
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
              placeholder="e.g. 1 stop Hyderabad mein, AC on rahega..."
              value={form.description}
              onChangeText={v => update('description', v)}
              multiline
              placeholderTextColor={COLORS.gray}
            />
          </View>

          {/* Amenities */}
          <Text style={styles.sectionTitle}>Sahulat (Amenities)</Text>
          <View style={styles.amenitiesGrid}>
            {AMENITY_OPTIONS.map(a => (
              <TouchableOpacity
                key={a}
                style={[styles.amenityChip, amenities.includes(a) && styles.amenityChipActive]}
                onPress={() => toggleAmenity(a)}
              >
                <Text style={[styles.amenityChipText, amenities.includes(a) && { color: '#fff' }]}>{a}</Text>
                {amenities.includes(a) && <Ionicons name="checkmark" size={14} color="#fff" />}
              </TouchableOpacity>
            ))}
          </View>

          <PrimaryButton
            title="Ride Post Karen"
            onPress={handlePost}
            loading={loading}
            icon="rocket-outline"
            color="#00897b"
            style={{ marginTop: 24 }}
          />
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* City Modal */}
        <Modal visible={!!cityModal} animationType="slide" onRequestClose={() => setCityModal(null)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{cityModal === 'from' ? 'Rawangi City' : 'Manzil City'}</Text>
              <TouchableOpacity onPress={() => setCityModal(null)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            <View style={styles.citySearchBox}>
              <Ionicons name="search-outline" size={18} color={COLORS.gray} />
              <TextInput
                style={styles.citySearchInput}
                placeholder="City search karen..."
                value={citySearch}
                onChangeText={setCitySearch}
                autoFocus
                placeholderTextColor={COLORS.gray}
              />
            </View>
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
  header: { paddingTop: 55, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  body: { padding: 20, paddingBottom: 40 },
  vehicleBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
  vehicleBannerText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.primary },
  noVehicleCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff8e1', borderRadius: 12, padding: 14, marginBottom: 20, gap: 10 },
  noVehicleText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.accent },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cityBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 13, gap: 8 },
  cityDot: { width: 8, height: 8, borderRadius: 4 },
  cityBtnText: { flex: 1, fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  placeholder: { color: COLORS.gray, fontWeight: '400' },
  swapBtn: { padding: 8, backgroundColor: COLORS.lightGray, borderRadius: 10 },
  fieldBlock: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  amenityChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 9, gap: 6, borderWidth: 1.5, borderColor: COLORS.border },
  amenityChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  amenityChipText: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 55, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
  citySearchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, margin: 16, borderRadius: 12, paddingHorizontal: 12 },
  citySearchInput: { flex: 1, paddingVertical: 12, paddingLeft: 8, fontSize: 15, color: COLORS.textPrimary },
  cityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 12 },
  cityItemText: { fontSize: 16, color: COLORS.textPrimary },
  dot: {},
});
