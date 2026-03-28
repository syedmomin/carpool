import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS, PrimaryButton, FormInput, GradientHeader, Chip } from '../../components';
import { useApp } from '../../context/AppContext';
import { showImagePickerOptions } from '../../utils/imagePicker';
import { VEHICLE_TYPES } from '../../data/mockData';

export default function VehicleSetupScreen({ navigation, route }) {
  const { registerVehicle, updateVehicle, getVehicleById, currentUser } = useApp();
  const vehicleId = route?.params?.vehicleId;
  const existing = vehicleId ? getVehicleById(vehicleId) : null;

  const [form, setForm] = useState({
    type: existing?.type || '',
    brand: existing?.brand || '',
    model: existing?.model || '',
    color: existing?.color || '',
    plateNumber: existing?.plateNumber || '',
    totalSeats: existing?.totalSeats?.toString() || '',
  });
  const [ac, setAc] = useState(!!existing?.ac);
  const [wifi, setWifi] = useState(!!existing?.wifi);
  const [images, setImages] = useState(existing?.images || []);
  const [loading, setLoading] = useState(false);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSave = () => {
    if (!form.type || !form.brand || !form.plateNumber || !form.totalSeats) {
      Alert.alert('Error', 'Please fill all required fields!');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const data = { ...form, totalSeats: parseInt(form.totalSeats), ac, wifi, images };
      if (existing) {
        updateVehicle(vehicleId, data);
        Alert.alert('Updated!', 'Vehicle updated successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        registerVehicle(data);
        Alert.alert('Congratulations!', 'Vehicle registered successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
      setLoading(false);
    }, 1000);
  };

  const [imgUploading, setImgUploading] = useState(false);

  const addVehicleImage = () => {
    showImagePickerOptions(async (result) => {
      if (result.cancelled) return;
      if (result.error) { Alert.alert('Upload Error', result.error); return; }
      setImgUploading(true);
      setImages(prev => [...prev, result.url]);
      setImgUploading(false);
    });
  };

  const FIELDS = [
    { key: 'brand',       label: 'Brand & Model *',  placeholder: 'e.g. Toyota Corolla', icon: 'car-outline' },
    { key: 'model',       label: 'Year',              placeholder: 'e.g. 2022',           icon: 'calendar-outline', type: 'numeric' },
    { key: 'color',       label: 'Color',             placeholder: 'e.g. White',          icon: 'color-palette-outline' },
    { key: 'plateNumber', label: 'Number Plate *',    placeholder: 'e.g. KHI-2022',       icon: 'card-outline' },
    { key: 'totalSeats',  label: 'Total Seats *',     placeholder: 'e.g. 4',              icon: 'people-outline', type: 'numeric' },
  ];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.container}>
        <GradientHeader
          colors={GRADIENTS.purple}
          title={existing ? 'Edit Vehicle' : 'Register Vehicle'}
          subtitle={existing ? 'Update your vehicle details' : 'Add your vehicle details and photos'}
          onBack={() => navigation.goBack()}
        />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* Vehicle Type */}
          <Text style={styles.sectionTitle}>Vehicle Type</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
            {VEHICLE_TYPES.map(type => (
              <Chip
                key={type}
                label={type}
                icon={type === 'Car' ? 'car-outline' : type === 'Bus' ? 'bus-outline' : 'car-sport-outline'}
                active={form.type === type}
                onPress={() => update('type', type)}
                color={COLORS.purple}
                style={styles.typeChip}
              />
            ))}
          </ScrollView>

          {/* Photos */}
          <Text style={styles.sectionTitle}>Vehicle Photos</Text>
          <Text style={styles.photoHint}>Uploading clear photos helps you get more bookings</Text>
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
            <TouchableOpacity style={styles.addPhotoBtn} onPress={addVehicleImage} disabled={imgUploading}>
              {imgUploading
                ? <ActivityIndicator color={COLORS.primary} />
                : <><Ionicons name="camera-outline" size={28} color={COLORS.primary} /><Text style={styles.addPhotoText}>Add Photo</Text></>
              }
            </TouchableOpacity>
          </ScrollView>

          {/* Form Fields */}
          <Text style={styles.sectionTitle}>Vehicle Details</Text>
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

          {/* Features */}
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresRow}>
            <Chip label="AC"   icon="snow-outline" active={ac}   onPress={() => setAc(!ac)}     color={COLORS.purple} style={styles.featureChip} />
            <Chip label="WiFi" icon="wifi-outline"  active={wifi} onPress={() => setWifi(!wifi)} color={COLORS.purple} style={styles.featureChip} />
          </View>

          <PrimaryButton
            title={existing ? 'Save Changes' : 'Register Vehicle'}
            onPress={handleSave}
            loading={loading}
            icon="checkmark-circle-outline"
            colors={GRADIENTS.purple}
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
  body: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginTop: 20, marginBottom: 12 },
  typeScroll: { marginBottom: 4 },
  typeChip: { marginRight: 10 },
  photoHint: { fontSize: 12, color: COLORS.gray, marginBottom: 12, lineHeight: 18 },
  photosScroll: { flexDirection: 'row', marginBottom: 4 },
  photoWrapper: { position: 'relative', marginRight: 10 },
  photo: { width: 100, height: 80, borderRadius: 12 },
  photoDeleteBtn: { position: 'absolute', top: -6, right: -6 },
  addPhotoBtn: { width: 100, height: 80, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.lightGray },
  addPhotoText: { fontSize: 11, color: COLORS.primary, marginTop: 4 },
  featuresRow: { flexDirection: 'row', gap: 12 },
  featureChip: { flex: 1, justifyContent: 'center', paddingVertical: 14 },
});
