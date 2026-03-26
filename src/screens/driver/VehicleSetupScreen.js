import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, PrimaryButton } from '../../components';
import { useApp } from '../../context/AppContext';
import { VEHICLE_TYPES } from '../../data/mockData';

export default function VehicleSetupScreen({ navigation }) {
  const { registerVehicle, getVehicleByDriver, currentUser } = useApp();
  const existing = getVehicleByDriver(currentUser?.id);

  const [form, setForm] = useState({
    type: existing?.type || '',
    brand: existing?.brand || '',
    model: existing?.model || '',
    color: existing?.color || '',
    plateNumber: existing?.plateNumber || '',
    totalSeats: existing?.totalSeats?.toString() || '',
  });
  const [ac, setAc] = useState(existing?.ac || false);
  const [wifi, setWifi] = useState(existing?.wifi || false);
  const [images, setImages] = useState(existing?.images || []);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.type || !form.brand || !form.plateNumber || !form.totalSeats) {
      Alert.alert('Error', 'Sab zaruri fields bharen!');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      registerVehicle({ ...form, totalSeats: parseInt(form.totalSeats), ac, wifi, images });
      setLoading(false);
      Alert.alert('Mubarak!', 'Vehicle successfully register ho gaya!', [
        { text: 'Theek Hai', onPress: () => navigation.goBack() },
      ]);
    }, 1000);
  };

  const addSampleImage = () => {
    const sampleImgs = [
      'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400',
      'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?w=400',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    ];
    const img = sampleImgs[images.length % sampleImgs.length];
    setImages(prev => [...prev, img]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <LinearGradient colors={['#7b1fa2', '#4a148c']} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{existing ? 'Vehicle Update' : 'Vehicle Register'}</Text>
          <Text style={styles.headerSub}>Gaari ki details aur photos add karen</Text>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Vehicle Type */}
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {VEHICLE_TYPES.map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.typeChip, form.type === type && styles.typeChipActive]}
                onPress={() => update('type', type)}
              >
                <Ionicons
                  name={type === 'Car' ? 'car-outline' : type === 'Bus' ? 'bus-outline' : 'car-sport-outline'}
                  size={18}
                  color={form.type === type ? '#fff' : COLORS.gray}
                />
                <Text style={[styles.typeChipText, form.type === type && { color: '#fff' }]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Photos */}
          <Text style={styles.sectionTitle}>Vehicle Photos</Text>
          <Text style={styles.photoHint}>Clear photos upload karne se zyada bookings milti hain</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosScroll}>
            {images.map((img, i) => (
              <View key={i} style={styles.photoWrapper}>
                <Image source={{ uri: img }} style={styles.photo} />
                <TouchableOpacity
                  style={styles.photoDeleteBtn}
                  onPress={() => setImages(prev => prev.filter((_, j) => j !== i))}
                >
                  <Ionicons name="close-circle" size={22} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotoBtn} onPress={addSampleImage}>
              <Ionicons name="camera-outline" size={28} color={COLORS.primary} />
              <Text style={styles.addPhotoText}>Photo Add</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Form Fields */}
          {[
            { key: 'brand', label: 'Brand & Model *', placeholder: 'e.g. Toyota Corolla', icon: 'car-outline' },
            { key: 'model', label: 'Year', placeholder: 'e.g. 2022', icon: 'calendar-outline', type: 'numeric' },
            { key: 'color', label: 'Color', placeholder: 'e.g. White', icon: 'color-palette-outline' },
            { key: 'plateNumber', label: 'Number Plate *', placeholder: 'e.g. KHI-2022', icon: 'card-outline' },
            { key: 'totalSeats', label: 'Total Seats *', placeholder: 'e.g. 4', icon: 'people-outline', type: 'numeric' },
          ].map(field => (
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

          {/* Features */}
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresRow}>
            <TouchableOpacity
              style={[styles.featureToggle, ac && styles.featureToggleActive]}
              onPress={() => setAc(!ac)}
            >
              <Ionicons name="snow-outline" size={20} color={ac ? '#fff' : COLORS.gray} />
              <Text style={[styles.featureText, ac && { color: '#fff' }]}>AC</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.featureToggle, wifi && styles.featureToggleActive]}
              onPress={() => setWifi(!wifi)}
            >
              <Ionicons name="wifi-outline" size={20} color={wifi ? '#fff' : COLORS.gray} />
              <Text style={[styles.featureText, wifi && { color: '#fff' }]}>WiFi</Text>
            </TouchableOpacity>
          </View>

          <PrimaryButton
            title={existing ? 'Update Karen' : 'Register Karen'}
            onPress={handleSave}
            loading={loading}
            icon="checkmark-circle-outline"
            color="#7b1fa2"
            style={{ marginTop: 24 }}
          />
          <View style={{ height: 24 }} />
        </ScrollView>
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
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  typeScroll: { marginBottom: 4 },
  typeChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.lightGray, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 10, gap: 6, borderWidth: 1.5, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: '#7b1fa2', borderColor: '#7b1fa2' },
  typeChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  photoHint: { fontSize: 12, color: COLORS.gray, marginBottom: 12, lineHeight: 18 },
  photosScroll: { flexDirection: 'row', marginBottom: 4 },
  photoWrapper: { position: 'relative', marginRight: 10 },
  photo: { width: 100, height: 80, borderRadius: 12 },
  photoDeleteBtn: { position: 'absolute', top: -6, right: -6 },
  addPhotoBtn: { width: 100, height: 80, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightGray },
  addPhotoText: { fontSize: 11, color: COLORS.primary, marginTop: 4 },
  fieldBlock: { marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.4 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.border, backgroundColor: '#fff' },
  inputIcon: { marginLeft: 12 },
  input: { flex: 1, paddingHorizontal: 10, paddingVertical: 13, fontSize: 15, color: COLORS.textPrimary },
  featuresRow: { flexDirection: 'row', gap: 12 },
  featureToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightGray, borderRadius: 14, paddingVertical: 14, gap: 8, borderWidth: 1.5, borderColor: COLORS.border },
  featureToggleActive: { backgroundColor: '#7b1fa2', borderColor: '#7b1fa2' },
  featureText: { fontSize: 15, fontWeight: '700', color: COLORS.gray },
});
